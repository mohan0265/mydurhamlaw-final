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
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  
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
        setError('No API Key provided');
        reject(new Error('No API Key'));
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      // Reset audio scheduling state
      scheduledTimeRef.current = 0;
      audioQueueRef.current = [];
      isPlayingRef.current = false;

      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("[GeminiLive] Connected");
          setIsConnected(true);
          setError(null);
          
          // Send initial setup
          const setupMsg = {
            setup: {
              model: "models/gemini-2.0-flash-exp",
              generationConfig: {
                responseModalities: ["AUDIO"],
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
          
          // Kickstart conversation to verify audio output works
          const kickstartMsg = {
            clientContent: {
              turns: [{
                role: "user",
                parts: [{ text: "Hello Durmah" }]
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
            
            // Log everything for debugging
            // console.log("[GeminiLive] Rx:", JSON.stringify(data).slice(0, 200)); 
          } catch (e) {
            console.error("[GeminiLive] Error parsing message", e);
            return;
          }

          if (data.error) {
             console.error("[GeminiLive] Server error:", data.error);
             setError(`Server error: ${data.error.message || 'Unknown'}`);
             return;
          }
          
          if (data.serverContent) {
             if (data.serverContent.turnComplete) {
                 console.log("[GeminiLive] Turn Complete");
             }
             if (data.serverContent.modelTurn) {
                 console.log("[GeminiLive] Model Turn received");
                 if (data.serverContent.modelTurn.parts) {
                    console.log(`[GeminiLive] Parts: ${data.serverContent.modelTurn.parts.length}`);
                 }
             }
          }

          // Handle Text Output (Transcript)
          if (data.serverContent?.modelTurn?.parts) {
            for (const part of data.serverContent.modelTurn.parts) {
              if (part.text) {
                console.log("[GeminiLive] Rx Text:", part.text);
                setTranscript(prev => [...prev, {
                  role: 'assistant',
                  text: part.text,
                  timestamp: Date.now(),
                }]);
              }
            }
          }
          
          // Handle User Transcript (if available)
          // Note: Gemini Live might not always echo user text depending on config
          if (data.serverContent?.turnComplete && data.serverContent?.interrupted) {
              // Handle interruption if needed
          }

          // Handle Audio Output
          if (data.serverContent?.modelTurn?.parts) {
            for (const part of data.serverContent.modelTurn.parts) {
              if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                console.log(`[GeminiLive] Rx Audio chunk: ${part.inlineData.data.length} chars`);
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
        };

        ws.onerror = (e) => {
          console.error("WebSocket error:", e);
          setError("Connection error");
          setIsConnected(false);
          stopRecording();
          reject(e);
        };

        ws.onclose = (e) => {
          console.log(`[GeminiLive] Closed: ${e.code} ${e.reason}`);
          setIsConnected(false);
          stopRecording();
          if (e.code !== 1000 && e.code !== 1005) {
             setError(`Connection closed: ${e.code} ${e.reason || 'Unknown'}`);
          }
        };

      } catch (e: any) {
        setError(e.message);
        reject(e);
      }
    });
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      // Use default sample rate to avoid hardware mismatches
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      audioContextRef.current = audioContext;
      
      console.log(`[GeminiLive] AudioContext started. Rate: ${audioContext.sampleRate}`);

      const source = audioContext.createMediaStreamSource(stream);
      // Buffer size 4096 is ~85ms at 48kHz, ~256ms at 16kHz
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const targetRate = 16000;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Downsample if needed
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

        // Check for silence (debug)
        let maxAmp = 0;
        for (let i = 0; i < processedData.length; i++) {
            const val = processedData[i];
            const abs = Math.abs(val === undefined ? 0 : val);
            if (abs > maxAmp) maxAmp = abs;
        }
        if (Math.random() < 0.05) { // Log occasionally
             console.log(`[GeminiLive] Mic level: ${maxAmp.toFixed(4)}`);
        }

        const pcm16 = new Int16Array(processedData.length);
        for (let i = 0; i < processedData.length; i++) {
          const val = processedData[i];
          const s = Math.max(-1, Math.min(1, val === undefined ? 0 : val));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Safe Base64 conversion
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
    
    // Update state for UI
    setIsPlaying(true);
    
    source.onended = () => {
      isPlayingRef.current = false;
      // Only set state to false if queue is empty to avoid flickering
      if (audioQueueRef.current.length === 0) {
          setIsPlaying(false);
      }
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
    isPlaying,
    error,
    transcript,
    clearTranscript
  };
}
