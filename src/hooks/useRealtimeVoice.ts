"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * A single transcript turn from either the user or Durmah.
 */
export interface VoiceTurn {
  speaker: "user" | "assistant";
  text: string;
}

interface RealtimeOptions {
  apiKey: string;
  systemPrompt: string;
  onTranscript?: (turn: VoiceTurn) => void;
}

/**
 * A WebRTC-based Realtime Voice engine for Gemini 3.
 * Supports:
 * - Connect / Disconnect
 * - Mic streaming
 * - Auto stop mic while assistant speaks
 * - Turn boundaries
 * - Transcript callbacks
 */
export function useRealtimeVoice(options: RealtimeOptions) {
  const { apiKey, systemPrompt, onTranscript } = options;

  const [connected, setConnected] = useState(false);
  const [speaking, setSpeaking] = useState(false);  // assistant speaking state
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const createAudioElement = () => {
    if (!audioRef.current) {
      const el = document.createElement("audio");
      el.autoplay = true;
      el.playsInline = true;
      audioRef.current = el;
    }
  };

  /**
   * CONNECT — Create WebRTC session to Gemini Realtime API
   */
  const connect = useCallback(async () => {
    try {
      setError(null);
      createAudioElement();

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302"] },
        ],
      });

      pcRef.current = pc;

      // --- DATA CHANNEL ---
      const dc = pc.createDataChannel("transcript");
      dataChannelRef.current = dc;

      dc.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);

          // Assistant text
          if (msg.type === "assistant.text") {
            setSpeaking(false);
            onTranscript?.({ speaker: "assistant", text: msg.text });
          }

          // User text
          else if (msg.type === "user.text") {
            onTranscript?.({ speaker: "user", text: msg.text });
          }

          // Assistant started speaking (stop mic!)
          else if (msg.type === "assistant.speaking.start") {
            setSpeaking(true);
            stopTalking();
          }

          else if (msg.type === "assistant.speaking.stop") {
            setSpeaking(false);
          }
        } catch {}
      };

      // --- REMOTE AUDIO TRACK ---
      pc.ontrack = (event) => {
        if (audioRef.current) {
          audioRef.current.srcObject = event.streams[0];
          audioRef.current.play().catch(() => {});
        }
      };

      // Get microphone
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = mic;

      mic.getTracks().forEach((track) => pc.addTrack(track, mic));

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Exchange SDP with Google Realtime API
      const baseUrl =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:connectRealtime";

      const resp = await fetch(`${baseUrl}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });

      if (!resp.ok) {
        throw new Error("Failed to establish realtime session");
      }

      const answerSdp = await resp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setConnected(true);
    } catch (err: any) {
      setError(err.message);
      setConnected(false);
    }
  }, [apiKey, onTranscript]);

  /**
   * DISCONNECT — Close peer connection and stop mic
   */
  const disconnect = useCallback(async () => {
    try {
      dataChannelRef.current?.close();
      dataChannelRef.current = null;

      pcRef.current?.close();
      pcRef.current = null;

      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;

      setConnected(false);
      setSpeaking(false);
    } catch {}
  }, []);

  /**
   * START TALKING — re-enable mic after assistant finishes
   */
  const startTalking = useCallback(() => {
    if (!pcRef.current || !micStreamRef.current) return;

    micStreamRef.current.getTracks().forEach((track) => {
      track.enabled = true;
    });

  }, []);

  /**
   * STOP TALKING — mute user mic while assistant is speaking
   */
  const stopTalking = useCallback(() => {
    if (!micStreamRef.current) return;

    micStreamRef.current.getTracks().forEach((track) => {
      track.enabled = false;
    });
  }, []);

  /**
   * Cleanup on unmount
   */
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
