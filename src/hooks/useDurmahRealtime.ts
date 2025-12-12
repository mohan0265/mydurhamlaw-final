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
  const transcriptBufferRef = useRef<string>("");

  const requestAnswerSdp = useCallback(
    async (offerSdp?: string | null, voiceOverride?: string) => {
      if (!offerSdp) {
        throw new Error("Missing SDP offer");
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/sdp",
      };
      const chosenVoice = voiceOverride || voice;
      if (chosenVoice) {
        headers["X-Durmah-Voice"] = chosenVoice;
      }

      const response = await fetch("/api/voice/offer", {
        method: "POST",
        headers,
        body: offerSdp,
      });

      const answerSdp = await response.text();

      if (!response.ok) {
        throw new Error(
          `Voice service error (${response.status}): ${
            answerSdp || response.statusText
          }`
        );
      }

      if (!answerSdp) {
        throw new Error("Voice service response was empty");
      }
      return answerSdp;
    },
    [voice]
  );

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
    transcriptBufferRef.current = "";
    setStatus("idle");
    setSpeaking(false);
  }, [audioRef, stopPreview]);

  const startListening = useCallback(async () => {
    console.debug("[DurmahVoice] startListening (OpenAI) called");
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

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        console.debug("[DurmahVoice] Data channel open");
        setStatus("listening");

        if (systemPrompt) {
          dc.send(
            JSON.stringify({
              type: "session.update",
              session: { instructions: systemPrompt },
            })
          );
        }

        dc.send(
          JSON.stringify({
            type: "response.create",
            response: {
              modalities: ["audio", "text"],
            },
          })
        );
      };

      dc.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "response.output_text.delta") {
            transcriptBufferRef.current += payload.delta || "";
          } else if (
            payload.type === "response.output_text.done" ||
            payload.type === "response.completed"
          ) {
            const text = transcriptBufferRef.current.trim();
            if (text) {
              onTurn?.({ speaker: "durmah", text });
            }
            transcriptBufferRef.current = "";
          } else if (payload.type === "response.error") {
            const msg =
              payload?.error?.message || "Realtime response error detected";
            console.error("[DurmahVoice] Response error:", msg);
            setError(msg);
          }
        } catch {
          // Ignore malformed payloads
        }
      };

      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);

      const answerSdp = await requestAnswerSdp(offer.sdp ?? undefined, voice);
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
    async (preset: { openaiVoice: string; previewText: string }) => {
      if (!preset?.openaiVoice) return;
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

        const dc = pc.createDataChannel("oai-preview");
        previewDcRef.current = dc;

        dc.onopen = () => {
          if (systemPrompt) {
            dc.send(
              JSON.stringify({
                type: "session.update",
                session: { instructions: systemPrompt },
              })
            );
          }
          const prompt = `Say exactly this phrase with emotion: "${preset.previewText}"`;
          dc.send(
            JSON.stringify({
              type: "response.create",
              response: {
                modalities: ["audio", "text"],
                instructions: prompt,
              },
            })
          );
        };

        dc.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (
              payload.type === "response.completed" ||
              payload.type === "response.output_audio.done"
            ) {
              setTimeout(() => stopPreview(), 400);
            }
          } catch {
            // ignore
          }
        };

        const offer = await pc.createOffer({ offerToReceiveAudio: true });
        await pc.setLocalDescription(offer);

        const answerSdp = await requestAnswerSdp(
          offer.sdp ?? undefined,
          preset.openaiVoice
        );
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      } catch (err: any) {
        console.error("[VoicePreview] Failed:", err);
        setStatus((prev) => (prev === "previewing" ? "idle" : prev));
        setError((prev) => prev ?? err?.message ?? "Preview failed");
        stopPreview();
      }
    },
    [requestAnswerSdp, stopPreview, systemPrompt]
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
