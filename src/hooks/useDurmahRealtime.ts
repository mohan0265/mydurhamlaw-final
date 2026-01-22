import { useState, useRef, useCallback, useEffect } from "react";
import { normalizeTranscriptLanguageSync } from "@/lib/durmah/normalizeTranscriptLanguage";
import { DURMAH_TOOLS } from "@/lib/durmah/tools";

// TEMPORARY: Enable debug logging to diagnose assistant transcript issue
const REALTIME_DEBUG = true; // Force enable for debugging
const TRANSCRIPTION_MODEL = "whisper-1";
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

// CHATGPT FIX: Normalize text for deduplication (removes spacing before punctuation)
const normalizeForDedupe = (s: string) =>
  (s || "")
    .replace(/\s+([,.!?;:])/g, "$1")  // Remove space before punctuation
    .replace(/\s+/g, " ")              // Collapse whitespace
    .trim()
    .toLowerCase();

interface UseDurmahRealtimeProps {
  systemPrompt: string;
  voice?: string;
  onTurn?: (turn: VoiceTurn) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

// P6B: Normalize common mishears of "Durmah"
function normalizeDurmahTranscriptions(text: string): string {
  if (!text) return "";
  const mapping: Record<string, RegExp> = {
    "Durmah": /\b(denmark|dharma|darma|durma|derma|doormah|duma|shimmer)\b/gi,
  };
  
  let normalized = text;
  Object.entries(mapping).forEach(([replacement, regex]) => {
    normalized = normalized.replace(regex, replacement);
  });
  
  // Specific phrases
  normalized = normalized.replace(/hi denmark/gi, "Hi Durmah");
  
  return normalized;
}

export function useDurmahRealtime({
  systemPrompt,
  voice = "shimmer",
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
  const hasGreetedRef = useRef(false);

  // CHATGPT FIX: Track last emitted text per speaker for dedupe
  const lastEmitRef = useRef({
    user: { text: "", ts: 0 },
    durmah: { text: "", ts: 0 },
  });

  const debugLog = (...args: unknown[]) => {
    if (REALTIME_DEBUG) {
      console.debug("[DurmahRealtime]", ...args);
    }
  };

  const normalizeChunk = (text?: string) => text?.trim() ?? "";

  // CHATGPT FIX: Fixed mergeIncremental to NOT create spacing before punctuation
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
    
    // FIXED: Don't just concat with space - check if inc starts with punctuation
    const needsSpace = !/^[,.!?;:]/.test(inc);
    const merged = needsSpace ? `${cur} ${inc}` : `${cur}${inc}`;
    return merged.replace(/\s+/g, " ").trim();
  }, []);


