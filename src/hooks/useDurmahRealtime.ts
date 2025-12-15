import { useState, useRef, useCallback, useEffect } from "react";

const REALTIME_DEBUG =
  process.env.NEXT_PUBLIC_DURMAH_REALTIME_DEBUG === "true";
const TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";
const ENGLISH_SYSTEM_INSTRUCTION =
  "You are Durmah, an English-only legal mentor. Always transcribe and respond in English suitable for a Durham law student, even if the user speaks another language. Do not output Malay or any other language.";

export type VoiceTurn = { speaker: "user" | "durmah"; text: string };

function extractTextFromContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (typeof content.text === "string") return content.text;
  if (typeof content.transcript === "string") return content.transcript;
  if (Array.isArray(content)) {
    return content
      .map((entry) => extractTextFromContent(entry))
      .filter(Boolean)
      .join(" ");
  }
  if (Array.isArray(content?.parts)) {
    return content.parts
      .map((part: any) => extractTextFromContent(part))
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

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
  const assistantTranscriptRef = useRef<string>("");
  const userTranscriptRef = useRef<string>("");

  const debugLog = (...args: unknown[]) => {
    if (REALTIME_DEBUG) {
      console.debug("[DurmahRealtime]", ...args);
    }
  };

  const normalizeChunk = (text?: string) => text?.trim() ?? "";

  const mergeIncremental = useCallback((current: string, incoming?: string) => {
    const cur = normalizeChunk(current);
    const inc = normalizeChunk(incoming);
    if (!inc) return cur;
    if (!cur) return inc;
    const curLower = cur.toLowerCase();
    const incLower = inc.toLowerCase();
    if (incLower === curLower) return cur;
    if (incLower.startsWith(curLower)) return inc;
    if (curLower.startsWith(incLower)) return cur;
    return `${cur} ${inc}`.replace(/\s+/g, " ").trim();
  }, []);

  const appendAssistantText = useCallback((delta?: string) => {
    assistantTranscriptRef.current = mergeIncremental(
      assistantTranscriptRef.current,
      delta
    );
  }, [mergeIncremental]);

  const flushAssistantText = useCallback(
    (extra?: string) => {
      assistantTranscriptRef.current = mergeIncremental(
        assistantTranscriptRef.current,
        extra
      );
      const text = assistantTranscriptRef.current.trim();
      if (text) {
        onTurn?.({ speaker: "durmah", text });
      }
      assistantTranscriptRef.current = "";
    },
    [mergeIncremental, onTurn]
  );

  const appendUserText = useCallback((delta?: string) => {
    userTranscriptRef.current = mergeIncremental(userTranscriptRef.current, delta);
  }, [mergeIncremental]);

  const flushUserText = useCallback(
    (extra?: string) => {
      userTranscriptRef.current = mergeIncremental(
        userTranscriptRef.current,
        extra
      );
      const text = userTranscriptRef.current.trim();
      if (text) {
        onTurn?.({ speaker: "you", text });
      }
      userTranscriptRef.current = "";
    },
    [mergeIncremental, onTurn]
  );

  const handleConversationItem = useCallback(
    (payload: any) => {
      const item = payload?.item;
      if (!item) return;
      const text = extractTextFromContent(item.content);
      if (!text) return;
      if (item.role === "user") {
        flushUserText(text);
      } else if (item.role === "assistant") {
        flushAssistantText(text);
      }
    },
    [flushAssistantText, flushUserText]
  );

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
    assistantTranscriptRef.current = "";
    userTranscriptRef.current = "";
    setStatus("idle");
    setSpeaking(false);
  }, [audioRef, stopPreview]);

  const startListening = useCallback(async () => {
    console.debug("[DurmahVoice] startListening (OpenAI) called");
    try {
      setError(null);
      setSpeaking(false);
      assistantTranscriptRef.current = "";
      userTranscriptRef.current = "";
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

        dc.send(
          JSON.stringify({
            type: "session.update",
            session: {
              instructions: systemPrompt,
              input_audio_transcription: {
                model: TRANSCRIPTION_MODEL,
              },
            },
          })
        );

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
        const chunks = String(event.data)
          .split("\n")
          .map((part) => part.trim())
          .filter(Boolean);

        for (const chunk of chunks) {
          try {
            const payload = JSON.parse(chunk);
            const type = payload.type;
            debugLog("event", type);
            if (!type) continue;

            if (
              type === "response.audio_transcript.delta" ||
              type === "response.output_text.delta" ||
              type === "response.text.delta"
            ) {
              appendAssistantText(
                payload.delta ?? payload.text ?? payload.transcript ?? ""
              );
            } else if (
              type === "response.audio_transcript.done" ||
              type === "response.output_text.done" ||
              type === "response.text.done" ||
              type === "response.completed"
            ) {
              flushAssistantText(payload.transcript ?? payload.text ?? "");
            } else if (
              type === "input_audio_transcription.delta" ||
              type === "conversation.item.input_audio_transcription.delta"
            ) {
              appendUserText(
                payload.delta ?? payload.text ?? payload.transcript ?? ""
              );
            } else if (
              type === "input_audio_transcription.final" ||
              type === "input_audio_transcription.done" ||
              type === "conversation.item.input_audio_transcription.completed"
            ) {
              flushUserText(payload.transcript ?? payload.text ?? "");
            } else if (type === "conversation.item.created") {
              handleConversationItem(payload);
            } else if (
              type === "conversation.item.output_audio_transcription.completed"
            ) {
              flushAssistantText(payload.transcript ?? "");
            } else if (type === "response.audio.delta") {
              const b64 = payload.delta as string;
              const bytes = Uint8Array.from(atob(b64), (c) =>
                c.charCodeAt(0)
              );
              const blob = new Blob([bytes], { type: "audio/mpeg" });
              const url = URL.createObjectURL(blob);
              const audio = audioRef.current!;
              if (!audio.src) {
                audio.src = url;
                audio.onended = () => setSpeaking(false);
                setSpeaking(true);
                audio.play().catch(() => {});
              } else {
                audio.addEventListener(
                  "ended",
                  () => {
                    audio.src = url;
                    setSpeaking(true);
                    audio.play().catch(() => {});
                  },
                  { once: true }
                );
              }
            } else if (type === "response.error") {
              const msg =
                payload?.error?.message || "Realtime response error detected";
              console.error("[DurmahVoice] Response error:", msg);
              setError(msg);
            }
          } catch (err) {
            debugLog("Failed to parse realtime payload", chunk, err);
          }
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
    appendAssistantText,
    appendUserText,
    flushAssistantText,
    flushUserText,
    handleConversationItem,
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
          dc.send(
            JSON.stringify({
              type: "session.update",
              session: {
                instructions: `${ENGLISH_SYSTEM_INSTRUCTION}\n\n${systemPrompt}`,
                input_audio_transcription: {
                  model: TRANSCRIPTION_MODEL,
                  language: "en",
                },
              },
            })
          );
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
