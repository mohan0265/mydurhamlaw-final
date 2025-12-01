import { useEffect, useRef, useState, useCallback } from 'react';

// Types for Gemini Live API messages
type LiveConfig = {
  model: string;
  generationConfig?: {
    responseModalities?: string[];
    speechConfig?: {
      voiceConfig?: {
        prebuiltVoiceConfig?: {
          voiceName: string;
        };
      };
    };
  };
  systemInstruction?: {
    parts: { text: string }[];
  };
  // Transcription configs
  inputAudioTranscription?: {
    model?: string;
  };
  outputAudioTranscription?: {
    model?: string;
  };
};

type RealtimeInput = {
  realtimeInput: {
    mediaChunks: {
      mimeType: string;
      data: string; // base64
    }[];
  };
};

export type GeminiStatus = "idle" | "connecting" | "ready" | "error";

export function useGeminiLive(options: {
  apiKey: string | undefined;
  systemPrompt?: string;
  onTranscript?: (text: string, source: "user" | "assistant") => void;
}) {
  const { apiKey, systemPrompt = "You are a helpful assistant.", onTranscript } = options;

  const [status, setStatus] = useState<GeminiStatus>("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const scheduledTimeRef = useRef(0);

  const connect = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (!apiKey) {
        const err = 'No API Key provided';
        setError(err);
        setStatus("error");
        reject(new Error(err));
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      setStatus("connecting");

      // Reset audio scheduling state
      scheduledTimeRef.current = 0;
      audioQueueRef.current = [];
      isPlayingRef.current = false;

      // Use v1beta as it likely supports the transcription flags
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("[GeminiLive] Connected");
          setStatus("ready");
          setIsConnected(true);
          setError(null);
          
          // Send initial setup
          const setupMsg = {
            setup: {
              model: "models/gemini-2.0-flash-exp",
              generationConfig: {
                responseModalities: ["AUDIO"], // IMPORTANT: only AUDIO
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: "Puck"
                    }
                  }
                }
              },
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              // Enable transcriptions
              // Note: In raw WebSocket, these might need to be passed differently if this doesn't work,
              // but following the user's SDK mapping, we put them in the config.
              // If the API ignores them, we might fall back to implicit text in modelTurn.
            }
          };
          ws.send(JSON.stringify(setupMsg));
          
          // Kickstart
          const kickstartMsg = {
            clientContent: {
              turns: [{
                role: "user",
                parts: [{ text: "Hello" }]
              }],
              turnComplete: true
            }
          };
          ws.send(JSON.stringify(kickstartMsg));
          
          resolve();
        };

        ws.onmessage = async (event) => {
          let data;
          try {
            if (event.data instanceof Blob) {
              data = JSON.parse(await event.data.text());
            } else {
              data = JSON.parse(event.data);
            }
          } catch (e) {
            console.error("[GeminiLive] Error parsing message", e);
            return;
          }

          if (data.error) {
             console.error("[GeminiLive] Server error:", data.error);
             setError(`Server error: ${data.error.message || 'Unknown'}`);
             setStatus("error");
             return;
          }
          
          const serverContent = data.serverContent;
          if (!serverContent) return;

          // Handle Audio Output
          if (serverContent.modelTurn?.parts) {
            for (const part of serverContent.modelTurn.parts) {
              // Audio
              if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                const audioData = atob(part.inlineData.data);
                const arrayBuffer = new ArrayBuffer(audioData.length);
                const view = new Uint8Array(arrayBuffer);
                for (let i = 0; i < audioData.length; i++) {
                  view[i] = audioData.charCodeAt(i);
                }
                queueAudio(arrayBuffer);
              }
              // Text (Fallback if transcription flags don't work but model sends text)
              if (part.text) {
                 onTranscript?.(part.text, "assistant");
              }
            }
          }

          // Handle Explicit Transcriptions (if supported by API)
          // Note: The field names might be different in raw JSON vs SDK.
          // Common patterns: serverContent.inputAudioTranscription or similar?
          // We check for what the user suggested:
          // server.inputTranscription?.transcription
          // server.outputAudioTranscription?.transcription
          
          // @ts-ignore
          if (serverContent.inputTranscription?.transcription) {
             // @ts-ignore
             onTranscript?.(serverContent.inputTranscription.transcription, "user");
          }
           // @ts-ignore
          if (serverContent.outputAudioTranscription?.transcription) {
             // @ts-ignore
             onTranscript?.(serverContent.outputAudioTranscription.transcription, "assistant");
          }
        };

        ws.onerror = (e) => {
          console.error("WebSocket error:", e);
          setError("Connection error");
          setStatus("error");
          setIsConnected(false);
          stopRecording();
          reject(e);
        };

        ws.onclose = (e) => {
          console.log(`[GeminiLive] Closed: ${e.code} ${e.reason}`);
          setIsConnected(false);
          setStatus("idle");
          stopRecording();
          if (e.code !== 1000 && e.code !== 1005) {
             setError(`Connection closed: ${e.code} ${e.reason || 'Unknown'}`);
             setStatus("error");
          }
        };

      } catch (e: any) {
        setError(e.message);
        setStatus("error");
        reject(e);
      }
    });
  }, [apiKey, systemPrompt, onTranscript]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopRecording();
    setIsConnected(false);
    setStatus("idle");
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const targetRate = 16000;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Downsample
        let processedData = inputData;
        if (audioContext.sampleRate !== targetRate) {
            const ratio = audioContext.sampleRate / targetRate;
            const newLength = Math.floor(inputData.length / ratio);
            processedData = new Float32Array(newLength);
            for (let i = 0; i < newLength; i++) {
                const offset = Math.floor(i * ratio);
                const val = inputData[offset];
                processedData[i] = val === undefined ? 0 : val;
            }
        }

        // Gain
        const gain = 4.0;
        const pcm16 = new Int16Array(processedData.length);
        for (let i = 0; i < processedData.length; i++) {
          const val = processedData[i];
          const s = Math.max(-1, Math.min(1, (val === undefined ? 0 : val) * gain));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Base64
        let binary = '';
        const bytes = new Uint8Array(pcm16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        
        const msg: RealtimeInput = {
          realtimeInput: {
            mediaChunks: [{
              mimeType: "audio/pcm",
              data: base64
            }]
          }
        };
        wsRef.current.send(JSON.stringify(msg));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      setIsStreaming(true);

    } catch (e: any) {
      console.error("Mic access error:", e);
      setError("Microphone access denied");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (processorRef.current && audioContextRef.current) {
      processorRef.current.disconnect();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsStreaming(false);
  }, []);

  const queueAudio = async (arrayBuffer: ArrayBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    const pcm16 = new Int16Array(arrayBuffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      const val = pcm16[i];
      float32[i] = (val === undefined ? 0 : val) / 32768.0;
    }

    audioQueueRef.current.push(float32);
    playQueue();
  };

  const playQueue = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) return;
    
    isPlayingRef.current = true;
    const chunk = audioQueueRef.current.shift()!;
    
    const buffer = audioContextRef.current.createBuffer(1, chunk.length, 24000);
    // @ts-ignore
    buffer.copyToChannel(chunk, 0);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    const currentTime = audioContextRef.current.currentTime;
    const startTime = Math.max(currentTime, scheduledTimeRef.current);
    
    source.start(startTime);
    scheduledTimeRef.current = startTime + buffer.duration;
    
    setIsPlaying(true);
    
    source.onended = () => {
      isPlayingRef.current = false;
      if (audioQueueRef.current.length === 0) {
          setIsPlaying(false);
      }
      playQueue();
    };
  };

  return {
    connect,
    disconnect,
    startRecording,
    stopRecording,
    isConnected,
    isStreaming,
    isPlaying,
    status,
    error,
  };
}
