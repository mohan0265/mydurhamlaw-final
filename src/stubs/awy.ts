export type AWYClient = { stop: () => void }

export function initAWY(): AWYClient { 
  return { stop(){} } 
}

export function useAWY(){ 
  return null 
}

export function AWYProvider({ children }: { children: React.ReactNode }){ 
  return children as any 
}

// Durmah context stubs  
export function useDurmah(): any {
  const stub = {
    state: 'idle',
    setState: () => {},
    isOpen: false,
    openWidget: () => {},
    closeWidget: () => {},
    openPanel: () => {},
    closePanel: () => {},
    messages: [] as any[],
    displayMessages: [] as { id: string; role: string; content: string; ts: number }[],
    pushMessage: (message: any) => {},
    clearMessages: () => {},
    transcriptOpen: false,
    openTranscript: () => {},
    closeTranscript: () => {},
    saveTranscript: () => Promise.resolve(),
    deleteTranscript: () => Promise.resolve(),
    isVoiceModeOpen: false,
    openVoiceMode: () => {},
    closeVoiceMode: () => {},
    startListening: () => {},
    stopListening: () => {},
    startSpeaking: () => {},
    stopSpeaking: () => {},
    setProcessing: () => {},
    setInterim: () => {}
  }
  
  // Return proxy that handles any property access
  return new Proxy(stub, {
    get(target, prop) {
      if (prop in target) {
        return target[prop as keyof typeof target]
      }
      // Return a no-op function for any unknown property
      return () => {}
    }
  })
}

export function DurmahProvider({ children }: { children: React.ReactNode }) {
  return children as any
}

// Voice hooks stubs
export function useDurmahVoice() {
  return {
    status: 'idle',
    isListening: false,
    startListening: () => {},
    stopListening: () => {},
    transcript: '',
    clearTranscript: () => {}
  }
}

export function useDurmahSpeech() {
  return {
    isListening: false,
    transcript: '',
    start: () => {},
    stop: () => {},
    clear: () => {}
  }
}

export function useDurmahVoiceMode() {
  return {
    isActive: false,
    start: () => {},
    stop: () => {},
    status: 'idle'
  }
}

export function useDurmahVoiceSession() {
  return {
    isActive: false,
    start: () => {},
    stop: () => {},
    status: 'idle'
  }
}