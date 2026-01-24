import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  X, 
  Brain, 
  GraduationCap, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  BookOpen,
  Info,
  ChevronRight,
  Sparkles,
  Quote,
  Save,
  Trash2,
  Download,
  MoreVertical,
  Volume2,
  CheckSquare,
  Square,
  BookmarkX,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '@/lib/supabase/client';
import { QuizSourcesPanel } from './QuizSourcesPanel';
import { useDurmahRealtime } from '@/hooks/useDurmahRealtime'; // OpenAI ONLY - no Gemini
import SaveToFolderModal from '@/components/durmah/SaveToFolderModal';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts?: number;
  sources?: any[];
}

interface QuizSessionUIProps {
  sessionId: string;
  userId: string;
  mode: 'text' | 'voice';
}

export const QuizSessionUI: React.FC<QuizSessionUIProps> = ({ sessionId, userId, mode: initialMode }) => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [currentSources, setCurrentSources] = useState<any[]>([]);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Selection & Folder States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [quizFolderId, setQuizFolderId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabaseClient();

  // Audio element ref for OpenAI Realtime voice playback
  const audioRef = useRef<HTMLAudioElement>(null);

  // Session context state for grounding
  const [sessionContext, setSessionContext] = useState<{
    quizType: string;
    targetTitle: string;
    moduleCode: string;
    quizStyle: string;
    groundingData: string;
  } | null>(null);

  // Fetch session context and grounding data
  useEffect(() => {
    const fetchSessionContext = async () => {
      try {
        // 1. Fetch session data
        const { data: session } = await supabase
          .from('quiz_sessions')
          .select('quiz_type, target_id, module_code, performance_metadata')
          .eq('id', sessionId)
          .single();

        if (!session) return;

        const metadata = session.performance_metadata || {};
        let groundingData = '';
        let targetTitle = metadata.target_title || session.module_code || 'General Quiz';

        // 2. Fetch grounding content based on quiz type
        if (session.quiz_type === 'lecture' && session.target_id) {
          const { data: transcript } = await supabase
            .from('lecture_transcripts')
            .select('transcript_text')
            .eq('lecture_id', session.target_id)
            .single();
          if (transcript?.transcript_text) {
            groundingData = transcript.transcript_text.substring(0, 4000); // Limit for prompt
          }
        } else if (session.quiz_type === 'module' && session.module_code) {
          const { data: academic } = await supabase
            .from('durham_academic_content')
            .select('content')
            .eq('module_code', session.module_code)
            .limit(5);
          if (academic) {
            groundingData = academic.map(a => a.content).join('\n\n').substring(0, 4000);
          }
        }

        setSessionContext({
          quizType: session.quiz_type,
          targetTitle,
          moduleCode: session.module_code || '',
          quizStyle: metadata.quiz_style || 'quick',
          groundingData
        });
      } catch (err) {
        console.error('Failed to fetch session context:', err);
      }
    };

    fetchSessionContext();
  }, [sessionId]);

  // Ensure "Quiz Session" folder exists in student's library
  useEffect(() => {
    if (!userId) return;

    const ensureQuizFolder = async () => {
      try {
        const resp = await fetch('/api/transcripts/folders/tree');
        const json = await resp.json();
        
        if (json.ok) {
          const quizFolder = json.tree.find((f: any) => f.name === 'Quiz Session');
          if (quizFolder) {
             setQuizFolderId(quizFolder.id);
          } else {
             // Create if not found
             const createResp = await fetch('/api/transcripts/folders/create', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ name: 'Quiz Session', parentId: null })
             });
             const createJson = await createResp.json();
             if (createJson.ok) {
               setQuizFolderId(createJson.folder.id);
             }
          }
        }
      } catch (err) {
        console.error('Failed to ensure Quiz Session folder:', err);
      }
    };

    ensureQuizFolder();
  }, [userId]);

  // Quiz-specific guardrailed system prompt with dynamic context
  const quizSystemPrompt = useMemo(() => {
    const contextInfo = sessionContext 
      ? `
QUIZ CONTEXT:
- Topic: ${sessionContext.targetTitle}
- Module: ${sessionContext.moduleCode || 'Not specified'}
- Quiz Style: ${sessionContext.quizStyle} (quick = definitions, irac = structured reasoning, hypo = problem scenarios)
- Quiz Type: ${sessionContext.quizType}

${sessionContext.groundingData ? `GROUNDING DATA (USE THIS FOR QUESTIONS):
${sessionContext.groundingData}

IMPORTANT: Only quiz on content from the grounding data above. Do not hallucinate cases or statutes not present.` : 'No specific grounding data loaded. Use general English Law principles.'}
`
      : 'No session context loaded yet.';

    return `
You are Durmah in QUIZ ME mode for Durham University Law students.
You are conducting a spoken quiz session to test the student's legal reasoning and articulation skills.

${contextInfo}

MODE: Real-time voice conversation (speak concisely, listen actively)

CORE RULES:
1. Quiz ONLY on the topic/lecture specified above
2. Ask one question at a time, wait for the student's answer
3. After the student responds, give brief feedback and ask a follow-up
4. Keep responses short (1-2 sentences) for natural voice conversation
5. If the student goes off-topic, redirect: "Let's stay focused on ${sessionContext?.targetTitle || 'your selected topic'}..."
6. Use IRAC structure when evaluating answers

VOICE STYLE:
- Speak like a supportive but rigorous law tutor
- Be encouraging but also challenge weak reasoning
- Use clear, articulate language suitable for legal education

START: Greet the student and immediately start quizzing them on ${sessionContext?.targetTitle || 'the selected topic'}.
    `.trim();
  }, [sessionContext]);

  // Handle message selection logic
  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllMessages = () => {
    setSelectedIds(new Set(messages.map(m => m.id)));
  };

  const deselectAllMessages = () => {
    setSelectedIds(new Set());
  };

  const handleSaveToFolder = async (folderId: string) => {
    if (selectedIds.size === 0) return;
    setIsSaving(true);
    const toastId = toast.loading('Saving selected messages...');

    try {
      // Find and sort selected messages by timestamp
      const selectedMsgs = messages
        .filter(m => selectedIds.has(m.id))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      if (selectedMsgs.length === 0) throw new Error("No messages selected");

      // Prepare payload similar to DurmahWidget voice sessions
      const transcriptPayload = {
        topic: (sessionContext?.targetTitle || 'Quiz Insight').substring(0, 100),
        summary: `Saved insight from quiz session on ${sessionContext?.targetTitle || 'legal topic'}.`,
        transcript: selectedMsgs.map(m => ({
            role: m.role === 'user' ? 'you' : 'durmah',
            text: m.content,
            timestamp: new Date(m.created_at).getTime()
        })),
        content_text: selectedMsgs.map(m => `${m.role === 'user' ? 'you' : 'durmah'}: ${m.content}`).join('\n'),
        duration_seconds: 0,
        started_at: selectedMsgs[0]?.created_at || new Date().toISOString(),
        ended_at: selectedMsgs[selectedMsgs.length - 1]?.created_at || new Date().toISOString()
      };

      const resp = await fetch('/api/transcripts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptPayload,
          folderId
        })
      });

      const json = await resp.json();
      if (!json.ok) throw new Error(json.error || "Failed to archive");

      toast.success(`${selectedMsgs.length} items archived successfully`, { id: toastId });
      setIsFolderModalOpen(false);
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('Failed to save to folder:', err);
      toast.error('Failed to save: ' + err.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Debug: Log when session context is loaded
  useEffect(() => {
    if (sessionContext) {
      console.log('[QuizSession] Context loaded:', sessionContext.targetTitle, 'Grounding:', sessionContext.groundingData?.length || 0, 'chars');
    }
  }, [sessionContext]);

  // Callback for handling voice turns (both user and Durmah)
  const handleVoiceTurn = useCallback((turn: { speaker: 'user' | 'durmah'; text: string }) => {
    console.log(`[QuizSession] onTurn received: ${turn.speaker} said: "${turn.text.substring(0, 50)}..."`);
    
    // Append turns to the message transcript
    const newMsg: Message = {
      id: `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: turn.speaker === 'user' ? 'user' : 'assistant',
      content: turn.text
    };
    setMessages(prev => [...prev, newMsg]);
    
    // Also save to database for persistence
    supabase.from('quiz_messages').insert({
      session_id: sessionId,
      user_id: userId,
      role: turn.speaker === 'user' ? 'user' : 'assistant',
      content: turn.text
    }).then(({ error }) => {
      if (error) console.error('[QuizSession] Failed to save voice turn:', error);
    });
  }, [sessionId, userId, supabase]);

  // OpenAI Realtime Voice Hook (NOT Gemini)
  const {
    startListening,
    stopListening,
    isListening,
    status: voiceStatus,
    speaking,
    error: voiceError
  } = useDurmahRealtime({
    systemPrompt: quizSystemPrompt,
    voice: 'alloy', // OpenAI voice
    audioRef,
    onTurn: handleVoiceTurn
  });

  // Voice status helpers
  const isVoiceConnecting = voiceStatus === 'connecting';
  const isVoiceError = voiceStatus === 'error';
  const voiceStatusLabel = isVoiceConnecting 
    ? 'Connecting...' 
    : isVoiceError 
      ? 'Voice Error' 
      : speaking 
        ? 'Durmah Speaking...' 
        : isListening 
          ? 'Listening...' 
          : 'Voice Ready';

  // Toggle voice session
  const toggleVoiceSession = () => {
    if (isListening) {
      stopListening();
      toast.success('Voice session ended');
    } else {
      startListening();
      toast.success('Voice session started - speak to Durmah!');
    }
  };

  useEffect(() => {
    // Fetch conversation history if any
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('quiz_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (data && data.length > 0) {
        setMessages(data.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content
        })));
      } else {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Hi Student! I'm Durmah. I'm ready to quiz you on your selected material. What specific principle or scenario should we explore first?"
        }]);
      }
    };
    fetchHistory();
  }, [sessionId]);

  // Scroll to bottom when new messages arrive
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!chatContainerRef.current) return;
    
    const container = chatContainerRef.current;
    // Check if user is near bottom (within 200px to be more permissive)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    
    if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setIsLoading(true);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/.netlify/functions/quiz-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId, message: userText })
      });

      if (!res.ok) throw new Error('Failed to get response');
      
      const data = await res.json();
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      if (data.sources) {
        setCurrentSources(data.sources.map((s: string) => ({ title: s, type: 'Durham Source' })));
        setIsSourcesOpen(true);
      }
    } catch (err) {
      toast.error("Durmah is having trouble connecting. Try again?");
    } finally {
      setIsLoading(false);
    }
  };

   const formatContent = (content: string) => {
     // Identify sections for rubric styling
     const sections = content.split('\n\n');
     return sections.map((section, idx) => {
       if (section.startsWith('**What you did well**')) {
         return <div key={idx} className="bg-green-50/50 p-4 rounded-2xl border border-green-100 mb-4 text-sm"><Sparkles className="w-3 h-3 text-green-600 mb-2" />{section}</div>;
       }
       if (section.startsWith('**Speak Law" Rewrite**') || section.includes('Speak Law')) {
         return <div key={idx} className="bg-purple-900 text-white p-6 rounded-[2rem] my-6 shadow-xl relative overflow-hidden">
           <Quote className="absolute top-4 right-4 w-12 h-12 text-white/5 opacity-20" />
           <div className="text-[10px] uppercase font-black tracking-widest text-purple-200 mb-3">Speak Law Articulation</div>
           <p className="text-lg font-medium italic italic leading-relaxed">"{section.split(':').slice(1).join(':').trim()}"</p>
         </div>;
       }
       if (section.startsWith('**Model Structure (IRAC)**')) {
         return <div key={idx} className="border-l-4 border-purple-200 pl-6 my-4 italic text-gray-500 font-medium">{section}</div>;
       }
       return <p key={idx} className="mb-4 leading-relaxed">{section}</p>;
     });
  };

  // Session actions logic (using state declared at top)

  // Save transcript to voice archive
  const handleSaveTranscript = async () => {
    setIsSaving(true);
    try {
      const transcript = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
      
      await supabase.from('voice_transcripts').insert({
        user_id: userId,
        session_id: sessionId,
        transcript_text: transcript,
        source: 'quiz_session',
        created_at: new Date().toISOString()
      });
      
      toast.success('Saved to Durmah Transcript Archive');
    } catch (err) {
      toast.error('Failed to save transcript');
    } finally {
      setIsSaving(false);
      setShowActionsMenu(false);
    }
  };

  // Delete session and messages
  const handleDeleteSession = async () => {
    if (!confirm('Delete this quiz session and all messages? This cannot be undone.')) return;
    
    try {
      await supabase.from('quiz_messages').delete().eq('session_id', sessionId);
      await supabase.from('quiz_sessions').delete().eq('id', sessionId);
      toast.success('Session deleted');
      router.push('/quiz');
    } catch (err) {
      toast.error('Failed to delete session');
    }
  };

  // Download transcript as text file
  const handleDownloadTranscript = () => {
    const transcript = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-session-${sessionId.substring(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowActionsMenu(false);
    toast.success('Downloaded transcript');
  };

  return (
    <div className="flex-1 flex h-[calc(100vh-72px)] md:h-[calc(100vh-110px)] overflow-hidden bg-white">
      {/* Hidden audio element for OpenAI Realtime voice playback */}
      <audio ref={audioRef} autoPlay />
      
      <div className="flex-1 flex flex-col h-full border-r border-gray-50 relative">
        {/* Selection Bar for Parity with Main Widget */}
        {isSelectionMode && (
          <div className="absolute top-0 left-0 right-0 z-[100] bg-gray-900 text-white px-8 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
                className="hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                title="Cancel selection"
              >
                <X className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => {
                  if (selectedIds.size === messages.length && messages.length > 0) deselectAllMessages();
                  else selectAllMessages();
                }}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                {selectedIds.size === messages.length && messages.length > 0 ? (
                  <CheckSquare className="w-5 h-5 text-green-400" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-sm font-bold">{selectedIds.size} Selected</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsFolderModalOpen(true)}
                disabled={selectedIds.size === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                  selectedIds.size === 0 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white active:scale-95'
                }`}
              >
                <Save className="w-4 h-4" /> Save to Folder
              </button>
              
              <button 
                onClick={() => {
                   setSelectedIds(new Set());
                   setIsSelectionMode(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-sm font-bold border border-white/10 transition-all font-mono"
              >
                <Trash2 className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}
        <header className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/quiz')}
              className="p-3 hover:bg-gray-100 rounded-2xl transition text-gray-400 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-4">
               <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-100">
                  <Brain className="w-6 h-6 text-white" />
               </div>
               <div>
                  <h1 className="font-black text-gray-900 tracking-tight">Active Quiz <span className="text-gray-400 font-medium">Session</span></h1>
                  <div className="flex items-center gap-2 text-[10px] font-black text-purple-600 uppercase tracking-widest">
                     <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                     Grounded Retrieval
                  </div>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
              {/* OpenAI Realtime Voice Button */}
              <button 
                onClick={toggleVoiceSession}
                disabled={isVoiceConnecting}
                className={`p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                  isListening 
                    ? 'bg-red-50 border-red-300 text-red-600 animate-pulse shadow-lg' 
                    : speaking 
                      ? 'bg-green-50 border-green-300 text-green-600 shadow-lg'
                      : isVoiceConnecting
                        ? 'bg-yellow-50 border-yellow-300 text-yellow-600'
                        : 'bg-white border-gray-100 text-gray-400 hover:border-purple-200 hover:text-purple-600'
                }`}
              >
                {isListening ? (
                  <div className="relative">
                    <Mic className="w-5 h-5 text-red-500" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  </div>
                ) : speaking ? (
                  <Volume2 className="w-5 h-5 text-green-600 animate-pulse" />
                ) : isVoiceConnecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
                <span className="text-xs font-black uppercase tracking-widest hidden sm:block">
                  {voiceStatusLabel}
                </span>
              </button>
              <button 
                onClick={() => setIsSourcesOpen(!isSourcesOpen)}
                className={`p-3.5 rounded-2xl border-2 transition-all lg:hidden ${isSourcesOpen ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-100 text-gray-400'}`}
              >
                <BookOpen className="w-5 h-5" />
              </button>
              
              {/* Actions dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="p-3.5 rounded-2xl border-2 border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600 transition-all"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {showActionsMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={() => {
                        setIsSelectionMode(true);
                        setShowActionsMenu(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors text-left"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Select messages
                    </button>
                    <button 
                      onClick={handleSaveTranscript}
                      disabled={isSaving}
                      className="w-full px-4 py-3 flex items-center gap-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors text-left border-t border-gray-50"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save to Archive'}
                    </button>
                    <button 
                      onClick={handleDownloadTranscript}
                      className="w-full px-4 py-3 flex items-center gap-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors text-left border-t border-gray-50"
                    >
                      <Download className="w-4 h-4" />
                      Download Transcript
                    </button>
                    <button 
                      onClick={handleDeleteSession}
                      className="w-full px-4 py-3 flex items-center gap-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left border-t border-gray-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Session
                    </button>
                  </div>
                )}
              </div>
          </div>
        </header>

        <main 
          className="flex-1 overflow-y-auto p-8 space-y-12 bg-[#FDFCFE] glb-scroll" 
          ref={chatContainerRef}
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="max-w-3xl mx-auto w-full">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex gap-4 items-start mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 ${isSelectionMode ? 'cursor-pointer p-4 -m-4 rounded-3xl transition-colors hover:bg-gray-50' : ''}`}
                onClick={() => isSelectionMode && toggleSelection(m.id)}
              >
                {isSelectionMode && (
                   <div className="pt-8">
                      <div className={`p-1 rounded-lg transition-colors ${selectedIds.has(m.id) ? 'bg-purple-100' : 'hover:bg-gray-100'}`}>
                         {selectedIds.has(m.id) ? (
                           <CheckSquare className="w-6 h-6 text-purple-600" />
                         ) : (
                           <Square className="w-6 h-6 text-gray-300" />
                         )}
                      </div>
                   </div>
                )}
                
                <div className={`flex-1 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] md:max-w-[85%] ${m.role === 'user' ? 'bg-gray-900 text-white rounded-[2rem] rounded-tr-none px-8 py-6 shadow-2xl' : 'bg-white text-gray-900 rounded-[2.5rem] rounded-tl-none px-10 py-8 shadow-sm border border-gray-100'} ${isSelectionMode && selectedIds.has(m.id) ? 'ring-2 ring-purple-500 ring-offset-4' : ''}`}>
                    
                    {m.role === 'assistant' && (
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 rounded-xl">
                          <GraduationCap className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Tutorial Reasoning</span>
                      </div>
                    )}
                    
                    <div className={`text-base font-medium leading-relaxed ${m.role === 'user' ? 'text-gray-100' : 'text-gray-800'}`}>
                      {m.role === 'assistant' ? formatContent(m.content) : m.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-12 animate-pulse">
                <div className="bg-white rounded-[2.5rem] rounded-tl-none px-10 py-8 shadow-sm border border-gray-100 flex items-center gap-4">
                   <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                   <span className="text-sm text-gray-400 font-black uppercase tracking-widest">Durmah is reasoning...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-10" />
          </div>
        </main>

        <footer className="p-8 bg-white border-t border-gray-50">
          {/* Form and info as before */}
          <div className="max-w-3xl mx-auto">
             <form onSubmit={handleSendMessage} className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Speak to Durmah..." : "Type your legal analysis..."}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="w-full bg-gray-50/50 border-2 border-transparent rounded-[2rem] pl-8 pr-16 py-6 focus:bg-white focus:border-purple-600/20 focus:ring-4 focus:ring-purple-500/5 outline-none transition-all resize-none text-gray-900 text-lg font-medium shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-4 rounded-[1.25rem] transition-all shadow-xl ${input.trim() ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-100 text-gray-300'}`}
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                </button>
              </form>
              
              <div className="mt-6 flex items-center justify-between">
                 <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.5)]" />
                      Strict Grounding
                    </div>
                    {isListening && <div className="text-red-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />Voice Active</div>}
                    {speaking && <div className="text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Durmah Speaking</div>}
                 </div>
                 <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                    IRAC Rubric Active
                 </div>
              </div>
          </div>
        </footer>
      </div>

      <QuizSourcesPanel 
        sources={currentSources} 
        isOpen={isSourcesOpen} 
        onClose={() => setIsSourcesOpen(false)} 
      />

      <SaveToFolderModal 
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSave={handleSaveToFolder}
        isSaving={isSaving}
        title="Save Quiz Insights"
        initialFolderId={quizFolderId}
      />
    </div>
  );
};
