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

export type TranscriptItem = { role: 'user' | 'assistant'; text: string; timestamp: number };

export function useGeminiLive(apiKey: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  
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
            model: "models/gemini-2.5-flash",
            generationConfig: {
              responseModalities: "AUDIO",
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Puck"
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{ text: "You are Durmah, a friendly, succinct voice mentor for Durham law students. Keep your responses short and conversational, like a phone call." }]
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

        // Handle Audio Output
        if (data.serverContent?.modelTurn?.parts) {
          for (const part of data.serverContent.modelTurn.parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
              const audioData = atob(part.inlineData.data);
              const arrayBuffer = new ArrayBuffer(audioData.length);
              const view = new Uint8Array(arrayBuffer);
              for (let i = 0; i < audioData.length; i++) {
                view[i] = audioData.charCodeAt(i);
              }
              queueAudio(arrayBuffer);
            }
          }
        }

        // Handle Turn Complete (Transcript)
        // Note: The API might not send text transcript by default when responseModalities is AUDIO.
        // We might need to rely on client-side tracking or request text+audio if supported.
        // For now, we'll focus on the audio flow. 
        // If the API sends text parts, we can capture them.
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
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const sample = inputData[i] || 0;
          const s = Math.max(-1, Math.min(1, sample));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

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
    
    source.onended = () => {
      isPlayingRef.current = false;
      playQueue();
    };
  };

  const clearTranscript = useCallback(() => {
    setTranscript([]);
  }, []);

  return {
    connect,
    disconnect,
    startRecording,
    stopRecording,
    isConnected,
    isStreaming,
    error,
    transcript,
    clearTranscript
  };
}
