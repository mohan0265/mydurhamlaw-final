// src/hooks/useRealtimeWebRTC.ts
// WebRTC to OpenAI Realtime (mic + reasoning).
// Voice turns are driven by server VAD (configured in your session function).
// We DO NOT send response.create for voice turns; only for manual text.
// Remote TTS is played from the Realtime server; we also capture its transcript
// via response.audio_transcript.delta/done so your UI can display assistant text.

// @ts-nocheck  // keeps things quiet while we port from JS

import { useCallback, useEffect, useRef, useState } from "react";

// ---- Env shim: support both Vite (import.meta.env) and Next (process.env) ----
const viteEnv =
  (typeof import.meta !== "undefined" && (import.meta as any).env) || undefined;

const DEBUG =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_VOICE === "true") ||
  (viteEnv && (viteEnv as any).VITE_DEBUG_VOICE === "true") ||
  (typeof window !== "undefined" && window.location.search.includes("debug=voice"));

const TTS_VOLUME =
  parseFloat(
    (typeof process !== "undefined" && (process.env.NEXT_PUBLIC_TTS_VOLUME as string)) ||
      (viteEnv && (viteEnv as any).VITE_TTS_VOLUME) ||
      "0.85"
  );

const TTS_RATE =
  parseFloat(
    (typeof process !== "undefined" && (process.env.NEXT_PUBLIC_TTS_RATE as string)) ||
      (viteEnv && (viteEnv as any).VITE_TTS_RATE) ||
      "0.95"
  );

// ---------------------------------------------------------------------------

