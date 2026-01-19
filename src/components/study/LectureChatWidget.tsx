
import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles, Trash2, CheckSquare, Square, X, Bookmark, Save, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/supabase/AuthContext';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  saved_at?: string | null;
  session_id?: string;
}

interface LectureChatWidgetProps {
  lectureId: string;
  title: string;
}

export default function LectureChatWidget({ lectureId, title }: LectureChatWidgetProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Selection & Session
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'session' | 'saved'>('session');
  
  // Session ID per mount
  const sessionIdRef = useRef<string>('');
  useEffect(() => {
      if (!sessionIdRef.current && typeof crypto !== 'undefined') {
          sessionIdRef.current = crypto.randomUUID();
      }
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history via API
  useEffect(() => {
    if (!lectureId || !user) return;

    const fetchHistory = async () => {
      // Use API to respect mode logic
      const params = new URLSearchParams({ lectureId });
      
      if (viewMode === 'saved') {
          params.set('mode', 'saved');
      } else {
          // View: This Session
          if (sessionIdRef.current) {
              params.set('sessionId', sessionIdRef.current);
          }
      }

      try {
          const res = await fetch(`/api/lectures/chat?${params}`);
          if (res.ok) {
              const data = await res.json();
              setMessages(data.messages || []);
          }
      } catch (err) {
          console.error('Failed to load chat history', err);
      }
    };
    fetchHistory();
  }, [lectureId, user, viewMode]);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current && !isSelectionMode && viewMode === 'session') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSelectionMode, viewMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Switch to session view if ensuring we see new message
    if (viewMode !== 'session') setViewMode('session');

    const userMsg: Message = {
      id: Date.now().toString(), // Optimistic ID
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
      saved_at: null,
      session_id: sessionIdRef.current
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/lectures/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
          lectureId,
          sessionId: sessionIdRef.current
        })
      });

      if (!response.ok) throw new Error(response.statusText);
      if (!response.body) throw new Error('No body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { 
          id: aiMsgId, 
          role: 'assistant', 
          content: '', 
          saved_at: null,
          session_id: sessionIdRef.current 
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiContent += chunk;
        
        setMessages(prev => prev.map(m => 
           m.id === aiMsgId ? { ...m, content: aiContent } : m
        ));
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: 'error', role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedIds(next);
  };

  const handleAction = async (action: 'save' | 'unsave' | 'delete_selected' | 'clear_unsaved') => {
      if ((action === 'delete_selected' || action === 'save' || action === 'unsave') && selectedIds.size === 0) return;
      
      let body: any = { action, lectureId };

      if (action === 'clear_unsaved') {
          const confirm = window.confirm('Clear all unsaved messages from this session?');
          if (!confirm) return;
          body.scope = 'session';
          body.sessionId = sessionIdRef.current;
      } else {
          body.messageIds = Array.from(selectedIds);
      }

      const toastId = toast.loading('Processing...');
      try {
          const res = await fetch('/api/lectures/chat-manage', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(body)
          });
          
          if (res.ok) {
              // Optimistic UI update
              if (action === 'save') {
                  setMessages(prev => prev.map(m => selectedIds.has(m.id) ? { ...m, saved_at: new Date().toISOString() } : m));
                  toast.success('Saved selected', { id: toastId });
              } else if (action === 'unsave') {
                  setMessages(prev => prev.map(m => selectedIds.has(m.id) ? { ...m, saved_at: null } : m));
                  toast.success('Unsaved selected', { id: toastId });
              } else if (action === 'delete_selected') {
                  setMessages(prev => prev.filter(m => !selectedIds.has(m.id)));
                  toast.success('Deleted', { id: toastId });
              } else if (action === 'clear_unsaved') {
                  setMessages(prev => prev.filter(m => m.saved_at));
                  toast.success('Cleared unsaved', { id: toastId });
              }
              
              setSelectedIds(new Set());
              setIsSelectionMode(false);
              
              // If we were in saved view and unsaved something, refresh?
              // The optimistic update handles it visually (saved_at becomes null), but if we are in 'Saved Only' view, they should disappear.
              if (viewMode === 'saved' && (action === 'unsave' || action === 'clear_unsaved')) {
                  setMessages(prev => prev.filter(m => m.saved_at));
              }

          } else {
              toast.error('Failed', { id: toastId });
          }
      } catch (e) {
          toast.error('Error', { id: toastId });
      }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-[600px] shadow-sm">
      {/* Header */}
      <div className="bg-purple-600 p-4 text-white flex flex-col gap-2 transition-colors duration-300" 
           style={isSelectionMode ? { backgroundColor: '#374151' } : {}}>
         
         <div className="flex items-center justify-between">
             {isSelectionMode ? (
                 <div className="flex items-center gap-3 w-full">
                     <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="hover:bg-white/10 p-1 rounded">
                        <X className="w-5 h-5 text-white" />
                     </button>
                     <span className="font-bold text-sm">{selectedIds.size} selected</span>
                     
                     <div className="flex gap-2 ml-auto">
                        {/* Save Selected */}
                        <button onClick={() => handleAction('save')} 
                                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                                title="Keep only the messages you'll want to revisit.">
                            <Save className="w-4 h-4" /> Save
                        </button>
                        
                        {/* Clear Unsaved (Contextual) */}
                        {/* Only show Clear Unsaved if logic permits or requested. Req: "Button 1: Save selected", "Button 2: Clear unsaved" */}
                        <button onClick={() => handleAction('clear_unsaved')} 
                                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                                title="Remove temporary messages from this session.">
                            <Trash2 className="w-4 h-4" /> Clear Unsaved
                        </button>
                     </div>
                 </div>
             ) : (
                 <>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Sparkles className="w-5 h-5 text-purple-100" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Ask Durmah</h3>
                            <p className="text-white/70 text-xs truncate max-w-[200px]">{title}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View Toggle */}
                        <div className="flex bg-black/20 rounded-lg p-0.5">
                            <button 
                                onClick={() => setViewMode('session')}
                                className={`px-2 py-1 text-xs rounded-md transition-all ${viewMode === 'session' ? 'bg-white text-purple-900 font-bold' : 'text-purple-100 hover:bg-white/10'}`}
                            >
                                This Session
                            </button>
                            <button 
                                onClick={() => setViewMode('saved')}
                                className={`px-2 py-1 text-xs rounded-md transition-all ${viewMode === 'saved' ? 'bg-white text-purple-900 font-bold' : 'text-purple-100 hover:bg-white/10'}`}
                            >
                                Saved
                            </button>
                        </div>

                        {messages.length > 0 && (
                            <button 
                                onClick={() => setIsSelectionMode(true)}
                                className="bg-white/10 hover:bg-white/20 p-1.5 rounded text-xs flex items-center gap-1 transition-colors"
                                title="Manage messages"
                            >
                                <CheckSquare className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                 </>
             )}
         </div>
         
         {/* Helper Text */}
         {isSelectionMode && (
             <p className="text-xs text-white/70 text-center">
                 Unsaved messages are temporary. Save only what you want to keep for revision.
             </p>
         )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
          {messages.length === 0 && (
             <div className="text-center text-gray-400 mt-10">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Ask about this lecture...</p>
             </div>
          )}
          
          {messages.map((msg, i) => (
             <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
                 
                 {/* Checkbox (Left) */}
                 {isSelectionMode && (
                     <button onClick={() => toggleSelection(msg.id)} className="mt-2 text-gray-400 hover:text-purple-600 transition-colors">
                         {selectedIds.has(msg.id) 
                            ? <CheckSquare className="w-5 h-5 text-purple-600" /> 
                            : <Square className="w-5 h-5" />}
                     </button>
                 )}

                 <div className={`relative max-w-[85%]`}>
                    <div 
                        className={`rounded-2xl p-3 text-sm ${
                        msg.role === 'user' 
                        ? 'bg-purple-600 text-white rounded-br-none' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                    }`}>
                        {msg.content}
                    </div>
                    
                    {/* Saved Indicator */}
                    {msg.saved_at && (
                        <div className={`absolute -bottom-5 ${msg.role === 'user' ? 'right-0' : 'left-0'} flex items-center gap-1 text-[10px] text-gray-400 font-medium`}>
                            <Bookmark className="w-3 h-3 fill-gray-400" /> Saved
                        </div>
                    )}
                 </div>
             </div>
          ))}
          {isLoading && (
              <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl p-3 rounded-bl-none shadow-sm flex items-center gap-2 text-gray-400 text-sm">
                     <Loader2 className="w-3 h-3 animate-spin" /> Durmah is thinking...
                  </div>
              </div>
          )}
      </div>

      {/* Input */}
      {!isSelectionMode && (
          <div className="bg-white border-t border-gray-100">
              <form onSubmit={handleSubmit} className="p-3 flex gap-2">
                 <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about this lecture..."
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                    disabled={isLoading}
                 />
                 <Button 
                    type="submit" 
                    disabled={isLoading || !input.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                 >
                    <Send className="w-4 h-4" />
                 </Button>
              </form>
              <div className="px-3 pb-2 text-center">
                  <p className="text-[10px] text-gray-400">
                      Durmah helps you understand and practise. It won’t write work to submit as your own.
                  </p>
              </div>
          </div>
      )}
    </div>
  );
}
