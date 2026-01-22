import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Brain, AlertTriangle, Send, Mic, MicOff, Maximize2, Minimize2, FileText, Check, Loader2 } from 'lucide-react';
import { useAuth, useSupabaseClient } from '@/lib/supabase/AuthContext';
import { useDurmah } from '@/lib/durmah/context';
import { useDurmahDynamicContext } from '@/hooks/useDurmahDynamicContext';
import { buildDurmahSystemPrompt, buildDurmahContextBlock } from '@/lib/durmah/systemPrompt';
import { useDurmahChat, DurmahMessage } from '@/hooks/useDurmahChat';
import { useDurmahRealtime } from '@/hooks/useDurmahRealtime';
import { useDurmahGeminiLive } from '@/hooks/useDurmahGeminiLive';
import { useDurmahSettings } from '@/hooks/useDurmahSettings';
import toast from 'react-hot-toast';
import { v5 as uuidv5 } from 'uuid';

// Namespace for deterministic UUIDs (Durmah Context Namespace) matches useDurmahChat
const DURMAH_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// Voice Provider Selection Logic
function getVoiceProvider(): 'openai' | 'gemini' {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('durmah_voice_override');
    if (override === 'openai' || override === 'gemini') return override;
  }
  return (process.env.NEXT_PUBLIC_DURMAH_VOICE_PROVIDER || 'openai').toLowerCase() === 'gemini' 
    ? 'gemini' 
    : 'openai';
}

const VOICE_PROVIDER = getVoiceProvider();

interface DurmahChatProps {
  contextType: "assignment" | "exam" | "general";
  contextTitle: string;
  contextId?: string; // Assignment ID or Module Code
  systemHint?: string;
  initialPrompt?: string;
  className?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function DurmahChat({
  contextType,
  contextTitle,
  contextId,
  systemHint,
  initialPrompt,
  className = "",
  isMinimized = false,
  onToggleMinimize,
}: DurmahChatProps) {
  const { user } = useAuth();
  const supabase = useSupabaseClient();
  const durmahCtx = useDurmah();
  const { upcomingTasks, todaysEvents } = useDurmahDynamicContext();
  const { voiceId } = useDurmahSettings();

  // Voice Hook Selection
  const useVoiceHook = VOICE_PROVIDER === 'gemini' ? useDurmahGeminiLive : useDurmahRealtime;
  
  // State
  const [input, setInput] = useState("");
  // Local expand state for chat history ONLY when minimized
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize Chat Hook (Persistent Session per Assignment)
  const { 
    messages, 
    sendMessage, 
    isLoading: isChatLoading, 
    conversationId,
    logMessage
  } = useDurmahChat({
    source: 'assignment',
    scope: 'assignment',
    context: { 
      assignmentId: contextId,
      title: contextTitle,
      mode: 'study' 
    },
    // Stabilize session ID based on Assignment ID for persistence
    sessionId: contextId ? uuidv5(`assignment-${user?.id}-${contextId}`, DURMAH_NAMESPACE) : null
  });

  // Audio Ref for Voice
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // CRITICAL FIX: Create audio element ONCE
  useEffect(() => {
    if (!audioRef.current) {
        const audio = document.createElement('audio');
        audio.style.display = 'none';
        audio.id = `durmah-chat-audio-${contextId || 'general'}`;
        document.body.appendChild(audio);
        audioRef.current = audio;
    }
    return () => {
        if (audioRef.current && document.body.contains(audioRef.current)) {
            document.body.removeChild(audioRef.current);
            audioRef.current = null;
        }
    };
  }, [contextId]);

  // 2. Initialize Voice Hook
  
  // Handler for voice transcripts
  const handleVoiceTurn = useCallback(async (turn: { speaker: 'user' | 'durmah'; text: string }) => {
      // Log to chat history without triggering text response
      if (!turn.text) return;
      
      // Determine role
      const role = turn.speaker === 'user' ? 'user' : 'assistant';
      
      // Use logMessage directly from useDurmahChat to persist to DB and update UI
      if (logMessage) {
          await logMessage(role, turn.text, 'voice');
      }
  }, [logMessage]);

  const {
    isConnected: isVoiceConnected,
    isListening: isVoiceListening,
    isSpeaking: isVoiceSpeaking,
    connect: connectVoice,
    disconnect: disconnectVoice,
    mode: voiceMode,
    transcript: voiceTranscript
  } = useVoiceHook({
    enabled: true,
    userName: durmahCtx.firstName || 'Student',
    voiceId: voiceId,
    initialMessage: initialPrompt || `I'm ready to help with ${contextTitle}.`,
    // Pass BOTH systemInstruction (Gemini) and systemPrompt (Realtime)
    systemInstruction: `You are Durmah, a helpful academic tutor. You are helping with the assignment: "${contextTitle}". Be concise, encouraging, and helpful. Do not write the essay for the student.`,
    systemPrompt: `You are Durmah, a helpful academic tutor. You are helping with the assignment: "${contextTitle}". 
    
CONTEXT:
${systemHint || 'No specific stage context provided.'}

INSTRUCTIONS:
- Be concise, encouraging, and helpful.
- Do not write the essay for the student.
- If the user asks for milestones or specific help, use the context provided.`,
    onTurn: handleVoiceTurn,
    audioRef // Pass the audio ref!
  });


  // 4. Auto-Scroll
  useEffect(() => {
    // Use block: 'nearest' to avoid scrolling the entire page if the widget is focused
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, voiceTranscript]);

  // 5. Explicitly handle initial Prompt if provided (only once)
  const initialPromptSentRef = useRef(false);
  useEffect(() => {
    if (initialPrompt && !initialPromptSentRef.current && conversationId && messages.length === 0) {
       sendMessage(initialPrompt, 'text');
       initialPromptSentRef.current = true;
    }
  }, [initialPrompt, conversationId, messages.length, sendMessage]);

  // 6. SYNC TO JOURNAL (Auto-Save Logic)
  const syncToJournal = useCallback(async () => {
    if (!user || !supabase || !contextId || messages.length === 0) return;
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      // A. Deterministic Journal ID for this assignment
      const journalId = uuidv5(`journal-${contextId}`, DURMAH_NAMESPACE);
      const folderName = `Assignment: ${contextTitle.substring(0, 50)}`;

      // B. Ensure Folder Exists
      // We try to find it first
      const { data: folderData } = await supabase
        .from('transcript_folders')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', folderName)
        .single();
      
      let folderId = folderData?.id;

      if (!folderId) {
        // Create it
        const { data: newFolder } = await supabase
          .from('transcript_folders')
          .insert({
             user_id: user.id,
             name: folderName,
             color: '#8B5CF6' // Violet
          })
          .select('id')
          .single();
        folderId = newFolder?.id;
      }

      // C. Upsert Journal Entry
      const transcriptJSON = messages.map(m => ({
          role: m.role === 'user' ? 'you' : 'durmah',
          text: m.content,
          ts: new Date(m.created_at).getTime()
      }));

      const { error: journalError } = await supabase
        .from('voice_journals')
        .upsert({
            id: journalId,
            user_id: user.id,
            topic: `Discussion: ${contextTitle}`,
            summary: `Ongoing discussion about ${contextTitle}. Updated ${new Date().toLocaleTimeString()}`,
            transcript: transcriptJSON,
            // duration column removed as it does not exist in schema
            created_at: new Date().toISOString(), // Keep updating? No, preserve start.
            updated_at: new Date().toISOString()
        })
        .select();

       if (journalError) throw journalError;

       // D. Ensure Link to Folder
       if (folderId) {
           await supabase
             .from('transcript_folder_items')
             .upsert({
                 folder_id: folderId,
                 journal_id: journalId,
                 user_id: user.id
             }, { onConflict: 'folder_id,journal_id' });
       }

       setLastSyncedAt(new Date());
       // toast.success('Progress saved', { id: 'autosave', duration: 1000 });

    } catch (err) {
        console.error('Auto-save failed:', err);
    } finally {
        setIsSyncing(false);
    }
  }, [user, supabase, contextId, contextTitle, messages, isSyncing]);

