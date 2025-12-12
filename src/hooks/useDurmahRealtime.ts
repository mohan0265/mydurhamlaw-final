import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceTurn = { speaker: "user" | "durmah"; text: string };

interface UseDurmahRealtimeProps {
  systemPrompt: string;
  voice?: string;
  onTurn?: (turn: VoiceTurn) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export function useDurmahRealtime({
  systemPrompt,
  voice = "charon",
  onTurn,
  audioRef,
}: UseDurmahRealtimeProps) {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "listening" | "speaking" | "previewing" | "error"
  >("idle");
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewPcRef = useRef<RTCPeerConnection | null>(null);
  const previewDcRef = useRef<RTCDataChannel | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);

  const requestAnswerSdp = useCallback(async (offerSdp?: string | null) => {
    if (!offerSdp) {
      throw new Error("Missing SDP offer");
    }

    const response = await fetch("/api/voice/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerSdp }),
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      if (contentType.includes("application/json")) {
        let payload: any = {};
        try {
          payload = await response.json();
        } catch {
          // fall through with empty payload
        }
        const detail =
          (payload?.detail as string) ||
          (payload?.error as string) ||
          JSON.stringify(payload);
        throw new Error(
          `Voice service error (${response.status}): ${detail || "unknown"}`
        );
      }

      const fallback = await response.text().catch(() => response.statusText);
      throw new Error(
        `Voice service error (${response.status}): ${fallback || "unknown"}`
      );
    }

    if (contentType.includes("application/json")) {
      const payload = await response.json();
      const answer =
        (payload?.answerSdp as string) ||
        (payload?.answer as string) ||
        (payload?.sdp as string);
      if (!answer) {
        throw new Error("Voice service response missing answer SDP");
      }
      return answer;
    }

    const fallback = await response.text();
    if (!fallback) {
      throw new Error("Voice service response was empty");
    }
    return fallback;
  }, []);

