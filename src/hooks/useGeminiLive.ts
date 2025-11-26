import { useEffect, useRef, useState, useCallback } from 'react';

// Types for Gemini Live API messages
type LiveConfig = {
  model: string;
  generationConfig?: {
    responseModalities?: 'audio' | 'image' | 'text';
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
};

type RealtimeInput = {
  realtimeInput: {
    mediaChunks: {
      mimeType: string;
      data: string; // base64
    }[];
  };
};

type ClientContent = {
  clientContent: {
    turns: {
      role: string;
      parts: { text: string }[];
    }[];
    turnComplete: boolean;
  };
};

export function useGeminiLive(apiKey: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const scheduledTimeRef = useRef(0);

  const connect = useCallback(async () => {
    if (!apiKey) {
      setError('No API Key provided');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        
        // Send initial setup
        const setupMsg = {
          setup: {
            model: "models/gemini-2.0-flash-exp", // Using the latest experimental model for live
            generationConfig: {
              responseModalities: "AUDIO",
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Puck" // Friendly voice
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{ text: "You are Durmah, a friendly, succinct voice mentor for Durham law students." }]
            }
          }
        };
        ws.send(JSON.stringify(setupMsg));
      };

      ws.onmessage = async (event) => {
        let data;
        if (event.data instanceof Blob) {
          data = JSON.parse(await event.data.text());
        } else {
          data = JSON.parse(event.data);
        }

        if (data.serverContent?.modelTurn?.parts) {
          for (const part of data.serverContent.modelTurn.parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
              // Decode base64 audio
              const audioData = atob(part.inlineData.data);
              const arrayBuffer = new ArrayBuffer(audioData.length);
              const view = new Uint8Array(arrayBuffer);
              for (let i = 0; i < audioData.length; i++) {
                view[i] = audioData.charCodeAt(i);
              }
              
              // Queue for playback
              queueAudio(arrayBuffer);
            }
          }
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setError("Connection error");
        setIsConnected(false);
        stopRecording();
      };

      ws.onclose = () => {
        setIsConnected(false);
        stopRecording();
      };

    } catch (e: any) {
      setError(e.message);
    }
  }, [apiKey]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopRecording();
    setIsConnected(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      mediaStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to PCM16
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const sample = inputData[i] || 0; // Fix undefined check
          const s = Math.max(-1, Math.min(1, sample));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Base64 encode
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
        
        const msg: RealtimeInput = {
          realtimeInput: {
            mediaChunks: [{
              mimeType: "audio/pcm;rate=16000",
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
      setError("Microphone access denied");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (processorRef.current && audioContextRef.current) {
      processorRef.current.disconnect();
      // audioContextRef.current.close(); // Don't close if we want to play response
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsStreaming(false);
  }, []);

  const queueAudio = async (arrayBuffer: ArrayBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 }); // Gemini output is often 24k
    }
    
    // Decode raw PCM? No, Gemini sends standard formats usually, but let's assume PCM if headerless
    // Actually the response says 'audio/pcm;rate=24000' usually.
    // We need to convert raw PCM to AudioBuffer.
    
    // Simple PCM16 to Float32 converter for playback
    const pcm16 = new Int16Array(arrayBuffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      const val = pcm16[i];
      float32[i] = (val === undefined ? 0 : val) / 32768.0; // Fix undefined check
    }

    audioQueueRef.current.push(float32);
    playQueue();
  };

  const playQueue = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) return;
    
    isPlayingRef.current = true;
    const chunk = audioQueueRef.current.shift()!;
    
    const buffer = audioContextRef.current.createBuffer(1, chunk.length, 24000); // Assuming 24k from Gemini
    // @ts-ignore - Float32Array type mismatch with DOM types
    buffer.copyToChannel(chunk, 0);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    const currentTime = audioContextRef.current.currentTime;
    const startTime = Math.max(currentTime, scheduledTimeRef.current);
    
    source.start(startTime);
    scheduledTimeRef.current = startTime + buffer.duration;
    
    source.onended = () => {
      isPlayingRef.current = false;
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
    error
  };
}
