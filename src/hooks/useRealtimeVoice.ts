// src/hooks/useRealtimeVoice.ts
// Wrapper around useRealtimeWebRTC with bullet-proof teardown so End Chat really stops listening.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtimeWebRTC } from "./useRealtimeWebRTC";
import { buildSystemPrompt, getMdlContextSafe } from "@/lib/assist/systemPrompt";

/** -------------------- ENV -------------------- **/
const viteEnv =
  (typeof import.meta !== "undefined" && (import.meta as any).env) || undefined;

const SESSION_ENDPOINT =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SESSION_ENDPOINT) ||
  (viteEnv && (viteEnv as any).VITE_SESSION_ENDPOINT) ||
  "/api/realtime-session";

const DEBUG =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_VOICE === "true") ||
  (viteEnv && (viteEnv as any).VITE_DEBUG_VOICE === "true") ||
  (typeof window !== "undefined" && window.location.search.includes("debug=voice"));

/** -------------------- GLOBAL HANDLES (for hard stop) -------------------- **/
let __globalMediaStream: MediaStream | null = null;
let __globalAudioCtx: AudioContext | null = null;
let __globalPc: RTCPeerConnection | null = null;
let __globalSpeechRec: any | null = null; // capture SR if used by the WebRTC layer
let __globalIntervals: number[] = [];
let __globalRafs: number[] = [];

// Monkey-patch captures (so we can grab internal handles created by the WebRTC layer)
const __patchState = {
  gumPatched: false as boolean,
  pcPatched: false as boolean,
  srPatched: false as boolean,
  originalGetUserMedia: null as null | ((c: MediaStreamConstraints) => Promise<MediaStream>),
  OriginalPC: null as any,
  OriginalSpeechRecognition: null as any,
  OriginalWebkitSpeechRecognition: null as any,
};

function registerInterval(id: number) { __globalIntervals.push(id); }
function registerRaf(id: number) { __globalRafs.push(id); }

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
    // handy console aid after End Chat
    (window as any).__dbg = {
      tracks:
        ((window as any).__mediaStream &&
          typeof (window as any).__mediaStream.getTracks === "function")
          ? (window as any).__mediaStream.getTracks()
          : [],
      pcState: (__globalPc as any)?.connectionState ?? "closed",
    };
  }
}

function computeListeningFromStream(stream?: MediaStream | null) {
  const tracks = stream?.getAudioTracks?.() || [];
  return tracks.length > 0 && tracks.every(t => t.readyState === "live" && t.enabled);
}

/** -------------------- Options -------------------- **/
export type UseRealtimeVoiceOptions = {
  onUserFinal?: (text: string) => void; // optional callback (reserved)
};

