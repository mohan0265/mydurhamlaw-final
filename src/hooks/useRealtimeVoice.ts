// src/hooks/useRealtimeVoice.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRealtimeWebRTC } from "./useRealtimeWebRTC";
import { buildSystemPrompt, getMdlContextSafe } from "@/lib/assist/systemPrompt";

const viteEnv = (typeof import.meta !== "undefined" && (import.meta as any).env) || undefined;
const SESSION_ENDPOINT =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SESSION_ENDPOINT) ||
  (viteEnv && (viteEnv as any).VITE_SESSION_ENDPOINT) || "/api/realtime-session";
const DEBUG =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_VOICE === "true") ||
  (viteEnv && (viteEnv as any).VITE_DEBUG_VOICE === "true") ||
  (typeof window !== "undefined" && window.location.search.includes("debug=voice"));

let __globalMediaStream: MediaStream | null = null;
let __globalAudioCtx: AudioContext | null = null;
let __globalPc: RTCPeerConnection | null = null;
let __globalSpeechRec: any | null = null;
let __globalIntervals: number[] = [];
let __globalRafs: number[] = [];

const __patchState = {
  gumPatched: false,
  pcPatched: false,
  originalGetUserMedia: null as null | ((c: MediaStreamConstraints) => Promise<MediaStream>),
  OriginalPC: null as any,
};

function registerInterval(id: number) { __globalIntervals.push(id); }
async function hardStopAllAudioPipelines() {
  try { __globalMediaStream?.getTracks().forEach(t => { try { t.stop(); } catch {} }); } catch {}
  __globalMediaStream = null;

  try { await __globalAudioCtx?.close(); } catch {}
  __globalAudioCtx = null;

  try {
    if (__globalPc) {
      __globalPc.ontrack = null;
      __globalPc.onicecandidate = null;
      __globalPc.onconnectionstatechange = null;
      __globalPc.getSenders().forEach(s => { try { s.track?.stop(); } catch {} });
      __globalPc.getReceivers().forEach(r => { try { r.track?.stop(); } catch {} });
      __globalPc.close();
    }
  } catch {}
  __globalPc = null;

  try { __globalSpeechRec?.abort?.(); } catch {}
  try { __globalSpeechRec?.stop?.(); } catch {}
  __globalSpeechRec = null;

  try { __globalIntervals.forEach(id => clearInterval(id)); } catch {}
  __globalIntervals = [];
  try { __globalRafs.forEach(id => cancelAnimationFrame(id)); } catch {}
  __globalRafs = [];

  if (DEBUG && typeof window !== "undefined") {
    (window as any).__dbg = {
      tracks: ((window as any).__mediaStream && (window as any).__mediaStream.getTracks?.()) || [],
      pcState: (__globalPc as any)?.connectionState ?? "closed",
    };
  }
}
function computeListeningFromStream(stream?: MediaStream | null) {
  const tracks = stream?.getAudioTracks?.() || [];
  return tracks.length > 0 && tracks.every(t => t.readyState === "live" && t.enabled);
}

type Line = { id: string; role: "user" | "assistant"; text: string };

