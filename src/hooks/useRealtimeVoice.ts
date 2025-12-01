"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface VoiceTurn {
  speaker: "user" | "assistant";
  text: string;
}

interface RealtimeOptions {
  apiKey: string;       // not used right now, kept for future flexibility
  systemPrompt: string; // not yet sent, but kept for later use
  onTranscript?: (turn: VoiceTurn) => void;
}

/**
 * WebRTC-based Realtime Voice engine for Durmah.
 * Browser <-> Netlify function <-> Gemini Realtime API
 */
export function useRealtimeVoice(options: RealtimeOptions) {
  const { onTranscript } = options;

  const [connected, setConnected] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ensureAudioElement = () => {
    if (!audioRef.current) {
      const el = document.createElement("audio");
      el.autoplay = true;
      el.playsInline = true;
      audioRef.current = el;
    }
  };

  /**
   * STOP TALKING — mute mic tracks
   */
  const stopTalking = useCallback(() => {
    if (!micStreamRef.current) return;
    micStreamRef.current.getTracks().forEach((track) => {
      track.enabled = false;
    });
  }, []);

  /**
   * CONNECT — create WebRTC session and exchange SDP via Netlify function
   */
  const connect = useCallback(async () => {
    try {
      setError(null);
      ensureAudioElement();

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
      });
      pcRef.current = pc;

      // Data channel for transcript / control messages
      const dc = pc.createDataChannel("control");
      dataChannelRef.current = dc;

      dc.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "assistant.text") {
            setSpeaking(false);
            onTranscript?.({ speaker: "assistant", text: msg.text });
          } else if (msg.type === "user.text") {
            onTranscript?.({ speaker: "user", text: msg.text });
          } else if (msg.type === "assistant.speaking.start") {
            setSpeaking(true);
            stopTalking();
          } else if (msg.type === "assistant.speaking.stop") {
            setSpeaking(false);
          }
        } catch {
          // ignore malformed messages
        }
      };

      // Remote audio
      pc.ontrack = (event) => {
        if (audioRef.current) {
          audioRef.current.srcObject = event.streams[0];
          audioRef.current.play().catch(() => {});
        }
      };

      // Microphone
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = mic;
      mic.getTracks().forEach((track) => pc.addTrack(track, mic));

      // Create local offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // *** CRITICAL PART: note the leading "/" here ***
      const resp = await fetch("/.netlify/functions/gemini-realtime-sdp", {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp || "",
      });

      if (!resp.ok) {
        throw new Error(`Realtime proxy error: ${resp.status}`);
      }

      const answerSdp = await resp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setConnected(true);
    } catch (err: any) {
      console.error("WebRTC connect error:", err);
      setError(err?.message || "Realtime connection failed");
      setConnected(false);
    }
  }, [onTranscript, stopTalking]);

  /**
   * DISCONNECT — close peer connection and stop mic
   */
  const disconnect = useCallback(async () => {
    try {
      dataChannelRef.current?.close();
      dataChannelRef.current = null;

      pcRef.current?.close();
      pcRef.current = null;

      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }

      setConnected(false);
      setSpeaking(false);
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  }, []);

  /**
   * START TALKING — enable mic tracks
   */
  const startTalking = useCallback(() => {
    if (!micStreamRef.current) return;
    micStreamRef.current.getTracks().forEach((track) => {
      track.enabled = true;
    });
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connected,
    speaking,
    error,
    connect,
    disconnect,
    startTalking,
    stopTalking,
  };
}
