// src/hooks/useRealtimeWebRTC.ts
// WebRTC to OpenAI Realtime (mic + reasoning) with role-tagged transcript.
// - USER (you) comes from transcript.partial/completed events.
// - ASSISTANT (Durmah) comes from response.* / audio_transcript.* events.
// We keep user's live partial in `partialTranscript` and buffer assistant text internally.

// @ts-nocheck

import { useCallback, useEffect, useRef, useState } from "react";

// ---- Env shim: support both Vite (import.meta.env) and Next (process.env) ----
const viteEnv =
  (typeof import.meta !== "undefined" && (import.meta as any).env) || undefined;

const DEBUG =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_VOICE === "true") ||
  (viteEnv && (viteEnv as any).VITE_DEBUG_VOICE === "true") ||
  (typeof window !== "undefined" && window.location.search.includes("debug=voice"));

const TTS_VOLUME = parseFloat(
  (typeof process !== "undefined" && (process.env.NEXT_PUBLIC_TTS_VOLUME as string)) ||
    (viteEnv && (viteEnv as any).VITE_TTS_VOLUME) ||
    "0.85"
);

const TTS_RATE = parseFloat(
  (typeof process !== "undefined" && (process.env.NEXT_PUBLIC_TTS_RATE as string)) ||
    (viteEnv && (viteEnv as any).VITE_TTS_RATE) ||
    "0.95"
);

// -------------------------- Types --------------------------
export type RoleLine = { id: string; role: "user" | "assistant"; text: string };

type ConnectArgs = {
  token: string;
  model: string;
  instructions?: string | null;
  voiceId?: string | null; // optional (for OpenAI TTS through Realtime)
};

