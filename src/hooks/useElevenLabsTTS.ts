// src/hooks/useElevenLabsTTS.ts
// Lightweight ElevenLabs TTS hook with an interruptible queue.
// Uses a secure Netlify Function proxy at /.netlify/functions/tts-elevenlabs

import { useCallback, useEffect, useRef, useState } from "react";

export type UseElevenLabsTTSOptions = {
  voiceId?: string;                 // ElevenLabs Voice ID
  modelId?: string;                 // default "eleven_multilingual_v2"
  optimizeStreamingLatency?: 0 | 1 | 2 | 3 | 4; // not used by proxy, kept for API parity
  outputFormat?: "audio/mpeg" | "pcm_16000" | "wav" | string; // proxy returns audio/mpeg
  stability?: number;               // 0..1
  similarityBoost?: number;         // 0..1
  style?: number;                   // 0..1
  useSpeakerBoost?: boolean;        // default true
};

type QueueItem = { id: number; text: string };

export function useElevenLabsTTS(opts: UseElevenLabsTTSOptions = {}) {
  const {
    // Read from public OR private env fallback (private one won’t be exposed unless you inline it)
    voiceId =
      (process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID as string) ||
      (process.env.ELEVENLABS_VOICE_ID as string) ||
      "",
    modelId = "eleven_multilingual_v2",
    stability = 0.45,
    similarityBoost = 0.85,
    style = 0.35,
    useSpeakerBoost = true,
  } = opts;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const idCounter = useRef(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const unmountedRef = useRef(false);

  const ensureAudioContext = () => {
    if (!audioCtxRef.current) {
      // @ts-ignore Safari
      const ACtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new ACtx();
      audioCtxRef.current.resume?.();
    }
    return audioCtxRef.current!;
  };

  // ------- FETCH via Netlify Function (safe; server holds API key) -------
  const fetchAudioArrayBuffer = useCallback(
    async (text: string): Promise<ArrayBuffer> => {
      if (!voiceId) throw new Error("Missing ElevenLabs voiceId. Set NEXT_PUBLIC_ELEVENLABS_VOICE_ID.");

      // 🔴 IMPORTANT: use your Netlify Function endpoint (no query params)
      const url = "/.netlify/functions/tts-elevenlabs";

      const body = JSON.stringify({
        voice_id: voiceId,
        text,
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: useSpeakerBoost,
        },
      });

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`TTS failed: ${res.status} ${res.statusText} ${txt}`);
      }

      // Netlify returns proper binary (we set isBase64Encoded=true server-side)
      return await res.arrayBuffer();
    },
    [voiceId, modelId, stability, similarityBoost, style, useSpeakerBoost]
  );

  const playArrayBuffer = useCallback(async (buf: ArrayBuffer) => {
    const ctx = ensureAudioContext();
    const audioBuffer = await ctx.decodeAudioData(buf.slice(0));

    try { currentSourceRef.current?.stop(); } catch {}
    currentSourceRef.current?.disconnect();

    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(ctx.destination);

    currentSourceRef.current = src;
    setIsSpeaking(true);

    await ctx.resume?.();
    src.start();

    await new Promise<void>((resolve) => {
      src.onended = () => {
        if (currentSourceRef.current === src) {
          currentSourceRef.current.disconnect();
          currentSourceRef.current = null;
        }
        resolve();
      };
    });

    setIsSpeaking(false);
  }, []);

  const driveQueue = useCallback(async () => {
    if (unmountedRef.current || isSpeaking) return;
    const next = queue[0];
    if (!next) return;
    try {
      const audioBuf = await fetchAudioArrayBuffer(next.text);
      await playArrayBuffer(audioBuf);
    } catch (e) {
      console.error(e);
    } finally {
      setQueue((q) => q.slice(1));
    }
  }, [queue, isSpeaking, fetchAudioArrayBuffer, playArrayBuffer]);

  useEffect(() => {
    if (!isSpeaking && queue.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      driveQueue();
    }
  }, [queue, isSpeaking, driveQueue]);

  const speak = useCallback((text: string, opts?: { interrupt?: boolean }) => {
    if (!text?.trim()) return;
    if (opts?.interrupt) {
      try { currentSourceRef.current?.stop(); } catch {}
      currentSourceRef.current?.disconnect();
      currentSourceRef.current = null;
      abortRef.current?.abort();
      setQueue([{ id: ++idCounter.current, text }]);
      setIsSpeaking(false);
      return;
    }
    setQueue((q) => [...q, { id: ++idCounter.current, text }]);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    try { currentSourceRef.current?.stop(); } catch {}
    currentSourceRef.current?.disconnect();
    currentSourceRef.current = null;
    setQueue([]);
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      stop();
      try { audioCtxRef.current?.close(); } catch {}
      audioCtxRef.current = null;
    };
  }, [stop]);

  return {
    isSpeaking,
    queueLength: queue.length,
    speak,
    stop,
  };
}
