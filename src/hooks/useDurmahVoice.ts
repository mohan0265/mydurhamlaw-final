/**
 * Durmah Voice Hook - Continuous Voice Loop
 * State machine: listening → thinking → speaking → listening (auto-loop)
 * Transcript only shown after End Chat
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabaseStore, VoiceMessage } from '../lib/voice/supabaseStore';
import { useAuth } from '../lib/supabase/AuthContext';

export type DurmahStatus = 'idle' | 'listening' | 'processing' | 'thinking' | 'speaking' | 'error';

export interface VoiceSettings {
  voiceId: string;
  speed: number;
  volume: number;
  guardrailsEnabled: boolean;
  vadThreshold: number;
  vadHangover: number;
}

export interface UseDurmahVoiceReturn {
  // State
  status: DurmahStatus;
  isRecording: boolean;
  error: string | null;
  sessionId: string | null;
  audioLevel: number; // For visual feedback
  isContinuous: boolean;
  
  // Actions
  startContinuous: () => Promise<void>;
  stopContinuous: () => void;
  bargeIn: () => void;
  endChat: () => { sessionId: string | null; messages: VoiceMessage[] };
  
  // Settings
  settings: VoiceSettings;
  updateSettings: (newSettings: Partial<VoiceSettings>) => void;
}

const defaultSettings: VoiceSettings = {
  voiceId: 'Rachel',
  speed: 1.0,
  volume: 0.8,
  guardrailsEnabled: true,
  vadThreshold: 0.01, // RMS threshold for voice detection
  vadHangover: 1500 // ms to wait after silence before stopping
};

export function useDurmahVoice(): UseDurmahVoiceReturn {
  // Auth context
  const { user } = useAuth();
  
  // State
  const [status, setStatus] = useState<DurmahStatus>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<VoiceSettings>(defaultSettings);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isContinuous, setIsContinuous] = useState(false);

  // In-memory message history (always available even if DB fails)
  const [messages, setMessages] = useState<VoiceMessage[]>([]);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Initialize a new voice session
   */
  const initializeSession = useCallback(async () => {
    if (!user) return;

    try {
      const session = await supabaseStore.createSession(user.id, {
        mode: 'continuous'
      });

      if (session) {
        setSessionId(session.id);
        console.log('DURMAH_CONTINUOUS_SESSION_INIT:', session.id);
      } else {
        // Generate fallback session ID for in-memory mode
        const fallbackId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(fallbackId);
        console.log('DURMAH_CONTINUOUS_SESSION_FALLBACK:', fallbackId);
      }
    } catch (error) {
      console.error('DURMAH_CONTINUOUS_SESSION_INIT_ERR:', error);
      // Generate fallback session ID
      const fallbackId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(fallbackId);
    }
  }, [user]);

  /**
   * TTS with events for state machine
   */
  const playTTS = useCallback(async (text: string) => {
    try {
      setStatus('speaking');
      console.log('DURMAH_TTS_START:', text.substring(0, 50));
      
      const ttsResponse = await fetch(`/api/voice/tts?text=${encodeURIComponent(text)}`);
      
      if (!ttsResponse.ok) {
        throw new Error(`TTS API error: ${ttsResponse.status}`);
      }

      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.volume = settings.volume;
      currentAudioRef.current = audio;
      
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          console.log('DURMAH_TTS_END');
          resolve();
        };
        
        audio.onerror = (e) => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          console.error('DURMAH_TTS_PLAY_ERR:', e);
          reject(new Error('Audio playback failed'));
        };
        
        audio.play().catch(reject);
      });
      
      // Auto-return to listening in continuous mode
      if (isContinuous) {
        console.log('DURMAH_AUTO_RETURN_TO_LISTENING');
        setTimeout(() => startListening(), 300);
      } else {
        setStatus('idle');
      }
      
    } catch (error) {
      console.error('DURMAH_TTS_ERR:', error);
      currentAudioRef.current = null;
      
      // Return to listening on TTS error
      if (isContinuous) {
        setTimeout(() => startListening(), 1000);
      } else {
        setStatus('idle');
      }
    }
  }, [settings.volume, isContinuous]);

  /**
   * Analyze audio level for VAD
   */
  const analyzeAudioLevel = useCallback(() => {
    if (!analyserRef.current) return 0;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate RMS (Root Mean Square) for volume level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i];
      if (value !== undefined) {
        sum += value * value;
      }
    }
    const rms = Math.sqrt(sum / bufferLength) / 255;
    
    return rms;
  }, []);

  /**
   * Start listening with VAD (Voice Activity Detection)
   */
  const startListening = useCallback(async () => {
    if (!isContinuous || isRecording || status === 'speaking') return;

    try {
      setError(null);
      setStatus('listening');
      setIsRecording(true);
      
      console.log('DURMAH_CONTINUOUS_LISTENING_START');

      // Clear any existing timeout
      if (vadTimeoutRef.current) {
        clearTimeout(vadTimeoutRef.current);
        vadTimeoutRef.current = null;
      }

      // Start MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
      }

      // Start VAD monitoring loop
      let silenceStart: number | null = null;
      let hasDetectedSpeech = false;

      const vadLoop = () => {
        if (!isContinuous || status !== 'listening') return;

        const level = analyzeAudioLevel();
        setAudioLevel(level);

        const isSpeaking = level > settings.vadThreshold;

        if (isSpeaking) {
          silenceStart = null;
          hasDetectedSpeech = true;
        } else if (hasDetectedSpeech && !silenceStart) {
          silenceStart = Date.now();
        }

        // Check if we should stop due to silence
        if (hasDetectedSpeech && silenceStart && 
            (Date.now() - silenceStart) > settings.vadHangover) {
          console.log('DURMAH_CONTINUOUS_VAD_STOP');
          stopListening();
          return;
        }

        animationFrameRef.current = requestAnimationFrame(vadLoop);
      };

      vadLoop();

    } catch (error) {
      console.error('DURMAH_CONTINUOUS_LISTENING_ERR:', error);
      setError('Failed to start listening');
      setStatus('error');
    }
  }, [isContinuous, isRecording, status, settings.vadThreshold, settings.vadHangover, analyzeAudioLevel]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    console.log('DURMAH_CONTINUOUS_LISTENING_STOP');

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clear VAD timeout
    if (vadTimeoutRef.current) {
      clearTimeout(vadTimeoutRef.current);
      vadTimeoutRef.current = null;
    }

    // Stop recording
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.warn('DURMAH_CONTINUOUS_RECORD_STOP_WARN:', error);
      }
    }

    setIsRecording(false);
    setAudioLevel(0);
  }, [isRecording]);

  /**
   * Process recorded audio through continuous state machine
   * listening → thinking → speaking → listening (auto-loop)
   */
  const processRecording = useCallback(async () => {
    if (audioChunksRef.current.length === 0 || !sessionId) {
      if (isContinuous) {
        setTimeout(() => startListening(), 500); // Retry listening
      }
      return;
    }

    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioChunksRef.current = [];

      // Skip if too short (less than 500ms)
      if (audioBlob.size < 1000) {
        console.log('DURMAH_CONTINUOUS_TOO_SHORT');
        if (isContinuous) {
          setTimeout(() => startListening(), 500); // Return to listening
        }
        return;
      }

      console.log('DURMAH_CONTINUOUS_TRANSCRIBE_START:', audioBlob.size, 'bytes');
      setStatus('processing');

      // Transcribe audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeResponse = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!transcribeResponse.ok) {
        throw new Error(`Transcription failed: ${transcribeResponse.status}`);
      }

      const { text: userText } = await transcribeResponse.json();
      
      if (!userText.trim()) {
        console.log('DURMAH_CONTINUOUS_TRANSCRIBE_EMPTY');
        if (isContinuous) {
          setTimeout(() => startListening(), 500); // Return to listening
        }
        return;
      }

      console.log('DURMAH_CONTINUOUS_TRANSCRIBE_OK:', userText);

      // Create user message with timestamp
      const userMessage: VoiceMessage = {
        id: `msg_${Date.now()}_user`,
        session_id: sessionId,
        role: 'user',
        content: userText,
        created_at: new Date().toISOString()
      };

      // Add to in-memory messages
      setMessages(prev => [...prev, userMessage]);

      // Try to save to Supabase (defensive)
      try {
        await supabaseStore.appendMessage(sessionId, 'user', userText);
      } catch (dbError) {
        console.warn('DURMAH_CONTINUOUS_DB_SAVE_WARN:', dbError);
      }
      
      setStatus('thinking');

      // Prepare messages for chat API
      const chatMessages = messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Send to chat API
      const chatResponse = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          messages: chatMessages
        })
      });

      if (!chatResponse.ok) {
        throw new Error(`Chat failed: ${chatResponse.status}`);
      }

      const { text: assistantText } = await chatResponse.json();
      console.log('DURMAH_CONTINUOUS_CHAT_OK:', assistantText.length, 'chars');

      // Create assistant message
      const assistantMessage: VoiceMessage = {
        id: `msg_${Date.now()}_assistant`,
        session_id: sessionId,
        role: 'assistant',
        content: assistantText,
        created_at: new Date().toISOString()
      };

      // Add to in-memory messages
      setMessages(prev => [...prev, assistantMessage]);

      // Try to save to Supabase (defensive)
      try {
        await supabaseStore.appendMessage(sessionId, 'assistant', assistantText);
      } catch (dbError) {
        console.warn('DURMAH_CONTINUOUS_DB_SAVE_WARN:', dbError);
      }

      // Start TTS playback
      await playTTS(assistantText);

    } catch (error) {
      console.error('DURMAH_CONTINUOUS_PROCESS_ERR:', error);
      setError(error instanceof Error ? error.message : 'Processing failed');
      setStatus('error');
      
      // Try to recover by returning to listening after error
      if (isContinuous) {
        setTimeout(() => {
          setError(null);
          startListening();
        }, 2000);
      }
    }
  }, [sessionId, messages, isContinuous, startListening, playTTS]);

  /**
   * Setup microphone and VAD for continuous listening
   */
  const setupMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      audioStreamRef.current = stream;

      // Setup audio context for VAD
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 512;
      analyser.minDecibels = -100;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.85;
      
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Setup MediaRecorder
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('DURMAH_CONTINUOUS_RECORD_STOP');
        await processRecording();
      };

      console.log('DURMAH_CONTINUOUS_MIC_SETUP_OK');
      return true;
    } catch (error) {
      console.error('DURMAH_CONTINUOUS_MIC_SETUP_ERR:', error);
      setError('Failed to access microphone. Please check permissions.');
      return false;
    }
  }, [processRecording]);

  // Initialize session when user is available
  useEffect(() => {
    if (user && !sessionId) {
      initializeSession();
    }
  }, [user, sessionId, initializeSession]);

  /**
   * Start continuous mode
   */
  const startContinuous = useCallback(async () => {
    if (isContinuous) return;

    try {
      setError(null);
      console.log('DURMAH_CONTINUOUS_MODE_START');

      const setupSuccess = await setupMicrophone();
      if (!setupSuccess) return;

      setIsContinuous(true);
      
      // Start listening immediately
      await startListening();

    } catch (error) {
      console.error('DURMAH_CONTINUOUS_START_ERR:', error);
      setError('Failed to start continuous mode. Please check microphone permissions.');
      setStatus('error');
    }
  }, [isContinuous, setupMicrophone, startListening]);

  /**
   * Stop continuous mode
   */
  const stopContinuous = useCallback(() => {
    console.log('DURMAH_CONTINUOUS_MODE_STOP');

    setIsContinuous(false);
    stopListening();

    // Stop current audio playback
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    // Clean up media stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    // Clean up audio context
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (error) {
        console.warn('DURMAH_CONTINUOUS_AUDIO_CONTEXT_CLOSE_WARN:', error);
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevel(0);
    setStatus('idle');
  }, [stopListening]);

  /**
   * Barge-in functionality - interrupt TTS and start listening
   */
  const bargeIn = useCallback(() => {
    console.log('DURMAH_CONTINUOUS_BARGE_IN');
    
    // Stop current audio playback immediately
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    // If in continuous mode, start listening immediately
    if (isContinuous) {
      setTimeout(() => startListening(), 100);
    }
  }, [isContinuous, startListening]);

  /**
   * End chat session and return messages for transcript
   */
  const endChat = useCallback(() => {
    console.log('DURMAH_CONTINUOUS_END_CHAT');
    
    // Stop continuous mode
    stopContinuous();
    
    // Return session data for transcript
    const sessionData = {
      sessionId,
      messages: [...messages]
    };
    
    // Clear current session data
    setMessages([]);
    setSessionId(null);
    setError(null);
    
    // Create new session for next conversation
    if (user) {
      initializeSession();
    }
    
    return sessionData;
  }, [stopContinuous, sessionId, messages, user, initializeSession]);

  /**
   * Update voice settings
   */
  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    // State
    status,
    isRecording,
    error,
    sessionId,
    audioLevel,
    isContinuous,
    
    // Actions
    startContinuous,
    stopContinuous,
    bargeIn,
    endChat,
    
    // Settings
    settings,
    updateSettings
  };
}