  // 7. Trigger Auto-Save
  useEffect(() => {
     // Save every 30 seconds if messages change
     if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
     
     autoSaveTimerRef.current = setTimeout(() => {
         if (messages.length > 0) syncToJournal();
     }, 30000);

     return () => {
         if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
     };
  }, [messages, syncToJournal]);

  // Handle Unmount Save
  // Note: Reliable unmount save is hard in React. We rely on the periodic save 
  // and the manual "Save" button if we add one.

  const handleSendMessage = async () => {
    if (!input.trim() || isChatLoading) return;
    await sendMessage(input, 'text');
    setInput("");
    // Trigger immediate sync after message (debounced by logic above? No, let's just trigger it)
    setTimeout(syncToJournal, 1000);
  };

  const toggleVoice = () => {
      if (isVoiceConnected) {
          disconnectVoice();
      } else {
          connectVoice();
      }
  };

  // Determine if we should show full UI or Minimized Pill
  const showFullUI = !isMinimized || isHistoryVisible;

  return (
    <div className={`flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 ${className}`}>
      {/* Header */}
      {/* Header matching DurmahWidget */}
      <div 
          className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shrink-0 ${
              isMinimized ? 'rounded-xl cursor-pointer hover:from-violet-500 hover:to-indigo-500' : 'rounded-t-xl'
          }`}
          onClick={() => {
              // Clicking header in minimized mode expands the history/input temporarily (like accordion)
              if(isMinimized && !onToggleMinimize) setIsHistoryVisible(!isHistoryVisible);
          }}
      >
        <div className="flex items-center gap-2">
            {/* Brain/Mic Icon Bubble */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                isVoiceConnected 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-white/20 text-white backdrop-blur-sm'
            }`}>
                {isVoiceConnected ? <Mic size={16} /> : <Brain size={16} />}
            </div>
            
