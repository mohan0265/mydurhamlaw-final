// src/lib/hooks/useDurmahSpeech.ts
import { useCallback, useRef, useEffect } from 'react';
import { ttsController } from '@/lib/voice/ttsController';

export type SpeechEvents = {
  onStart?: () => void;
  onEnd?: () => void;
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (err: string) => void;
  onVolumeChange?: (volume: number) => void;
};

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: any) => void) | null;
}

let recognition: SpeechRecognition | null = null;
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let microphone: MediaStreamAudioSourceNode | null = null;
let javascriptNode: ScriptProcessorNode | null = null;

export function useDurmahSpeech(events: SpeechEvents = {}) {
  const isClient = typeof window !== "undefined";
  const isActiveRef = useRef(false);
  
  const SpeechRecognitionClass: any = isClient ? 
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

  const isSupported = Boolean(SpeechRecognitionClass);

  const setupMicrophone = async () => {
    if (!isClient || !navigator.mediaDevices) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        javascriptNode.onaudioprocess = () => {
          if (analyser) { // Add null check here
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            let values = 0;

            const length = array.length;
            for (let i = 0; i < length; i++) {
              const value = array[i];
              if (value !== undefined) {
                values += value;
              }
            }

            const average = values / length;
            events.onVolumeChange?.(average);
          }
        }
    } catch (err) {
        console.error("Error setting up microphone", err);
    }
  };

  const build = useCallback(() => {
    if (!SpeechRecognitionClass) return null;
    
    if (recognition) {
        try {
            recognition.abort();
        } catch {}
    }

    recognition = new SpeechRecognitionClass() as SpeechRecognition;
    recognition.lang = "en-GB";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[Durmah] STT start');
      ttsController.stopAll();
      isActiveRef.current = true;
      setupMicrophone();
      events.onStart?.();
    };
    
    recognition.onend = () => {
      console.log('[Durmah] STT end');
      isActiveRef.current = false;
      if (microphone) {
        microphone.disconnect();
        microphone = null;
      }
      if (analyser) {
        analyser.disconnect();
        analyser = null;
      }
      if (javascriptNode) {
        javascriptNode.disconnect();
        javascriptNode = null;
      }
      if(audioContext) {
        audioContext.close();
        audioContext = null;
      }
      events.onEnd?.();
    };
    
    recognition.onerror = (e: any) => {
      console.warn('[Durmah] STT error:', e?.error);
      isActiveRef.current = false;
      const errorMsg = e?.error || "speech_error";
      
      if (errorMsg === 'no-speech' || errorMsg === 'aborted') {
        return;
      }
      
      events.onError?.(errorMsg);
    };

    recognition.onresult = (evt: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const result = evt.results[i];
        if (!result || !result[0]) continue;
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      
      if (interim.trim()) {
        events.onInterim?.(interim.trim());
      }
      
      if (final.trim()) {
        console.log('[Durmah] STT final:', final.trim());
        const cleanedTranscript = final.trim().replace(/(um|uh|\s)+/g, ' ');
        events.onFinal?.(cleanedTranscript);
      }
    };

    return recognition;
  }, [SpeechRecognitionClass, events]);

  const start = useCallback(() => {
    if (!isSupported || isActiveRef.current) return false;
    
    if (!recognition) {
        recognition = build();
    }

    if (!recognition) return false;
    
    try {
      recognition.start();
      return true;
    } catch (error) {
      console.error('[Durmah] STT failed to start:', error);
      events.onError?.('start_failed');
      return false;
    }
  }, [isSupported, build, events]);

  const stop = useCallback(() => {
    if (recognition && isActiveRef.current) {
      try {
        console.log('[Durmah] STT stop');
        recognition.stop();
      } catch (error) {
        console.warn('[Durmah] STT error stopping:', error);
      }
    }
  }, []);

  const abort = useCallback(() => {
    if (recognition) {
      try {
        console.log('[Durmah] STT abort');
        recognition.abort();
      } catch (error) {
        console.warn('[Durmah] STT error aborting:', error);
      }
    }
  }, []);

  const cleanup = useCallback(() => {
    abort();
    recognition = null;
  }, [abort]);

  useEffect(() => {
    return () => {
        cleanup();
    }
  }, [cleanup]);

  return { 
    isSupported, 
    start, 
    stop, 
    abort,
    cleanup,
    isRunning: () => isActiveRef.current
  };
}
