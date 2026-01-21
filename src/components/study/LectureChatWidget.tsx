import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Trash2, CheckSquare, Square, X, Bookmark, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDurmahChat } from '@/hooks/useDurmahChat';

interface LectureChatWidgetProps {
  lectureId: string;
  title: string;
}

export default function LectureChatWidget({ lectureId, title }: LectureChatWidgetProps) {
  // Use Unified Hook
  // Scope: 'lecture', default source: 'lecture', context with ID
  const { 
      messages, 
      sendMessage, 
      isLoading, 
      conversationId, 
      toggleSaveMetadata, 
      deleteMessages, 
      clearUnsaved 
  } = useDurmahChat({
      source: 'lecture',
      scope: 'lecture',
      context: { lectureId, title }
  });

  const [input, setInput] = useState('');
  
  // Selection & View Logic
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'session' | 'saved'>('session');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Auto-scroll on new messages (only in session view)
  useEffect(() => {
    if (scrollRef.current && !isSelectionMode && viewMode === 'session') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSelectionMode, viewMode]);

  // Derived state for view
  const visibleMessages = viewMode === 'saved' 
      ? messages.filter(m => m.visibility === 'saved') 
      : messages;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (viewMode !== 'session') setViewMode('session');
    
    // Fire and forget (hook handles state)
    const content = input;
    setInput(''); // Clear immediately
    await sendMessage(content);
  };

  const toggleSelection = (id: string) => {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedIds(next);
  };

  const handleBulkAction = async (action: 'save' | 'unsave' | 'delete') => {
      if (selectedIds.size === 0) return;
      const ids = Array.from(selectedIds);

      if (action === 'delete') {
          await deleteMessages(ids);
          setSelectedIds(new Set());
          setIsSelectionMode(false);
      } 
      else if (action === 'save' || action === 'unsave') {
          // Toggle each (inefficient if mixed, but usually user saves unsaved items)
          // Ideally hook should have bulkUpdate, but we can loop for now or add bulk later.
          // Since we rely on toggle in UI, let's just toggle.
          // Actually, 'save' implies set visibility='saved'.
          // 'unsave' implies set visibility='ephemeral'.
          // My hook only has toggle.
          // I should ideally add bulkSave to hook, but for now I will iterate toggle 
          // ONLY if needed. 
          // Current UI sends individual toggles.
          // Let's implement loop for now.
          for (const id of ids) {
             const m = messages.find(msg => msg.id === id);
             if (!m) continue;
             if (action === 'save' && m.visibility !== 'saved') {
                 await toggleSaveMetadata(id, m.visibility);
             } else if (action === 'unsave' && m.visibility === 'saved') {
                 await toggleSaveMetadata(id, m.visibility);
             }
          }
          setSelectedIds(new Set());
          setIsSelectionMode(false);
      }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm transition-all duration-300 ${visibleMessages.length > 0 ? 'h-[600px]' : 'h-auto'}`}>
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
                        <button onClick={() => handleBulkAction('save')} 
                                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded text-xs font-bold transition-colors">
                            <Save className="w-4 h-4" /> Save
                        </button>
                        <button onClick={() => {
                                if (confirm('Clear ALL unsaved messages?')) clearUnsaved();
                        }} 
                                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-xs font-bold transition-colors">
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
                        <div className="flex bg-black/20 rounded-lg p-0.5">
                            <button 
                                onClick={() => setViewMode('session')}
                                className={`px-2 py-1 text-xs rounded-md transition-all ${viewMode === 'session' ? 'bg-white text-purple-900 font-bold' : 'text-purple-100 hover:bg-white/10'}`}
                            >
                                Chat
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
                                onClick={() => {
                                    const savedIds = new Set(messages.filter(m => m.visibility === 'saved').map(m => m.id));
                                    setSelectedIds(savedIds);
                                    setIsSelectionMode(true);
                                }}
                                className="bg-white/10 hover:bg-white/20 p-1.5 rounded text-xs flex items-center gap-1 transition-colors"
                            >
                                <CheckSquare className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                 </>
             )}
         </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
          {visibleMessages.length === 0 && (
             <div className="text-center text-gray-400 mt-10">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{viewMode === 'session' ? 'Ask about this lecture...' : 'No saved messages yet.'}</p>
             </div>
          )}
          
          {visibleMessages.map((msg) => (
             <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
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
                    {msg.visibility === 'saved' && (
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
                     <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                  </div>
              </div>
          )}
      </div>

       {/* Input */}
       {!isSelectionMode && (
           <div className="bg-white border-t border-gray-100">
               <form 
                  onSubmit={(e) => { e.preventDefault(); if (!input.trim() || isLoading) return; sendMessage(input); setInput(''); }} 
                  className="p-3 flex gap-2 items-end"
               >
                  <textarea
                     ref={textareaRef}
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => {
                         if (e.key === 'Enter' && !e.shiftKey) {
                             e.preventDefault();
                             if (!input.trim() || isLoading) return;
                             sendMessage(input);
                             setInput('');
                         }
                     }}
                     placeholder="Ask about this lecture..."
                     rows={1}
                     className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500 resize-none min-h-[40px] max-h-[200px] overflow-y-auto"
                     disabled={isLoading}
                  />
                  <Button 
                     type="submit" 
                     disabled={isLoading || !input.trim()}
                     className="bg-purple-600 hover:bg-purple-700 text-white h-10 w-10 p-0 flex items-center justify-center shrink-0 mb-[1px]"
                  >
                     <Send className="w-4 h-4" />
                  </Button>
               </form>
           </div>
       )}
    </div>
  );
}
