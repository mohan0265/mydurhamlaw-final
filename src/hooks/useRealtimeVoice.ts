// src/hooks/useRealtimeVoice.ts
// Wrapper around useRealtimeWebRTC: builds MDL instructions and unlocks audio on gesture.

import { useCallback, useRef, useState } from "react";
import { useRealtimeWebRTC } from "./useRealtimeWebRTC";
import { buildSystemPrompt, getMdlContextSafe } from "@/lib/assist/systemPrompt";

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

export type UseRealtimeVoiceOptions = {
  onUserFinal?: (text: string) => void; // optional callback
};

export function useRealtimeVoice(opts: UseRealtimeVoiceOptions = {}) {
  const {
    status,
    isConnected,
    isListening,
    isSpeaking,
    transcript,
    partialTranscript,
    lastError,
    connect: rtConnect,
    disconnect: rtDisconnect,
    sendText,
  } = useRealtimeWebRTC();

  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const cooldownRef = useRef(false);
  const unlockedRef = useRef(false);

  const log = (...a: any[]) => {
    if (DEBUG) console.log("[useRealtimeVoice]", ...a);
  };

  const unlockAudio = () => {
    if (unlockedRef.current) return;
    try {
      // @ts-ignore - webkit prefix for older Safari
      const ACtx = window.AudioContext || window.webkitAudioContext;
      if (ACtx) {
        const ctx = new ACtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.02);
        ctx.resume();
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

  // Build MDL instructions once per connect attempt
  const buildInstructions = useCallback(() => {
    try {
      const mdl = getMdlContextSafe();
      return buildSystemPrompt(mdl);
    } catch {
      // minimal fallback if helper missing
      return "You are Durmah, a helpful, friendly study companion for Durham Law undergrads. Be concise and supportive.";
    }
  }, []);

  const connect = useCallback(async () => {
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
    unlockAudio();
    if (!isConnected) await connect();
    setVoiceModeActive(true);
    log("voice mode ON");
  }, [isConnected, connect]);

  const stopVoiceMode = useCallback(() => {
    setVoiceModeActive(false);
    try { rtDisconnect(); } catch {}
    log("voice mode OFF");
  }, [rtDisconnect]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text || !text.trim()) return;
      sendText(text.trim());
    },
    [sendText]
  );

  // Optional: surface the final USER lines to a parent if needed
  // (Many UIs just read them from `transcript` with role === 'user')
  // if (opts.onUserFinal) you can scan `transcript` in the caller.

  return {
    status,
    isConnected,
    isListening,
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