/** -------------------- Hook -------------------- **/
export function useRealtimeVoice(opts: UseRealtimeVoiceOptions = {}) {
  const {
    status,
    isConnected,
    isListening: webrtcIsListening,
    isSpeaking,
    transcript,
    partialTranscript,
    lastError,
    connect: rtConnect,
    disconnect: rtDisconnect,
    sendText,
  } = useRealtimeWebRTC();

  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [hardListening, setHardListening] = useState(false);
  const cooldownRef = useRef(false);
  const unlockedRef = useRef(false);
  const micHardDisabledRef = useRef(false); // blocks any auto-resume after End Chat

  const log = (...a: any[]) => { if (DEBUG) console.log("[useRealtimeVoice]", ...a); };

  /** -------------------- Audio unlock (stores AudioContext so we can close) -------------------- **/
  const unlockAudio = () => {
    if (unlockedRef.current) return;
    try {
      // @ts-ignore - webkit prefix for older Safari
      const ACtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (ACtx) {
        const ctx: AudioContext = new ACtx();
        __globalAudioCtx = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.02);
        ctx.resume?.();
      }
    } catch {}
    unlockedRef.current = true;
  };

  /** -------------------- Session & instructions -------------------- **/
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

  /** -------------------- Patch to capture internals used by WebRTC layer -------------------- **/
  const patchMediaForCapture = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices && !__patchState.gumPatched) {
      __patchState.originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = async (constraints: MediaStreamConstraints) => {
        const stream = await __patchState.originalGetUserMedia!(constraints);
        // capture the mic stream reference for hard stop later
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
    if (typeof window !== "undefined" && !__patchState.srPatched) {
      const w: any = window as any;
      if (w.SpeechRecognition || w.webkitSpeechRecognition) {
        __patchState.OriginalSpeechRecognition = w.SpeechRecognition || null;
        __patchState.OriginalWebkitSpeechRecognition = w.webkitSpeechRecognition || null;
        const Wrap = (Base: any) => {
          return function WrappedSR(this: any) {
            // @ts-ignore
            const inst = new Base();
            __globalSpeechRec = inst;
            return inst;
          } as any;
        };
        if (w.SpeechRecognition) w.SpeechRecognition = Wrap(w.SpeechRecognition);
        if (w.webkitSpeechRecognition) w.webkitSpeechRecognition = Wrap(w.webkitSpeechRecognition);
        __patchState.srPatched = true;
      }
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
    if (__patchState.srPatched) {
      const w: any = window as any;
      if (__patchState.OriginalSpeechRecognition) w.SpeechRecognition = __patchState.OriginalSpeechRecognition;
      if (__patchState.OriginalWebkitSpeechRecognition) w.webkitSpeechRecognition = __patchState.OriginalWebkitSpeechRecognition;
      __patchState.srPatched = false;
      __patchState.OriginalSpeechRecognition = null;
      __patchState.OriginalWebkitSpeechRecognition = null;
    }
  }, []);

  /** -------------------- Connect / Start -------------------- **/
  const connect = useCallback(async () => {
    if (micHardDisabledRef.current) return; // don't allow reconnect after End Chat unless user toggles again
    if (cooldownRef.current || status === "connecting" || status === "connected") return;
    try {
      const { token, model } = await getSession();
      const instructions = buildInstructions();
      await rtConnect({ token, model, instructions });
    } catch (e) {
      console.error(e);
      cooldownRef.current = true;
      setTimeout(() => { cooldownRef.current = false; }, 1500);
      throw e;
    }
  }, [status, getSession, buildInstructions, rtConnect]);

  const startVoiceMode = useCallback(async () => {
    micHardDisabledRef.current = false;      // allow listening
    patchMediaForCapture();                  // capture mic/pc/SR handles created by WebRTC hook
    unlockAudio();                           // ensure audio context is resumable (we store it)
    if (!isConnected) await connect();
    setVoiceModeActive(true);
    log("voice mode ON");
  }, [isConnected, connect, patchMediaForCapture]);

  /** -------------------- Stop (HARD) -------------------- **/
  const stopVoiceMode = useCallback(async () => {
    setVoiceModeActive(false);
    micHardDisabledRef.current = true; // block auto-resume
    try { await rtDisconnect(); } catch {}

    // HARD kill all pipelines we can see
    await hardStopAllAudioPipelines();

    // Restore patched constructors so the rest of the app is unaffected
    unpatchMedia();

    log("voice mode OFF (hard)");
  }, [rtDisconnect, unpatchMedia]);

  /** -------------------- Text sending -------------------- **/
  const sendMessage = useCallback(
    (text: string) => {
      if (!text || !text.trim()) return;
      if (micHardDisabledRef.current) return; // don't allow sending while in End Chat state
      sendText(text.trim());
    },
    [sendText]
  );

  /** -------------------- Derive real listening from mic track state -------------------- **/
  useEffect(() => {
    const id = window.setInterval(() => {
      setHardListening(computeListeningFromStream(__globalMediaStream));
    }, 400);
    registerInterval(id);
    return () => clearInterval(id);
  }, []);

  const effectiveIsListening =
    voiceModeActive && computeListeningFromStream(__globalMediaStream) && webrtcIsListening;

  /** -------------------- Cleanup on unmount -------------------- **/
  useEffect(() => {
    return () => { stopVoiceMode(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** -------------------- Debug helpers -------------------- **/
  useEffect(() => {
    if (!DEBUG || typeof window === "undefined") return;
    (window as any).__mediaStream = __globalMediaStream;
    (window as any).__hardStopAllAudioPipelines = hardStopAllAudioPipelines;
  }, [effectiveIsListening]);

  /** -------------------- API -------------------- **/
  return {
    status,
    isConnected,
    isListening: effectiveIsListening, // UI now reflects real mic state
    isSpeaking,
    voiceModeActive,
    lastError,
    transcript,        // [{ id, role, text }]
    partialTranscript, // user's live partial
    connect,
    startVoiceMode,
    stopVoiceMode,
    sendMessage,
  };
}
