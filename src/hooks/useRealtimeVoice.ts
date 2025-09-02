// src/hooks/useRealtimeVoice.ts
// Small wrapper around the WebRTC hook + audio unlock on user gesture.
// Works in BOTH Vite and Next.js. Adds MDL instructions to the Realtime session.

import { useCallback, useRef, useState } from "react";
import { useRealtimeWebRTC } from "./useRealtimeWebRTC";
import { getMdlContextSafe, buildSystemPrompt } from "@/lib/assist/systemPrompt";

/**
 * Env shim: supports both Vite (`import.meta.env`) and Next.js (`process.env`).
 * Default endpoint is a Next.js API route: /api/realtime-session
 */
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

export function useRealtimeVoice() {
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
        gain.gain.value = 0.0001; // inaudible blip to unlock
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

  // Build MDL instructions once per connect
  const buildInstructions = useCallback(() => {
    try {
      const mdl = getMdlContextSafe();       // always returns a safe ctx
      return buildSystemPrompt(mdl);         // <- REQUIRED arg provided here
    } catch {
      // ultra-safe generic fallback if helpers explode for any reason
      return [
        "You are Durmah, a supportive voice mentor for a Durham law student.",
        "Be friendly, concise, and helpful. If you don’t know, say so briefly.",
        "Offer study tips and next actions. Keep responses under 5 sentences unless asked.",
      ].join(" ");
    }
  }, []);

  const connect = useCallback(async () => {
    if (cooldownRef.current || status === "connecting" || status === "connected") return;
    try {
      const { token, model } = await getSession();
      const instructions = buildInstructions(); // <- context-aware system prompt
      await rtConnect({ token, model, instructions });
    } catch (e) {
      console.error(e);
      cooldownRef.current = true;
      setTimeout(() => { cooldownRef.current = false; }, 1500);
      throw e;
    }
  }, [status, getSession, rtConnect, buildInstructions]);

  const startVoiceMode = useCallback(async () => {
    unlockAudio(); // ⟵ critical: ensures autoplay is allowed
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

  return {
    status,
    isConnected,
    isListening,
    isSpeaking,
    voiceModeActive,
    lastError,
    transcript,         // assistant final lines
    partialTranscript,  // user live partial
    connect,
    startVoiceMode,
    stopVoiceMode,
    sendMessage,
  };
}