            <div className="flex flex-col">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                    Durmah
                    {isSyncing && <Loader2 size={10} className="animate-spin text-white/70" />}
                    {!isSyncing && lastSyncedAt && (
                        <span title="Saved" className="flex items-center">
                            <Check size={10} className="text-green-300" />
                        </span>
                    )}
                    {isMinimized && <span className="text-[10px] bg-white/20 px-1 rounded ml-1">Mini</span>}
                </div>
                {!isMinimized && (
                    <div className="text-xs text-indigo-100 font-medium truncate max-w-[150px]">
                        {contextType === 'assignment' ? 'Assignment Mentor' : 'Exam Coach'}
                    </div>
                )}
            </div>
        </div>
        
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {/* Voice Toggle - Visible even in Minimized State */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    toggleVoice();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all font-medium text-xs ${
                    isVoiceConnected 
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg ring-2 ring-red-300/50 animate-pulse' 
                    : 'bg-white/20 text-white hover:bg-white/30 hover:text-white'
                }`}
                title={isVoiceConnected ? "End Voice Chat" : "Start Voice Chat"}
            >
                {isVoiceConnected ? <MicOff size={14} /> : <Mic size={14} />}
                {isVoiceConnected ? <span className="hidden sm:inline">End</span> : (!isMinimized && <span className="hidden sm:inline">Voice</span>)}
            </button>

            {/* Minimize/Dock Switcher (If handler provided) */}
            {onToggleMinimize && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        // If minimizing, hide local history
                        if(!isMinimized) setIsHistoryVisible(false);
                        onToggleMinimize();
                    }}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-1"
                    title={isMinimized ? "Dock / Expand" : "Minimize to Floating"}
                >
                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
            )}
        </div>
      </div>

      {/* Ethics Banner (Only in expanded view) */}
      {showFullUI && (
        <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-start gap-2 animate-in slide-in-from-top-2 fade-in">
            <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-blue-700 leading-tight">
                Durmah helps you plan and revise. {contextType === 'assignment' ? 'Always submit your own original work.' : 'Do not use during live exams.'}
            </p>
        </div>
      )}

      {/* Content Area (Hidden if minimized, unless history manually toggled) */}
      {showFullUI && (
          <>
            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 ${isMinimized ? 'max-h-[400px]' : ''}`}>
                {/* Render Chat Messages */}
                {messages.map((m) => (
                <div key={m.id || m.created_at} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                    className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm shadow-sm leading-relaxed group relative ${
                        m.role === "user"
                        ? "bg-violet-600 text-white rounded-tr-sm"
                        : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm transition-colors hover:border-violet-200"
                    }`}
                    >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    
                    {/* Copy Button (only on hover) */}
                    {m.role === 'assistant' && (
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(m.content);
                                toast.success("Copied to clipboard");
                            }}
                            className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-violet-600 bg-white rounded-full shadow-sm border border-gray-100 transition-all"
                            title="Copy to Draft / Clipboard"
                        >
                            <FileText size={12} />
                        </button>
                    )}
                    </div>
                </div>
                ))}
                
                {/* Loading Indicator */}
                {isChatLoading && (
                <div className="flex justify-start">
                    <div className="px-4 py-3 bg-white rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                </div>
                )}
                
                {/* Voice Status Indicator Overlay */}
                {isVoiceConnected && (
                    <div className="sticky bottom-0 left-0 right-0 p-2 flex justify-center pointer-events-none">
                        <div className="bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                            {isVoiceListening ? (
                                <>
                                    <Mic size={12} className="text-red-400 animate-pulse" />
                                    <span>Listening...</span>
                                </>
                            ) : isVoiceSpeaking ? (
                                <>
                                    <Brain size={12} className="text-violet-300 animate-pulse" />
                                    <span>Speaking...</span>
                                </>
                            ) : (
                                <span className="opacity-80">Voice Active</span>
                            )}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-100 bg-white rounded-b-xl">
                <div className="flex gap-2">
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        // Auto-grow
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                    }}
                    onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                    }
                    }}
                    placeholder={isVoiceConnected ? "Voice active (speak now)..." : "Ask for help..."}
                    disabled={isVoiceConnected} 
                    className="flex-1 resize-none py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-50 transition-all min-h-[44px] max-h-[150px] overflow-y-auto disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isChatLoading || isVoiceConnected}
                    className="w-11 h-11 flex items-center justify-center bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end shadow-sm"
                >
                    <Send size={18} />
                </button>
                </div>
                {!isVoiceConnected && (
                    <div className="text-[10px] text-center text-gray-400 mt-2">
                    AI can make mistakes. Auto-saves to "{`Assignment: ${contextTitle.substring(0,15)}...`}"
                    </div>
                )}
            </div>
          </>
      )}
    </div>
  );
}