// -------------------------- Public hook --------------------------
export function useRealtimeWebRTC() {
  // ---- internals / refs ----
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const tokenRef = useRef<string | null>(null);
  const modelRef = useRef<string | null>(null);
  const instructionsRef = useRef<string | null>(null);
  const voiceRef = useRef<string | null>(null);

  // visual “speaking” pulse for remote audio
  const audioCtxRef = useRef<any>(null);
  const vadRemoteRef = useRef<{ alive: boolean; raf: number }>({ alive: false, raf: 0 });

  // whether assistant is actively replying (for barge-in cancel)
  const activeReplyRef = useRef<boolean>(false);

  // track active response id for safe cancellation
  const activeResponseIdRef = useRef<string | null>(null);

  // buffer for assistant streaming text (we keep user partial separate)
  const assistantBufRef = useRef<string>("");

  // optional local TTS element (kept for future use)
  const localTTSRef = useRef<HTMLAudioElement | null>(null);

  // ---- public state ----
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "disconnecting">("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // The merged, role-tagged transcript
  const [transcript, setTranscript] = useState<RoleLine[]>([]);
  // Only the USER’s live partial (assistant partial is buffered internally)
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
    }
    return audioElRef.current!;
  };

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

  // ---------- server messages ----------
  const handleServerEvent = (evt: MessageEvent) => {
    let msg: any;
    try { msg = JSON.parse(evt.data as any); } catch { return; }
    DEBUG && log("recv:", msg.type, msg);

    // response id tracking for safe cancellation
    if (msg.type === "response.created") {
      activeResponseIdRef.current = msg.response?.id ?? activeResponseIdRef.current;
    }
    if (
      msg.type === "response.completed" ||
      msg.type === "response.canceled" ||
      msg.type === "response.errored"
    ) {
      activeResponseIdRef.current = null;
    }

    // Track reply activity for barge-in
    if (msg.type === "output_audio_buffer.started") activeReplyRef.current = true;
    if (msg.type === "output_audio_buffer.stopped" || msg.type === "response.done" || msg.type === "response.completed")
      activeReplyRef.current = false;

    if (msg.type === "error") {
      setLastError(msg.error?.message || "Server error");
      return;
    }

    // Session lifecycle: when session is created, push full config again (belt & braces)
    if (msg.type === "session.created" && dcRef.current?.readyState === "open") {
      try {
        dcRef.current.send(
          JSON.stringify({
            type: "session.update",
            session: {
              model: modelRef.current || "gpt-4o-realtime-preview-2024-12-17",
              instructions: instructionsRef.current || undefined,
              turn_detection: { type: "server_vad", silence_duration_ms: 300 },
              // IMPORTANT: these must be strings (not objects)
              input_audio_format: "pcm16",
              output_audio_format: "mp3",
              voice: voiceRef.current || "alloy",
            },
          })
        );
      } catch {}
      return;
    }

    // USER ASR from server (if enabled)
    if (msg.type === "transcript.partial" && typeof msg.text === "string") {
      setPartialTranscript(msg.text);
      return;
    }
    if (msg.type === "transcript.completed" && typeof msg.text === "string") {
      const text = msg.text.trim();
      if (text) {
        setTranscript((old) => [...old, { id: msg.id || crypto.randomUUID(), role: "user", text }]);
      }
      setPartialTranscript("");
      return;
    }

    // ASSISTANT TEXT (streaming)
    if (msg.type === "response.output_text.delta" && typeof msg.delta === "string") {
      assistantBufRef.current += msg.delta;
      return;
    }
    if (msg.type === "response.completed") {
      const buf = assistantBufRef.current.trim();
      if (buf) {
        setTranscript((old) => [...old, { id: msg.id || crypto.randomUUID(), role: "assistant", text: buf }]);
      }
      assistantBufRef.current = "";
      return;
    }

    // ASSISTANT SPEECH TRANSCRIPT (preferred)
    if (msg.type === "response.audio_transcript.delta" && typeof msg.delta === "string") {
      assistantBufRef.current += msg.delta;
      return;
    }
    if (msg.type === "response.audio_transcript.done") {
      const full =
        typeof msg.transcript === "string"
          ? msg.transcript
          : typeof msg.text === "string"
          ? msg.text
          : assistantBufRef.current;
      const finalText = (full || "").trim();
      if (finalText) {
        setTranscript((old) => [...old, { id: msg.id || crypto.randomUUID(), role: "assistant", text: finalText }]);
      }
      assistantBufRef.current = "";
      return;
    }
  };

  // ---------- connect ----------
  const connect = useCallback(
    async ({ token, model, instructions, voiceId }: ConnectArgs) => {
      if (isConnected || status === "connecting") return;
      setStatus("connecting");
      setLastError(null);
      tokenRef.current = token;
      modelRef.current = model;
      instructionsRef.current = instructions ?? null;
      voiceRef.current = voiceId ?? null;

      try {
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        pc.onconnectionstatechange = () => {
          DEBUG && log("pc state:", pc.connectionState);
          if (pc.connectionState === "connected") setIsConnected(true);
          if (
            pc.connectionState === "failed" ||
            pc.connectionState === "disconnected" ||
            pc.connectionState === "closed"
          ) {
            setIsConnected(false);
            setStatus("idle");
          }
        };

        // Remote audio
        pc.ontrack = (e: RTCTrackEvent) => {
          const stream = e?.streams && e.streams[0] ? e.streams[0] : new MediaStream([e.track]);
          const el = ensureAudioElement();
          try {
            (el as any).srcObject = stream;
          } catch {}
          el.play().catch(() => {});
          startRemotePulse(stream);
        };

        // Data channel
        dcRef.current = pc.createDataChannel("oai-events");
        dcRef.current.onopen = () => {
          DEBUG && log("data channel open");
          // Push full session config on open (correct format strings)
          const sessionMsg = {
            type: "session.update",
            session: {
              model: modelRef.current || "gpt-4o-realtime-preview-2024-12-17",
              instructions: instructionsRef.current || undefined,
              turn_detection: { type: "server_vad", silence_duration_ms: 300 },
              input_audio_format: "pcm16",
              output_audio_format: "mp3",
              voice: voiceRef.current || "alloy",
            },
          };
          try { dcRef.current?.send(JSON.stringify(sessionMsg)); } catch {}
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

        // Local barge-in: cancel only when a reply is active and we have an active response id
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
              if (
                !speaking &&
                nowSpeaking &&
                activeReplyRef.current &&
                dcRef.current &&
                dcRef.current.readyState === "open"
              ) {
                const rid = activeResponseIdRef.current;
                if (rid) {
                  try {
                    dcRef.current.send(JSON.stringify({ type: "response.cancel", response: { id: rid } }));
                  } catch {}
                }
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
    },
    [isConnected, status]
  );

  // ---------- disconnect ----------
  const disconnect = useCallback(() => {
    setStatus("disconnecting");
    try {
      if (dcRef.current) { try { dcRef.current.close(); } catch {} dcRef.current = null; }
      if (pcRef.current) { try { pcRef.current.close(); } catch {} pcRef.current = null; }
      if (micStreamRef.current) { micStreamRef.current.getTracks().forEach((t) => t.stop()); micStreamRef.current = null; }
    } finally {
      activeReplyRef.current = false;
      activeResponseIdRef.current = null;
      assistantBufRef.current = "";
      stopRemotePulse();
      setIsListening(false);
      setIsConnected(false);
      setIsSpeaking(false);
      setStatus("idle");
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
    transcript,        // Array<RoleLine> — both roles
    partialTranscript, // USER live partial only
    lastError,
    connect,
    disconnect,
    sendText,
  };
}
