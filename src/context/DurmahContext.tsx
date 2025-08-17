import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type DurmahState = "idle" | "listening" | "speaking" | "conversation";

export type DurmahMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: number;
  isStreaming?: boolean;
};

// Enhanced message type for display (with merging support)
export type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
};

type DurmahContextType = {
  state: DurmahState;
  setState: (s: DurmahState) => void;

  messages: DurmahMessage[];
  displayMessages: DisplayMessage[]; // Grouped messages for clean display
  pushMessage: (m: Omit<DurmahMessage, "id" | "ts">) => void;
  clearMessages: () => void;

  // Voice mode controls
  isVoiceModeOpen: boolean;
  openVoiceMode: () => void;
  closeVoiceMode: () => void;

  // Legacy panel (for transition)
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;

  // voice session helpers
  interim: string;
  setInterim: (t: string) => void;
  startListening: () => void;
  stopListening: () => void;
  startSpeaking: () => void;
  stopSpeaking: () => void;
  isProcessing: boolean;
  setProcessing: (processing: boolean) => void;

  // transcript modal
  transcriptOpen: boolean;
  openTranscript: () => void;
  closeTranscript: () => void;
  saveTranscript: () => Promise<void>;
  deleteTranscript: () => Promise<void>;

  // audio control
  currentAudio: HTMLAudioElement | null;
  setCurrentAudio: (audio: HTMLAudioElement | null) => void;
  stopCurrentAudio: () => void;
};

// Helper function to merge adjacent same-role messages for clean display
function groupMessagesForDisplay(messages: DurmahMessage[]): DisplayMessage[] {
  const filtered = messages
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(({ role, content, id, ts }) => ({ role, content, id, ts } as DisplayMessage));

  const grouped: DisplayMessage[] = [];
  for (const msg of filtered) {
    const last = grouped[grouped.length - 1];
    if (last && last.role === msg.role) {
      // Merge content with proper punctuation spacing
      last.content = (last.content + " " + msg.content)
        .replace(/\s+/g, " ") // Normalize spaces
        .replace(/\s+([,!.?;:])/g, "$1") // Fix punctuation spacing
        .trim();
      last.ts = msg.ts; // Use latest timestamp
    } else {
      grouped.push({ ...msg });
    }
  }
  
  return grouped.map(msg => ({
    ...msg,
    content: msg.content.replace(/\s+([,!.?;:])/g, "$1").trim()
  }));
}

const DurmahContext = createContext<DurmahContextType | null>(null);

export const DurmahProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DurmahState>("idle");
  const [isOpen, setIsOpen] = useState(false); // Legacy panel
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false); // New voice mode
  const [messages, setMessages] = useState<DurmahMessage[]>([]);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [interim, setInterim] = useState("");
  const [isProcessing, setProcessing] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const idRef = useRef(0);
  const pushMessage = useCallback((m: Omit<DurmahMessage, "id" | "ts">) => {
    idRef.current += 1;
    setMessages(prev => [...prev, { ...m, id: String(idRef.current), ts: Date.now() }]);
  }, []);
  
  const clearMessages = useCallback(() => {
    setMessages([]);
    idRef.current = 0;
  }, []);
  
  // Generate display messages (grouped)
  const displayMessages = useMemo(() => groupMessagesForDisplay(messages), [messages]);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);

  const openVoiceMode = useCallback(() => {
    setIsVoiceModeOpen(true);
    setIsOpen(false); // Close legacy panel
  }, []);
  
  const closeVoiceMode = useCallback(() => {
    setIsVoiceModeOpen(false);
    setInterim("");
  }, []);

  const startListening = useCallback(() => {
    setState("listening");
    setInterim("");
    setProcessing(false);
    openPanel();
  }, [openPanel]);

  const stopListening = useCallback(() => {
    setState("idle");
    setInterim("");
  }, []);

  const startSpeaking = useCallback(() => {
    setState("speaking");
    setProcessing(false);
  }, []);
  
  const stopSpeaking = useCallback(() => {
    setState("conversation");
  }, []);
  
  const stopCurrentAudio = useCallback(() => {
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        const src = currentAudio.src;
        if (src && src.startsWith('blob:')) {
          URL.revokeObjectURL(src);
        }
      } catch (error) {
        console.warn('[Durmah] Error stopping audio:', error);
      }
      setCurrentAudio(null);
    }
    if (state === "speaking") {
      setState("conversation");
    }
  }, [currentAudio, state]);

  const openTranscript = useCallback(() => setTranscriptOpen(true), []);
  const closeTranscript = useCallback(() => setTranscriptOpen(false), []);

  // Enhanced transcript persistence
  const saveTranscript = useCallback(async () => {
    if (displayMessages.length === 0) {
      console.warn('[Durmah] No messages to save');
      setTranscriptOpen(false);
      return;
    }
    
    try {
      console.log('[Durmah] Saving transcript with', displayMessages.length, 'messages');
      // TODO: Implement Supabase saving here
      // await supabase.from('durmah_transcripts').insert({...})
      setTranscriptOpen(false);
    } catch (error) {
      console.error('[Durmah] Failed to save transcript:', error);
    }
  }, [displayMessages]);
  
  const deleteTranscript = useCallback(async () => {
    console.log('[Durmah] Deleting transcript');
    stopCurrentAudio();
    clearMessages();
    setInterim("");
    setState("idle");
    setTranscriptOpen(false);
  }, [clearMessages, stopCurrentAudio]);

  const value = useMemo(
    () => ({
      state,
      setState,
      messages,
      displayMessages,
      pushMessage,
      clearMessages,
      isVoiceModeOpen,
      openVoiceMode,
      closeVoiceMode,
      isOpen,
      openPanel,
      closePanel,
      interim,
      setInterim,
      startListening,
      stopListening,
      startSpeaking,
      stopSpeaking,
      isProcessing,
      setProcessing,
      transcriptOpen,
      openTranscript,
      closeTranscript,
      saveTranscript,
      deleteTranscript,
      currentAudio,
      setCurrentAudio,
      stopCurrentAudio,
    }),
    [
      state,
      messages,
      displayMessages,
      isVoiceModeOpen,
      isOpen,
      interim,
      isProcessing,
      transcriptOpen,
      currentAudio,
      pushMessage,
      clearMessages,
      openVoiceMode,
      closeVoiceMode,
      openPanel,
      closePanel,
      startListening,
      stopListening,
      startSpeaking,
      stopSpeaking,
      openTranscript,
      closeTranscript,
      saveTranscript,
      deleteTranscript,
      setCurrentAudio,
      stopCurrentAudio,
    ]
  );

  return <DurmahContext.Provider value={value}>{children}</DurmahContext.Provider>;
};

export const useDurmah = () => {
  const ctx = useContext(DurmahContext);
  if (!ctx) throw new Error("useDurmah must be used within DurmahProvider");
  return ctx;
};