export function useRealtimeWebRTC() {
  // ---- internals / refs ----
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const audioElRef = useRef<HTMLAudioElement | null>(null); // remote audio element
  const dcRef = useRef<RTCDataChannel | null>(null);        // single data channel
  const tokenRef = useRef<string | null>(null);
  const modelRef = useRef<string | null>(null);

  // optional session instructions passed via connect()
  const connectInstructionsRef = useRef<string | null>(null);

  // remote speaking pulse (visual only)
  const audioCtxRef = useRef<any>(null);
  const vadRemoteRef = useRef<{ alive: boolean; raf: number }>({ alive: false, raf: 0 });

  // track if assistant is currently replying (to gate barge-in cancel)
  const activeReplyRef = useRef<boolean>(false);

  // assistant text buffer (so we don't pollute user partials)
  const assistantBufRef = useRef<string>("");

  // local TTS element (for optional ElevenLabs playback)
  const localTTSRef = useRef<HTMLAudioElement | null>(null);

  // ---- public state ----
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "disconnecting">("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // NOTE: by design, `transcript` holds **assistant** final lines only.
  const [transcript, setTranscript] = useState<Array<{ id: string; text: string }>>([]);

  // NOTE: `partialTranscript` now represents **only the USER's live partial**.
  const [partialTranscript, setPartialTranscript] = useState("");

  const log = (...a: any[]) => { if (DEBUG) console.log("[RealtimeWebRTC]", ...a); };

  // ---------- helpers ----------
  const ensureAudioElement = () => {
    if (!audioElRef.current) {
      const el = new Audio();
      el.autoplay = true;
      el.playsInline = true;
      el.muted = false;
      el.volume = 1.0;
      audioElRef.current = el;
      // Do NOT append to the DOM visually; autoplay works without it
    }
    return audioElRef.current!;
  };

  // speaking pulse on remote stream (UI only)
  const startRemotePulse = (remoteStream: MediaStream) => {
    try {
      // @ts-ignore webkit prefix
      const ACtx = window.AudioContext || window.webkitAudioContext;
      if (!ACtx || !remoteStream) return;
      if (!audioCtxRef.current) audioCtxRef.current = new ACtx();
      const ctx = audioCtxRef.current;
      const src = ctx.createMediaStreamSource(remoteStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      const data = new Uint8Array(analyser.frequencyBinCount);
      src.connect(analyser);

      vadRemoteRef.current.alive = true;
      const tick = () => {
        if (!vadRemoteRef.current.alive) return;
        analyser.getByteTimeDomainData(data);
        let md = 0;
        for (let i = 0; i < data.length; i++) {
          const v = Math.abs(data[i] - 128);
          if (v > md) md = v;
        }
        setIsSpeaking(md > 10);
        if (vadRemoteRef.current.alive) vadRemoteRef.current.raf = requestAnimationFrame(tick);
      };
      vadRemoteRef.current.raf = requestAnimationFrame(tick);
    } catch {}
  };

  const stopRemotePulse = () => {
    vadRemoteRef.current.alive = false;
    if (vadRemoteRef.current.raf) cancelAnimationFrame(vadRemoteRef.current.raf);
    vadRemoteRef.current.raf = 0;
    setIsSpeaking(false);
  };

  // --- OPTIONAL: ElevenLabs local playback (not used unless you call playEleven) ---
  const playEleven = async (text: string) => {
    try {
      if (!text || !text.trim()) return;

      // stop/cleanup any previous local TTS
      if (localTTSRef.current) {
        try { localTTSRef.current.pause(); } catch {}
        try { URL.revokeObjectURL(localTTSRef.current.src); } catch {}
        localTTSRef.current = null;
      }

      // default path kept for your Netlify setup; switch to /api/tts-eleven if you add a Next API route
      const resp = await fetch("/.netlify/functions/tts-eleven", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, speed: 0.95 }),
      });
      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`TTS failed: ${err}`);
      }

      // stream to an <audio> element
      const buf = await resp.arrayBuffer();
      const blob = new Blob([buf], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      const el = new Audio();
      el.src = url;

      // soften & slow a touch (client-side)
      el.volume = TTS_VOLUME;   // 0.0 .. 1.0
      el.playbackRate = TTS_RATE; // e.g. 0.85-1.05

      el.onended = () => {
        try { URL.revokeObjectURL(url); } catch {}
        if (localTTSRef.current === el) localTTSRef.current = null;
        setIsSpeaking(false);
      };

      localTTSRef.current = el;
      setIsSpeaking(true);
      await el.play();
    } catch (e: any) {
      console.error(e);
      setLastError(String(e?.message || e));
      setIsSpeaking(false);
    }
  };

  // ---------- server messages ----------
  const handleServerEvent = (evt: MessageEvent) => {
    let msg: any;
    try { msg = JSON.parse(evt.data as any); } catch { return; }
    DEBUG && log("recv:", msg.type, msg);

    // Track reply activity for barge-in
    if (msg.type === "output_audio_buffer.started") {
      activeReplyRef.current = true;
    }
    if (msg.type === "output_audio_buffer.stopped" || msg.type === "response.done" || msg.type === "response.completed") {
      activeReplyRef.current = false;
    }

    // Errors
    if (msg.type === "error") {
      setLastError(msg.error?.message || "Server error");
      return;
    }

    // USER ASR (we keep partial here for UI; final is handled upstream by onUserFinal in useRealtimeVoice)
    if (msg.type === "transcript.partial" && typeof msg.text === "string") {
      setPartialTranscript(msg.text); // USER partial only
      return;
    }
    if (msg.type === "transcript.completed" && typeof msg.text === "string") {
      // USER final — do NOT push to assistant transcript; clear partial only.
      setPartialTranscript("");
      return;
    }

    // ASSISTANT TEXT (model output) — buffer deltas separately from user partial
    if (msg.type === "response.output_text.delta" && typeof msg.delta === "string") {
      assistantBufRef.current += msg.delta;
      return;
    }
    if (msg.type === "response.completed") {
      // Prefer buffered text; fallback to response.output_text if present
      let full = assistantBufRef.current;
      if (!full) {
        const out = msg.response?.output_text;
        full = Array.isArray(out) ? out.join("") : (typeof out === "string" ? out : "");
      }
      if (full && full.trim()) {
        setTranscript((old) => [...old, { id: msg.id || crypto.randomUUID(), text: full }]);
      }
      assistantBufRef.current = "";
      return;
    }

    // ASSISTANT SPEECH TRANSCRIPT (when server returns transcript of TTS)
    if (msg.type === "response.audio_transcript.delta" && typeof msg.delta === "string") {
      assistantBufRef.current += msg.delta;
      return;
    }
    if (msg.type === "response.audio_transcript.done") {
      const full = typeof msg.transcript === "string" ? msg.transcript
                 : (typeof msg.text === "string" ? msg.text : "");
      const finalText = (full || assistantBufRef.current || "").trim();
      if (finalText) {
        setTranscript((old) => [...old, { id: msg.id || crypto.randomUUID(), text: finalText }]);
      }
      assistantBufRef.current = "";
      return;
    }
  };

  // ---------- connect ----------
  const connect = useCallback(async ({ token, model, instructions }: { token: string; model: string; instructions?: string }) => {
    if (isConnected || status === "connecting") return;
    setStatus("connecting");
    setLastError(null);
    tokenRef.current = token;
    modelRef.current = model;
    connectInstructionsRef.current = instructions || null;

    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        DEBUG && log("pc state:", pc.connectionState);
        if (pc.connectionState === "connected") setIsConnected(true);
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected" || pc.connectionState === "closed") {
          setIsConnected(false);
          setStatus("idle");
        }
      };

      // Remote audio
      pc.ontrack = (e: RTCTrackEvent) => {
        const stream = (e?.streams && e.streams[0]) ? e.streams[0] : new MediaStream([e.track]);
        const el = ensureAudioElement();
        try { (el as any).srcObject = stream; } catch {}
        el.play().catch(() => {});
        startRemotePulse(stream);
      };

      // Data channel
      dcRef.current = pc.createDataChannel("oai-events");
      dcRef.current.onopen = () => {
        DEBUG && log("data channel open");
        // Send session.update with instructions if provided
        const instr = connectInstructionsRef.current;
        if (instr) {
          try {
            dcRef.current!.send(JSON.stringify({
              type: "session.update",
              session: { instructions: instr },
            }));
            DEBUG && log("session.update sent");
          } catch (err) {
            console.warn("Failed to send session.update:", err);
          }
        }
      };
      dcRef.current.onmessage = handleServerEvent;

      // Audio send/recv
      pc.addTransceiver("audio", { direction: "sendrecv" });

      // Mic
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        setLastError("Microphone permission denied");
        throw err;
      }
      micStreamRef.current = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      setIsListening(true);

      // Local barge-in: cancel only when a reply is active
      try {
        // @ts-ignore webkit prefix
        const ACtx = window.AudioContext || window.webkitAudioContext;
        if (ACtx) {
          const ctx = new ACtx();
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          const data = new Uint8Array(analyser.frequencyBinCount);
          src.connect(analyser);
          let speaking = false;
          const tick = () => {
            analyser.getByteTimeDomainData(data);
            let maxDev = 0;
            for (let i = 0; i < data.length; i++) {
              const v = Math.abs(data[i] - 128);
              if (v > maxDev) maxDev = v;
            }
            const nowSpeaking = maxDev > 10;
            if (!speaking && nowSpeaking && activeReplyRef.current && dcRef.current && dcRef.current.readyState === "open") {
              try { dcRef.current.send(JSON.stringify({ type: "response.cancel" })); } catch {}
            }
            speaking = nowSpeaking;
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      } catch {}

      // Offer/Answer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const url = `https://api.openai.com/v1/realtime?model=${encodeURIComponent(modelRef.current!)}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
          "Content-Type": "application/sdp",
          "OpenAI-Beta": "realtime=v1",
        },
        body: offer.sdp,
      });
      if (!resp.ok) throw new Error(await resp.text());
      const answer = await resp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      setStatus("connected");
      setIsConnected(true);
      DEBUG && log("connected");
    } catch (e: any) {
      console.error(e);
      setLastError(String(e?.message || e));
      try { if (pcRef.current) pcRef.current.close(); } catch {}
      pcRef.current = null;
      if (micStreamRef.current) { micStreamRef.current.getTracks().forEach((t) => t.stop()); micStreamRef.current = null; }
      stopRemotePulse();
      setIsListening(false);
      setIsConnected(false);
      setStatus("idle");
    }
  }, [isConnected, status]);

  // ---------- disconnect ----------
  const disconnect = useCallback(() => {
    setStatus("disconnecting");
    try {
      if (dcRef.current) { try { dcRef.current.close(); } catch {} dcRef.current = null; }
      if (pcRef.current) { try { pcRef.current.close(); } catch {} pcRef.current = null; }
      if (micStreamRef.current) { micStreamRef.current.getTracks().forEach((t) => t.stop()); micStreamRef.current = null; }
    } finally {
      activeReplyRef.current = false;
      assistantBufRef.current = "";
      stopRemotePulse();
      setIsListening(false);
      setIsConnected(false);
      setIsSpeaking(false);
      setStatus("idle");
      setPartialTranscript("");
    }
  }, []);

  // ---------- manual text ----------
  const sendText = useCallback((text: string) => {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    const t = String(text || "").trim();
    if (!t) return;
    try {
      dcRef.current.send(JSON.stringify({ type: "input_text.append", text: t }));
      dcRef.current.send(JSON.stringify({ type: "response.create" }));
      DEBUG && log("sent text + response.create");
    } catch (e: any) {
      setLastError(String(e?.message || e));
    }
  }, []);

  useEffect(() => {
    return () => {
      try { disconnect(); } catch {}
      if (audioElRef.current) { try { (audioElRef.current as any).srcObject = null; } catch {} }
      stopRemotePulse();
      if (audioCtxRef.current) { try { audioCtxRef.current.suspend(); } catch {} }
    };
  }, [disconnect]);

  return {
    status,
    isConnected,
    isListening,
    isSpeaking,
    transcript,         // assistant final lines
    partialTranscript,  // user live partial
    lastError,
    connect,
    disconnect,
    sendText,
  };
}
