import { useState, useRef, useCallback, useEffect } from "react";
import { waitForAccessToken } from "@/lib/auth/waitForAccessToken";

const RAW_PROXY_URL = process.env.NEXT_PUBLIC_DURMAH_GEMINI_PROXY_WS_URL?.trim();
const DEFAULT_PROXY_URL =
  "wss://durmah-gemini-live-proxy-us-482960166397.us-central1.run.app";
const PROXY_URL = RAW_PROXY_URL || DEFAULT_PROXY_URL;

const RAW_LIVE_MODEL = process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL?.trim();
const DEFAULT_LIVE_MODEL = "gemini-2.0-flash-exp";

function sanitizeModelId(raw?: string) {
  const value = (raw || "").trim();
  if (!value) return "";
  const modelMatch = value.match(/models\/([^/]+)$/);
  if (modelMatch?.[1]) return modelMatch[1];
  return value
    .replace(/^models\//, "")
    .replace(/^projects\/[^/]+\/locations\/[^/]+\/publishers\/[^/]+\/models\//, "");
}

const LIVE_MODEL_ID = sanitizeModelId(RAW_LIVE_MODEL) || DEFAULT_LIVE_MODEL;

type VoiceTurn = { speaker: "user" | "durmah"; text: string };

interface UseDurmahGeminiLiveProps {
  systemPrompt: string;
  voice?: string; // Gemini Live voices are different, we might map or ignore
  onTurn?: (turn: VoiceTurn) => void;
  audioRef: React.RefObject<HTMLAudioElement>; // Not strictly used if we use Web Audio API for smooth playback, but kept for interface compat.
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    const b = bytes[i];
    if (b !== undefined) {
       binary += String.fromCharCode(b);
    }
  }
  return window.btoa(binary);
}

function pcmToFloat32(pcmData: Int16Array) {
    const float32 = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
        const val = pcmData[i];
        if (val !== undefined) {
             float32[i] = val / 32768;
        }
    }
    return float32;
}