export function useRealtimeVoice() {
  const {
    status,
    isConnected,
    isListening: webrtcIsListening,
    isSpeaking,
    transcript: rtTranscript,
    partialTranscript: rtPartial,
    lastError,
    connect: rtConnect,
    disconnect: rtDisconnect,
    sendText,
  } = useRealtimeWebRTC();

  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [hardListening, setHardListening] = useState(false);
  const unlockedRef = useRef(false);

  // ---- local SR state (Student) ----
  const [userPartial, setUserPartial] = useState<string>("");
  const [userFinals, setUserFinals] = useState<Line[]>([]);
  const lastFinalNormRef = useRef<string>("");     // for de-dup
  const lastFinalAtRef = useRef<number>(0);

  // ---- merged transcript ----
  const mergedTranscript: Line[] = useMemo(() => {
    const a: Line[] = (rtTranscript || []).map((l: any) => ({
      id: String(l.id ?? Math.random()),
      role: (l.role as "user" | "assistant") ?? "assistant",
      text: (l.text || "").trim(),
    }));
    // keep absolute order: assistant first (from realtime stream), then user finals we appended
    return [...a, ...userFinals];
  }, [rtTranscript, userFinals]);

  const unlockAudio = () => {
    if (unlockedRef.current) return;
    try {
      // @ts-ignore
      const ACtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (ACtx) {
        const ctx: AudioContext = new ACtx();
        __globalAudioCtx = ctx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        g.gain.value = 0.0001;
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.02);
        ctx.resume?.();
      }
    } catch {}
    unlockedRef.current = true;
  };

  const getSession = useCallback(async () => {
    const resp = await fetch(SESSION_ENDPOINT, { method: "POST" });
    if (!resp.ok) throw new Error(`Session endpoint failed: ${await resp.text()}`);
    const json = await resp.json();
    if (!json?.token) throw new Error("No token returned from session endpoint");
    return {
      token: json.token,
      model: json.model || "gpt-4o-realtime-preview-2024-12-17",
    };
  }, []);

  const buildInstructions = useCallback(() => {
    try {
      const mdl = getMdlContextSafe();
      return buildSystemPrompt(mdl);
    } catch {
      return "You are Durmah, a helpful, friendly study companion for Durham Law undergrads. Be concise and supportive.";
    }
  }, []);

  const patchMediaForCapture = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices && !__patchState.gumPatched) {
      __patchState.originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (constraints: MediaStreamConstraints) => {
        const stream = await __patchState.originalGetUserMedia!(constraints);
        __globalMediaStream = stream;
        if (DEBUG && typeof window !== "undefined") (window as any).__mediaStream = stream;
        return stream;
      };
      __patchState.gumPatched = true;
    }
    if (typeof window !== "undefined" && "RTCPeerConnection" in window && !__patchState.pcPatched) {
      // @ts-ignore
      __patchState.OriginalPC = (window as any).RTCPeerConnection;
      // @ts-ignore
      (window as any).RTCPeerConnection = function (...args: any[]) {
        // @ts-ignore
        const pc = new __patchState.OriginalPC(...args);
        __globalPc = pc;
        return pc;
      } as any;
      __patchState.pcPatched = true;
    }
  }, []);

  const unpatchMedia = useCallback(() => {
    if (__patchState.gumPatched && __patchState.originalGetUserMedia) {
      navigator.mediaDevices.getUserMedia = __patchState.originalGetUserMedia;
      __patchState.gumPatched = false;
      __patchState.originalGetUserMedia = null;
    }
    if (__patchState.pcPatched && __patchState.OriginalPC) {
      // @ts-ignore
      (window as any).RTCPeerConnection = __patchState.OriginalPC;
      __patchState.pcPatched = false;
      __patchState.OriginalPC = null;
    }
  }, []);

  // ---- local SpeechRecognition (Student mic → text) ----
  const startLocalASR = useCallback(() => {
    const w: any = typeof window !== "undefined" ? window : undefined;
    if (!w) return;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      console.warn("SpeechRecognition not supported in this browser");
      return;
    }
    try {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-GB";

      rec.onresult = (ev: any) => {
        let interim = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i];
          const t = (r[0]?.transcript || "").trim();
          if (!t) continue;
          if (r.isFinal) {
            // de-dupe repeated finals
            const norm = t.replace(/\s+/g, " ").toLowerCase();
            const now = Date.now();
            if (norm !== lastFinalNormRef.current || now - lastFinalAtRef.current > 2500) {
              const id = `${now}_${Math.random()}`;
              setUserFinals((prev) => [...prev, { id, role: "user", text: t }]);
              lastFinalNormRef.current = norm;
              lastFinalAtRef.current = now;
            }
            setUserPartial("");
          } else {
            interim += t + " ";
          }
        }
        setUserPartial(interim.trim());
      };

      rec.onerror = () => { /* keep calm and restart onend */ };
      rec.onend = () => {
        if (voiceModeActive) { try { rec.start(); } catch {} }
      };

      __globalSpeechRec = rec;
      try { rec.start(); } catch {}
    } catch (e) {
      console.error("SR start error:", e);
    }
  }, [voiceModeActive]);

  // ---- connect/start/stop ----
  const connect = useCallback(async () => {
    const { token, model } = await getSession();
    const instructions = buildInstructions();
    await rtConnect({ token, model, instructions }); // make sure your useRealtimeWebRTC forwards session.update (see patch below)
  }, [getSession, buildInstructions, rtConnect]);

  const startVoiceMode = useCallback(async () => {
    patchMediaForCapture();
    unlockAudio();
    if (!isConnected) await connect();
    setVoiceModeActive(true);
    startLocalASR();
  }, [isConnected, connect, patchMediaForCapture, startLocalASR]);

  const stopVoiceMode = useCallback(async () => {
    setVoiceModeActive(false);
    try { await rtDisconnect(); } catch {}
    await hardStopAllAudioPipelines();
    unpatchMedia();
  }, [rtDisconnect, unpatchMedia]);

  // ---- send text (optional) ----
  const sendMessage = useCallback((text: string) => {
    if (!text?.trim()) return;
    sendText(text.trim());
  }, [sendText]);

  // ---- detect true mic state ----
  useEffect(() => {
    const id = window.setInterval(() => {
      setHardListening(computeListeningFromStream(__globalMediaStream));
    }, 400);
    registerInterval(id);
    return () => clearInterval(id);
  }, []);

  const effectiveIsListening = voiceModeActive && computeListeningFromStream(__globalMediaStream) && webrtcIsListening;

  return {
    status,
    isConnected,
    isListening: effectiveIsListening,
    isSpeaking,
    voiceModeActive,
    // hide the noisy “cancellation failed” line from UI
    lastError: String(lastError || "").includes("Cancellation failed") ? null : lastError,
    transcript: mergedTranscript,
    partialTranscript: userPartial || rtPartial || "",
    connect,
    startVoiceMode,
    stopVoiceMode,
    sendMessage,
  };
}
