import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Trash2, CheckSquare, Square, X, Bookmark, Save, BookmarkX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDurmahChat } from '@/hooks/useDurmahChat';
import toast from 'react-hot-toast';

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
      clearUnsaved,
      refetchMessages 
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

  // Derived state for view: Session view hides saved messages to keep it focused on current flow
  const isSaved = (m: any) => m.visibility === 'saved' || !!m.saved_at;
  const savedMessages = messages.filter(isSaved);
  const sessionMessages = messages.filter(m => !isSaved(m));

  const visibleMessages = viewMode === 'saved' ? savedMessages : sessionMessages;

  // Check if all visible messages are selected
  const allSelected = visibleMessages.length > 0 && 
      visibleMessages.every(m => selectedIds.has(m.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (viewMode !== 'session') setViewMode('session');
    
    // Fire and forget (hook handles state)
    const content = input;
    setInput(''); // Clear immediately
    
    // Auto-focus immediately
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });

    try {
      await sendMessage(content);
    } finally {
      // Auto-focus back to input
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  };

  const toggleSelection = (id: string) => {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedIds(next);
  };

  const selectAllVisible = () => {
      const allIds = visibleMessages.map(m => m.id);
      setSelectedIds(new Set(allIds));
  };

  const deselectAll = () => {
      setSelectedIds(new Set());
  };

  const handleBulkAction = async (action: 'save' | 'unsave' | 'delete' | 'clear_unsaved') => {
      if ((action === 'delete' || action === 'save' || action === 'unsave') && selectedIds.size === 0) return;

      const toastId = toast.loading('Processing...');
      
      try {
          const ids = Array.from(selectedIds);
          let failureCount = 0;

          if (action === 'save' || action === 'unsave') {
              for (const id of ids) {
                  const m = messages.find(msg => msg.id === id);
                  if (!m) continue;
                  
                  if (action === 'save' && !m.saved_at) {
                      const success = await toggleSaveMetadata(id, 'ephemeral', true);
                      if (!success) failureCount++;
                  } else if (action === 'unsave' && m.saved_at) {
                      const success = await toggleSaveMetadata(id, 'saved', true);
                      if (!success) failureCount++;
                  }
              }
              refetchMessages();
          } else if (action === 'delete') {
              await deleteMessages(ids);
          } else if (action === 'clear_unsaved') {
              await clearUnsaved();
          }

          if (failureCount > 0) {
              toast.error(`Some messages (${failureCount}) failed to save. Check RLS.`, { id: toastId });
          } else {
              toast.success('Done', { id: toastId });
          }
          setSelectedIds(new Set());
          setIsSelectionMode(false);
      } catch (err) {
          console.error('[LectureChatWidget] Bulk action error:', err);
          toast.error('Failed to process', { id: toastId });
      }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm transition-all duration-300 ${visibleMessages.length > 0 ? 'h-[600px]' : 'h-auto'}`}>
      {/* Header */}
      <div className="bg-purple-600 p-4 text-white flex flex-col gap-2 transition-colors duration-300" 
           style={isSelectionMode ? { backgroundColor: '#374151' } : {}}>
         
         <div className="flex items-center justify-between">
             {isSelectionMode ? (
                 <div className="flex items-center gap-2 w-full flex-wrap">
                     {/* Close Selection Mode */}
                     <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="hover:bg-white/10 p-1 rounded" title="Cancel">
                        <X className="w-5 h-5 text-white" />
                     </button>
                     
                     {/* Select All / Deselect All Toggle */}
                     <button 
                         onClick={() => allSelected ? deselectAll() : selectAllVisible()}
                         className="hover:bg-white/10 p-1 rounded" 
                         title={allSelected ? "Deselect all" : "Select all"}
                     >
                         {allSelected ? 
                             <CheckSquare className="w-5 h-5 text-green-400" /> : 
                             <Square className="w-5 h-5 text-white/60" />
                         }
                     </button>
                     
                     <span className="font-bold text-sm flex-1">{selectedIds.size} selected</span>
                     
                     <div className="flex gap-2">
                        {/* Save Selected */}
                        <button onClick={() => handleBulkAction('save')} 
                                disabled={selectedIds.size === 0}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-colors ${selectedIds.size === 0 ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
                                title="Save selected messages">
                            <Save className="w-3 h-3" /> Save
                        </button>
                        
                        {/* Unsave Selected */}
                        <button onClick={() => handleBulkAction('unsave')} 
                                disabled={selectedIds.size === 0}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-colors ${selectedIds.size === 0 ? 'bg-gray-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'}`}
                                title="Unsave selected messages">
                            <BookmarkX className="w-3 h-3" /> Unsave
                        </button>
                        
                        {/* Clear All Unsaved */}
                        <button onClick={() => {
                                if (confirm('Clear ALL unsaved messages from this chat? Saved messages will remain.')) {
                                    handleBulkAction('clear_unsaved');
                                }
                        }} 
                                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                                title="Delete all messages that haven't been saved">
                            <Trash2 className="w-3 h-3" /> Clear Unsaved
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
                        {/* Chat / Saved Toggle */}
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
                        
                        {/* Enter Selection Mode (select none initially) */}
                        {messages.length > 0 && (
                            <button 
                                onClick={() => {
                                    setSelectedIds(new Set()); // Start with none selected
                                    setIsSelectionMode(true);
                                }}
                                className="bg-white/10 hover:bg-white/20 p-1.5 rounded text-xs flex items-center gap-1 transition-colors"
                                title="Select messages to save or delete"
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
                    } ${isSelectionMode && selectedIds.has(msg.id) ? 'ring-2 ring-purple-400 ring-offset-2' : ''}`}>
                        {msg.content}
                    </div>
                    {(msg.visibility === 'saved' || msg.saved_at) && (
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
                   onSubmit={handleSubmit}
                   className="p-3 flex gap-2 items-end"
                >
                  <textarea
                     ref={textareaRef}
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => {
                         if (e.key === 'Enter' && !e.shiftKey) {
                             e.preventDefault();
                             handleSubmit(e);
                         }
                     }}
                     placeholder="Ask about this lecture..."
                     rows={1}
                     className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500 resize-none min-h-[40px] max-h-[200px] overflow-y-auto"
                     // Disabled removed to allow typing while streaming/loading
                  />
                  <Button 
                     type="submit" 
                     disabled={isLoading || !input.trim()}
                     onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
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