  // Handle function/tool calls from Realtime
  const handleFunctionCall = async (dc: RTCDataChannel, payload: any) => {
    const { call_id, name, arguments: argsStr } = payload;
    let args: any = {};
    
    try {
      args = JSON.parse(argsStr);
    } catch (e) {
      console.error("[FUNCTION CALL] Failed to parse args:", e);
      return;
    }

    console.log(`[FUNCTION CALL] ${name}`, args);
    
    let toolResult: any;
    try {
      if (name === "get_yaag_events") {
        const { startISO, endISO } = args;
        const res = await fetch(`/api/durmah/tools/yaag-events?startISO=${startISO}&endISO=${endISO}`);
        toolResult = await res.json();
      } else if (name === "get_news_headlines") {
        const params = new URLSearchParams();
        if (args.limit) params.set("limit", String(args.limit));
        if (args.topic) params.set("topic", args.topic);
        const res = await fetch(`/api/durmah/tools/news-headlines?${params}`);
        toolResult = await res.json();
      } else if (name === "get_assignment_details") {
        const res = await fetch(`/api/durmah/tools/assignment-by-id?id=${args.assignmentId}`);
        toolResult = await res.json();
      } else {
        toolResult = { error: "Unknown function: " + name };
      }
    } catch (error: any) {
      console.error(`[FUNCTION CALL] ${name} failed:`,error);
      toolResult = { error: error.message || "Tool execution failed" };
    }

    // Send tool result back
    dc.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: call_id,
        output: JSON.stringify(toolResult)
      }
    }));

    // Trigger response generation
    dc.send(JSON.stringify({
      type: "response.create"
    }));
  };

  const appendAssistantText = useCallback((delta?: string) => {
    assistantTranscriptRef.current = mergeIncremental(
      assistantTranscriptRef.current,
      delta
    );
  }, [mergeIncremental]);

  const appendUserText = useCallback((delta?: string) => {
    userTranscriptRef.current = mergeIncremental(userTranscriptRef.current, delta);
  }, [mergeIncremental]);

  // CHATGPT FIX: Unified emit function with dedupe at source
  const emitTurn = useCallback(
    (speaker: "user" | "durmah", textRaw: string) => {
      if (!textRaw) return;
      
      const normalized = normalizeForDedupe(textRaw);
      if (!normalized) return;
      
      const now = Date.now();
      const lastEmit = lastEmitRef.current[speaker];
      
      // Dedupe: skip if same speaker + same normalized text within 2500ms
      if (lastEmit.text === normalized && (now - lastEmit.ts) < 2500) {
        debugLog(`[DEDUPE] Skipping duplicate ${speaker} turn:`, normalized.slice(0, 50));
        return;
      }
      
      // Emit the turn with ORIGINAL text (not lowercased)
      // P6B: Normalize mishears before emitting
      const cleanText = normalizeDurmahTranscriptions(normalizeTranscriptLanguageSync(textRaw));
      if (cleanText) {
        onTurn?.({ speaker, text: cleanText });
        lastEmitRef.current[speaker] = { text: normalized, ts: now };
        debugLog(`[EMIT] ${speaker}:`, cleanText.slice(0, 50));
      }
    },
    [onTurn, debugLog]
  );

  const flushAssistantText = useCallback(
    (extra?: string) => {
      assistantTranscriptRef.current = mergeIncremental(
        assistantTranscriptRef.current,
        extra
      );
      const text = assistantTranscriptRef.current.trim();
      if (text) {
        emitTurn("durmah", text);
      }
      assistantTranscriptRef.current = "";
    },
    [mergeIncremental, emitTurn]
  );

  const flushUserText = useCallback(
    (extra?: string) => {
      userTranscriptRef.current = mergeIncremental(
        userTranscriptRef.current,
        extra
      );
      const text = userTranscriptRef.current.trim();
      if (text) {
        emitTurn("user", text);
      }
      userTranscriptRef.current = "";
    },
    [mergeIncremental, emitTurn]
  );

  // CHATGPT FIX: conversation.item.created calls emitTurn directly (no merge!)
  const handleConversationItem = useCallback(
    (payload: any) => {
      const item = payload?.item;
      if (!item) return;
      
      const text = extractTextFromContent(item.content);
      if (!text) return;
      
      if (item.role === "user") {
        userTranscriptRef.current = "";  // Clear buffer to avoid double-append
        emitTurn("user", text);
      } else if (item.role === "assistant") {
        assistantTranscriptRef.current = "";  // Clear buffer to avoid double-append
        emitTurn("durmah", text);
      }
    },
    [emitTurn]
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
      hasGreetedRef.current = false;
      // Reset dedupe state for new session
      lastEmitRef.current = {
        user: { text: "", ts: 0 },
        durmah: { text: "", ts: 0 },
      };
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
      // P2 FIX #5: Echo cancellation to prevent stray transcript fragments
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
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

        // NOTE: systemPrompt already contains TIMEZONE TRUTH block from server context
        // No need to add date/time here - it would duplicate and confuse the model
        const instructions = systemPrompt;

        // Send session configuration
        dc.send(
          JSON.stringify({
            type: "session.update",
            session: {
              instructions,
              tools: DURMAH_TOOLS,
              input_audio_transcription: {
                model: TRANSCRIPTION_MODEL,
                language: "en",
              },
            },
          })
        );

        // P0-1 FIX: REMOVED unconditional response.create
        // Server VAD with create_response=true will auto-respond after user speaks
        // This stops random greetings and duplicate responses
        debugLog("[SESSION] Datachannel ready, awaiting user speech");
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

            // CHATGPT FIX: Simplified event handling - ONE finalization path per role
            
            // User deltas: accumulate only
            if (
              type === "input_audio_transcription.delta" ||
              type === "conversation.item.input_audio_transcription.delta"
            ) {
              appendUserText(
                payload.delta ?? payload.text ?? payload.transcript ?? ""
              );
            }
            // User finalization: PRIMARY path (CRITICAL FIX)
            else if (
              type === "input_audio_transcription.final" ||
              type === "input_audio_transcription.done" ||
              type === "conversation.item.input_audio_transcription.completed" // ← WAS BEING SKIPPED!
            ) {
              flushUserText(payload.transcript ?? payload.text ?? "");
              debugLog(`[FINALIZE USER] via ${type}`);
            }
            // Assistant deltas: ONLY use response.output_text.delta (P0 FIX)
            // DO NOT use response.text.delta or response.audio_transcript.delta (causes duplicates)
            else if (type === "response.output_text.delta") {
              const delta = payload.delta ?? payload.text ?? "";
              if (delta) {
                appendAssistantText(delta);
                debugLog(`[ASSISTANT DELTA] "${delta.slice(0, 30)}..."`);
              }
            }
            // SKIP these to avoid duplication (use output_text.delta only)
            else if (
              type === "response.text.delta" ||
              type === "response.audio_transcript.delta"
            ) {
              debugLog(`[SKIP DUPLICATE] ${type} - using output_text.delta only`);
            }
            // Assistant finalization: conversation.item.created + response.completed
            else if (type === "conversation.item.created") {
              handleConversationItem(payload);
              debugLog(`[FINALIZE ASSISTANT] via conversation.item.created`);
            }
            else if (type === "response.completed") {
              // Flush any pending assistant text
              flushAssistantText();
              debugLog(`[FINALIZE ASSISTANT] via response.completed`);
            }
            // Still skip these specific duplicates
            else if (
              type === "response.audio_transcript.done" ||
              type === "response.output_text.done" ||
              type === "response.text.done" ||
              type === "conversation.item.output_audio_transcription.completed"
            ) {
              debugLog(`[SKIP] ${type} (covered by primary paths)`);
            }
            // Response.done - FALLBACK for assistant transcript
            else if (type === "response.done") {
              debugLog("[RESPONSE.DONE] Parsing output for assistant text...");
              // Extract assistant text from response.output array
              const response = payload?.response;
              if (response?.output) {
                let extractedText = "";
                for (const item of response.output) {
                  if (item.type === "message" && item.role === "assistant") {
                    // Walk content array for text
                    if (Array.isArray(item.content)) {
                      for (const content of item.content) {
                        if (content.type === "text" && content.text) {
                          extractedText += content.text + " ";
                        } else if (content.type === "audio" && content.transcript) {
                          // Audio with transcript
                          extractedText += content.transcript + " ";
                        } else if (content.transcript) {
                          extractedText += content.transcript + " ";
                        }
                      }
                    }
                  }
                }
                extractedText = extractedText.trim();
                if (extractedText) {
                  // Flush with extracted text
                  flushAssistantText(extractedText);
                  debugLog(`[FINALIZE ASSISTANT] via response.done: "${extractedText.slice(0, 50)}..."`);
                } else {
                  // No text extracted, flush buffer anyway
                  flushAssistantText();
                  debugLog(`[FINALIZE ASSISTANT] via response.done (no text in output)`);
                }
              } else {
                flushAssistantText();
                debugLog(`[FINALIZE ASSISTANT] via response.done (no output array)`);
              }
            }
            // Audio playback (unrelated to transcription)
            else if (type === "response.audio.delta") {
              // P2 FIX: Commented out to prevent double-audio (echo) since WebRTC track handles audio
              /*
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
              */
             debugLog(`[SKIP] response.audio.delta (handled by WebRTC track)`);
            }
            // Error handling
            else if (type === "response.error") {
              const msg =
                payload?.error?.message || "Realtime response error detected";
              console.error("[DurmahVoice] Response error:", msg);
              setError(msg);
            }
            // Function call handling
            else if (type === "response.function_call_arguments.done") {
              debugLog("[FUNCTION CALL]", payload.name, payload.arguments);
              handleFunctionCall(dc, payload).catch(err => {
                console.error("[FUNCTION CALL ERROR]", err);
              });
            }
                        // Log unhandled event types
            else {
              debugLog(`[UNHANDLED] event type: ${type}`);
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
    appendAssistantText,
    appendUserText,
    flushUserText,
    handleConversationItem,
    requestAnswerSdp,
    stopListening,
    stopPreview,
    systemPrompt,
    voice,
    debugLog,
  ]);

  // Handle dynamic system prompt updates
  useEffect(() => {
    if (status !== 'listening' && status !== 'speaking') return;
    if (!dcRef.current || dcRef.current.readyState !== 'open') return;

    const payload = {
      type: "session.update",
      session: {
        instructions: systemPrompt,
      },
    };

    try {
      if (REALTIME_DEBUG || true) {
        console.log(`[DurmahRealtime] session.update sent (len=${systemPrompt.length})`);
        console.log(`[DurmahRealtime] Instructions prefix: ${systemPrompt.slice(0, 120)}...`);
      }
      dcRef.current.send(JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to update session context", e);
    }
  }, [systemPrompt, status]);

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

  // Cleanup on component unmount ONLY
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      stopListening();
      stopPreview();
    };
  }, []);

  const voiceActive =
    status === "connecting" || status === "listening" || status === "speaking";

  return {
    startListening,
    stopListening,
    // Standard Interface Aliases for DurmahChat.tsx compatibility
    connect: startListening,
    disconnect: stopListening,
    isConnected: voiceActive,
    isListening: voiceActive, // Already present but confirming
    isSpeaking: speaking,     // Aligning naming if needed, though 'speaking' is returned below
    
    isListening: voiceActive,
    status,
    speaking,
    error,
    playVoicePreview,
  };
}