export function useDurmahGeminiLive({
  systemPrompt,
  voice, // e.g. "Puck", "Charon", "Kore", "Fenrir" etc. Gemini has "Aoede", "Charon", "Fenrir", "Kore", "Puck"
  onTurn,
}: UseDurmahGeminiLiveProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "listening" | "speaking" | "error">("idle");
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioInputRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handshakeSentRef = useRef(false);
  const pendingAudioRef = useRef<string[]>([]);
  const manualCloseRef = useRef(false);
  const statusRef = useRef(status);
  
  // Audio Playback Queue
  const nextPlayTimeRef = useRef<number>(0);
  const playbackContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Helper to safely stop everything
  const cleanup = useCallback((manual: boolean) => {
    if (manual) {
      manualCloseRef.current = true;
    }
    setStatus("idle");
    setSpeaking(false);
    handshakeSentRef.current = false;
    pendingAudioRef.current = [];

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioInputRef.current) {
      audioInputRef.current.disconnect();
      audioInputRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (playbackContextRef.current) {
        playbackContextRef.current.close();
        playbackContextRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => cleanup(true), [cleanup]);

  const playAudioChunk = useCallback((base64Audio: string) => {
    try {
        const binary = window.atob(base64Audio);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        
        // Gemini Live Audio is PCM 16-bit, 24kHz, 1 channel, Little Endian (raw)
        // We need to convert to AudioBuffer
        const int16 = new Int16Array(bytes.buffer);
        const float32 = pcmToFloat32(int16);

        if (!playbackContextRef.current) {
            playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextPlayTimeRef.current = playbackContextRef.current.currentTime;
        }
        const ctx = playbackContextRef.current;
        
        const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
        audioBuffer.copyToChannel(float32, 0);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        // Schedule seamless playback
        const now = ctx.currentTime;
        // If we fell behind, reset to now
        if (nextPlayTimeRef.current < now) {
            nextPlayTimeRef.current = now;
        }
        
        source.start(nextPlayTimeRef.current);
        nextPlayTimeRef.current += audioBuffer.duration;

        source.onended = () => {
             // If this was the last chunk... but valid streaming keeps coming.
             // We can toggle 'speaking' state based on buffer queue or explicit events.
        };
        
        setSpeaking(true); // Simple toggle for UI
        
        // Auto-turn off speaking after a timeout if no more audio? 
        // Or rely on Gemini turn_complete events.
        
    } catch (e) {
        console.error("Audio playback error:", e);
    }
  }, []);

  const queueAudioPayload = useCallback((payload: string) => {
    const queue = pendingAudioRef.current;
    if (queue.length > 30) {
      queue.shift();
    }
    queue.push(payload);
  }, []);

  const flushAudioQueue = useCallback((ws: WebSocket) => {
    if (!handshakeSentRef.current) return;
    const queue = pendingAudioRef.current;
    while (queue.length > 0) {
      const next = queue.shift();
      if (next) ws.send(next);
    }
  }, []);

  const startListening = useCallback(async () => {
    try {
      setStatus("connecting");
      setError(null);
      handshakeSentRef.current = false;
      pendingAudioRef.current = [];

      if (!PROXY_URL) {
        setError("Voice proxy not configured.");
        setStatus("error");
        return;
      }
      if (process.env.NODE_ENV !== "development" && PROXY_URL.startsWith("ws://")) {
        setError("Voice proxy must use wss:// in production.");
        setStatus("error");
        return;
      }

      const { token } = await waitForAccessToken(); // might be null if anon

      // 1. Setup Audio Capture (16kHz)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
            channelCount: 1, 
            sampleRate: 16000 
        } 
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputsCtx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = inputsCtx;

      const source = inputsCtx.createMediaStreamSource(stream);
      audioInputRef.current = source;

      // Use ScriptProcessor for raw PCM access (bufferSize 2048 or 4096)
      const processor = inputsCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(inputsCtx.destination); // Required for script processor to run

      // 2. Setup WebSocket
      console.log("[DurmahGemini] proxy ws url =", PROXY_URL);
      const ws = new WebSocket(PROXY_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.info("[DurmahGemini] WS open");
        // Send Handshake
        const setupMsg = {
            auth: token ?? null, 
            setup: {
                model: LIVE_MODEL_ID,
                generationConfig: {
                    responseModalities: ["AUDIO", "TEXT"],
                    speechConfig: {
                         voiceConfig: { prebuiltVoiceConfig: { voiceName: voice || "Charon" } }
                    }
                },
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                }
            }
        };
        console.log("[DurmahGemini] Sending setup:", setupMsg);
        ws.send(JSON.stringify(setupMsg));
        handshakeSentRef.current = true;
        console.info("[DurmahGemini] Handshake sent", { hasAuth: Boolean(token) });
        flushAudioQueue(ws);
        setStatus("listening");
      };

      ws.onmessage = (event) => {
         try {
             // Incoming 'event.data' is Blob if binaryType not set (default blob)
             // But we expect text JSON from our proxy (proxy forwards text frames)
             const msgFn = async (data: any) => {
                let json;
                if (data instanceof Blob) {
                     json = JSON.parse(await data.text());
                } else {
                     json = JSON.parse(data as string);
                }
                
                if (json?.error) {
                  const msg =
                    typeof json.error === "string"
                      ? json.error
                      : json.error?.message || "Voice error";
                  setError(msg);
                  setStatus("error");
                  cleanup(false);
                  return;
                }

                if (json?.serverContent?.error) {
                  const msg = json.serverContent.error?.message || "Voice error";
                  setError(msg);
                  setStatus("error");
                  cleanup(false);
                  return;
                }

                // Handle Server Content
                if (json.serverContent) {
                    const turn = json.serverContent.modelTurn;
                    if (turn) {
                        for (const part of turn.parts) {
                            if (part.text) {
                                onTurn?.({ speaker: "durmah", text: part.text });
                            }
                            if (part.inlineData && part.inlineData.mimeType.startsWith("audio/")) {
                                playAudioChunk(part.inlineData.data);
                            }
                        }
                    }
                    if (json.serverContent.turnComplete) {
                        setSpeaking(false); // Rough heuristic
                    }
                }
                // Determine user transcript from partials?
                // Does Gemini echo user transcript? It might not in "Live" mode v1beta1 unless configured?
                // Actually it does not echo transcript by default in some versions.
                // If it does not, we lose user transcript.
                // workaround: we just show "..." or nothing for user.
                // OR we can rely on our visualizer.
             };
             msgFn(event.data);
         } catch (e) {
             console.error("WS Message Error", e);
         }
      };

      ws.onclose = (ev) => {
        console.warn("[DurmahGemini] WS closed", { code: ev.code, reason: ev.reason, wasClean: ev.wasClean });
        cleanup(false);
        if (!manualCloseRef.current && statusRef.current !== "idle") {
          const reason = ev.reason ? `: ${ev.reason}` : "";
          setError(`Voice connection closed (${ev.code})${reason}`);
          setStatus("error");
        }
        manualCloseRef.current = false;
      };
      
      ws.onerror = (e) => {
        console.error("[DurmahGemini] WS error", e);
        setError("Connection failed");
        setStatus("error");
        cleanup(false);
      };

      // 3. Audio Processing Loop
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0); // Float32 -1 to 1
        // Convert to PCM16
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            const val = inputData[i];
            const s = Math.max(-1, Math.min(1, val ?? 0));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Send base64
        const base64 = arrayBufferToBase64(pcm16.buffer);
        
        const payload = JSON.stringify({
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: "audio/pcm",
                data: base64
              }
            ]
          }
        });

        if (ws.readyState !== WebSocket.OPEN) {
          queueAudioPayload(payload);
          return;
        }

        if (!handshakeSentRef.current) {
          queueAudioPayload(payload);
          return;
        }

        ws.send(payload);
      };

    } catch (err: any) {
      console.error("Start listening failed", err);
      setError(err.message);
      setStatus("error");
      cleanup(false);
    }
  }, [systemPrompt, voice, onTurn, stopListening, queueAudioPayload, flushAudioQueue, cleanup]);

  return {
    status,
    isListening: status === "listening" || status === "speaking",
    startListening,
    stopListening,
    playVoicePreview: async () => {}, // No-op for now
    error,
    lastError: error,
    speaking
  };
}