  const stopPreview = useCallback(() => {
    if (previewDcRef.current) {
      previewDcRef.current.close();
      previewDcRef.current = null;
    }
    if (previewPcRef.current) {
      previewPcRef.current.ontrack = null;
      previewPcRef.current.close();
      previewPcRef.current = null;
    }
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach((track) => track.stop());
      previewStreamRef.current = null;
    }
    if (previewAudioRef.current) {
      try {
        previewAudioRef.current.pause();
      } catch {
        // ignore
      }
      previewAudioRef.current.srcObject = null;
    }
    setStatus((prev) => (prev === "previewing" ? "idle" : prev));
  }, []);

  const stopListening = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    stopPreview();
    setStatus("idle");
    setSpeaking(false);
  }, [audioRef, stopPreview]);

  const startListening = useCallback(async () => {
    console.debug("[DurmahVoice] startListening (Gemini) called");
    try {
      setError(null);
      setSpeaking(false);
      stopPreview();
      setStatus("connecting");

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.debug(`[DurmahVoice] ICE state: ${state}`);
        if (
          (state === "failed" || state === "disconnected") &&
          pcRef.current === pc
        ) {
          setError("Voice connection lost");
          stopListening();
        }
      };

      console.debug("[DurmahVoice] Requesting microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getAudioTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        console.debug("[DurmahVoice] Received remote track");
        const remoteStream =
          event.streams[0] || new MediaStream([event.track]);
        if (audioRef.current) {
          audioRef.current.srcObject = remoteStream;
          audioRef.current
            .play()
            .catch((err) => console.error("Audio play failed:", err));
        }
        setSpeaking(true);
        setStatus("speaking");
      };

      const dc = pc.createDataChannel("gemini-events");
      dcRef.current = dc;

      dc.onopen = () => {
        console.debug("[DurmahVoice] Data channel open");
        setStatus("listening");
        const setupMsg = {
          setup: {
            model: "models/gemini-2.0-flash-exp",
            generation_config: {
              speech_config: {
                voice_config: {
                  prebuilt_voice_config: {
                    voice_name: voice,
                  },
                },
              },
            },
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
          },
        };
        dc.send(JSON.stringify(setupMsg));
      };

      dc.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.serverContent?.modelTurn?.parts) {
            const textPart = payload.serverContent.modelTurn.parts.find(
              (part: any) => part.text
            );
            if (textPart) {
              onTurn?.({ speaker: "durmah", text: textPart.text });
            }
          }
        } catch {
          // Ignore malformed payloads
        }
      };

      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);

      const answerSdp = await requestAnswerSdp(offer.sdp ?? undefined);
      if (!answerSdp.includes("v=")) {
        throw new Error("Invalid response from voice service");
      }

      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });
      console.debug("[DurmahVoice] Call connected.");
    } catch (err: any) {
      console.error("Start call failed:", err);
      setError(err?.message || "Failed to start call");
      setStatus("error");
      stopListening();
    }
  }, [
    audioRef,
    onTurn,
    requestAnswerSdp,
    stopListening,
    stopPreview,
    systemPrompt,
    voice,
  ]);

  const playVoicePreview = useCallback(
    async (preset: { geminiVoice: string; previewText: string }) => {
      if (!preset?.geminiVoice) return;
      if (pcRef.current) {
        console.debug("[VoicePreview] Skipping preview during active call");
        return;
      }

      try {
        stopPreview();
        setStatus((prev) =>
          prev === "idle" || prev === "error" ? "previewing" : prev
        );

        const pc = new RTCPeerConnection();
        previewPcRef.current = pc;

        const audioEl = previewAudioRef.current ?? new Audio();
        audioEl.autoplay = true;
        audioEl.muted = false;
        previewAudioRef.current = audioEl;

        pc.ontrack = (event) => {
          const remoteStream =
            event.streams[0] || new MediaStream([event.track]);
          audioEl.srcObject = remoteStream;
          audioEl.play().catch(() => undefined);
        };

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        previewStreamRef.current = stream;
        stream.getAudioTracks().forEach((track) => pc.addTrack(track, stream));

        const dc = pc.createDataChannel("gemini-preview");
        previewDcRef.current = dc;

        dc.onopen = () => {
          const setupMsg = {
            setup: {
              model: "models/gemini-2.0-flash-exp",
              generation_config: {
                speech_config: {
                  voice_config: {
                    prebuilt_voice_config: {
                      voice_name: preset.geminiVoice,
                    },
                  },
                },
              },
            },
          };
          dc.send(JSON.stringify(setupMsg));

          const promptMsg = {
            client_content: {
              turns: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `Say exactly this phrase with emotion: "${preset.previewText}"`,
                    },
                  ],
                },
              ],
              turn_complete: true,
            },
          };

          setTimeout(() => {
            try {
              dc.send(JSON.stringify(promptMsg));
            } catch (err) {
              console.error("[VoicePreview] Failed to send prompt", err);
            }
          }, 300);
        };

        dc.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.serverContent?.turnComplete) {
              setTimeout(() => stopPreview(), 400);
            }
          } catch {
            // ignore
          }
        };

        const offer = await pc.createOffer({ offerToReceiveAudio: true });
        await pc.setLocalDescription(offer);

        const answerSdp = await requestAnswerSdp(offer.sdp ?? undefined);
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      } catch (err: any) {
        console.error("[VoicePreview] Failed:", err);
        setStatus((prev) => (prev === "previewing" ? "idle" : prev));
        setError((prev) => prev ?? err?.message ?? "Preview failed");
        stopPreview();
      }
    },
    [requestAnswerSdp, stopPreview]
  );

  useEffect(() => {
    return () => {
      stopListening();
      stopPreview();
    };
  }, [stopListening, stopPreview]);

  const voiceActive =
    status === "connecting" || status === "listening" || status === "speaking";

  return {
    startListening,
    stopListening,
    isListening: voiceActive,
    status,
    speaking,
    error,
    playVoicePreview,
  };
}
