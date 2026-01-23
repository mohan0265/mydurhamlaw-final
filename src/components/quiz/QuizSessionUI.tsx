import React, { useState, useEffect, useRef } from 'react';
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
  Info
} from 'lucide-react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
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
  const [isVoiceActive, setIsVoiceActive] = useState(initialMode === 'voice');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabaseClient();

  useEffect(() => {
    // Initial welcome message if no history
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hi Student! I'm Durmah. I've prepared a quiz session grounded in your lecture context. What topic should we start with, or shall I jump into a scenario?"
      }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setIsLoading(true);

    // Optimistic update
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/.netlify/functions/quiz-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          message: userText
        })
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
    } catch (err) {
      toast.error("Durmah is having trouble connecting. Try again?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen max-h-screen overflow-hidden bg-white">
      {/* Premium Header */}
      <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-50 rounded-full transition text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-xl">
                <Brain className="w-5 h-5 text-white" />
             </div>
             <div>
                <h1 className="font-bold text-gray-900 leading-tight">Quiz Me <span className="text-gray-400 text-sm font-medium">by Durmah</span></h1>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                   <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                   Grounded Session
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`p-2.5 rounded-xl border transition flex items-center gap-2 ${isVoiceActive ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}
            >
              {isVoiceActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              <span className="text-xs font-bold hidden sm:block">{isVoiceActive ? 'Voice Active' : 'Switch to Voice'}</span>
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 transition"
            >
              <X className="w-5 h-5" />
            </button>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/30">
        <div className="max-w-3xl mx-auto w-full">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] lg:max-w-[75%] ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-[1.5rem] rounded-tr-none px-6 py-4 shadow-lg shadow-indigo-100' : 'bg-white text-gray-900 rounded-[1.5rem] rounded-tl-none px-8 py-6 shadow-sm border border-gray-100'}`}>
                
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-3 text-indigo-600">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Durmah\'s Reasoning</span>
                  </div>
                )}
                
                <div className={`whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                  {m.content}
                </div>

                {m.sources && m.sources.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2 mb-3 opacity-60">
                       <BookOpen className="w-3 h-3" />
                       <span className="text-[9px] font-bold uppercase tracking-widest">Grounding Sources</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {m.sources.map((s, i) => (
                        <div key={i} className="bg-gray-50 border border-gray-100 rounded-full px-3 py-1 text-[10px] text-gray-500 font-medium flex items-center gap-1.5">
                           <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                           {s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-8 animate-pulse">
              <div className="bg-white rounded-[1.5rem] rounded-tl-none px-8 py-6 shadow-sm border border-gray-100 flex items-center gap-3">
                 <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                 <span className="text-sm text-gray-400 font-medium">Durmah is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-6 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto relative">
          <form onSubmit={handleSendMessage} className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isVoiceActive ? "Speak or type your answer..." : "Type your legal argument or answer..."}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-[1.5rem] pl-6 pr-14 py-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none text-gray-800"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full transition-all ${input.trim() ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
          
          <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-gray-400 px-2">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                   <Info className="w-3 h-3" />
                   Grounded in Lecture Transcripts
                </div>
                {isVoiceActive && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Mic className="w-3 h-3" />
                    Mic Listening
                  </div>
                )}
             </div>
             <p>Press Enter to send • Shift+Enter for new line</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
