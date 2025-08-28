// src/lib/voice/useRealtimeVoice.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TranscriptItem = { id: string; text: string };

export function useRealtimeVoice() {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [partialTranscript, setPartialTranscript] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
      setStatus("connecting");

      // Your server route that returns a temporary OpenAI Realtime session URL
      // For Next.js, we’ll create /api/realtime-session in Step 4.5
      const res = await fetch("/api/realtime-session");
      if (!res.ok) throw new Error("Failed to create realtime session");
      const { client_secret } = await res.json();

      const ws = new WebSocket(client_secret.value, ["realtime", "v1"]);
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        setStatus("connected");
        setIsConnected(true);
        setLastError(null);
      });

      ws.addEventListener("close", () => {
        setIsConnected(false);
        setStatus("idle");
      });

      ws.addEventListener("error", (e) => {
        setLastError(String(e));
        setIsConnected(false);
        setStatus("idle");
      });

      ws.addEventListener("message", async (event) => {
        const msg = JSON.parse(event.data);
        // Very small state machine for transcript
        if (msg.type === "response.output_text.delta") {
          setPartialTranscript((p) => (p || "") + (msg.delta ?? ""));
        } else if (msg.type === "response.output_text.done") {
          const id = String(++counterRef.current);
          const text = (partialTranscript || "").trim();
          if (text) {
            setTranscript((arr) => [...arr, { id, text }]);
          }
          setPartialTranscript(null);
        } else if (msg.type === "response.audio.delta") {
          // stream audio chunks into a single <audio> element
          const b64 = msg.delta as string;
          const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          const blob = new Blob([bytes], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          const audio = audioRef.current!;
          if (!audio.src) {
            audio.src = url;
            audio.onended = () => setIsSpeaking(false);
            setIsSpeaking(true);
            audio.play().catch(() => {});
          } else {
            // enqueue next segments by appending when current ends
            audio.addEventListener(
              "ended",
              () => {
                audio.src = url;
                setIsSpeaking(true);
                audio.play().catch(() => {});
              },
              { once: true }
            );
          }
        } else if (msg.type === "response.completed") {
          // noop
        } else if (msg.type === "error") {
          setLastError(msg.error?.message ?? "Realtime error");
        }
      });
    } catch (e: any) {
      setLastError(e?.message || String(e));
      setStatus("idle");
    }
  }, [partialTranscript]);

  const startVoiceMode = useCallback(async () => {
    try {
      await connect();
      if (!wsRef.current) throw new Error("No connection");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = rec;

      rec.ondataavailable = async (e) => {
        if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          const arrayBuffer = await e.data.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          wsRef.current.send(
            JSON.stringify({
              type: "input_audio_buffer.append",
              audio: base64,
            })
          );
          wsRef.current.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
          wsRef.current.send(JSON.stringify({ type: "response.create" }));
        }
      };

      rec.start(250); // send small chunks
      setIsListening(true);
    } catch (e: any) {
      setLastError(e?.message || String(e));
    }
  }, [connect]);

  const stopVoiceMode = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    setIsListening(false);
  }, []);

  const sendText = useCallback(async (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "response.create", instructions: text }));
  }, []);

  return {
    status,
    isConnected,
    isListening,
    isSpeaking,
    transcript,
    partialTranscript,
    connect,
    startVoiceMode,
    stopVoiceMode,
    sendText,
    lastError,
  };
}
