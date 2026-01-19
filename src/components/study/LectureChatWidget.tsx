
import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history
  useEffect(() => {
    if (!lectureId || !user) return;

    const fetchHistory = async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('lecture_chat_messages')
        .select('*')
        .eq('lecture_id', lectureId)
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        setMessages(data as Message[]);
      }
    };
    fetchHistory();
  }, [lectureId, user]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/lectures/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })), // Send simplified context
          lectureId
        })
      });

      if (!response.ok) throw new Error(response.statusText);
      if (!response.body) throw new Error('No body');

      // Setup streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      
      // Temporary AI message
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiContent += chunk;
        
        setMessages(prev => prev.map(m => 
           m.id === aiMsgId ? { ...m, content: aiContent } : m
        ));
      }

      // Save AI response to DB (Client-side save for simplicity, or rely on server side)
      // Since server-side save of streaming response is hard in edge, we can do it here:
      const supabase = getSupabaseClient();
      await supabase.from('lecture_chat_messages').insert({
          user_id: user?.id,
          lecture_id: lectureId,
          role: 'assistant',
          content: aiContent
      });

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: 'error', role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-[600px] shadow-sm">
      {/* Header */}
      <div className="bg-purple-600 p-4 text-white flex items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-100" />
             </div>
             <div>
                <h3 className="font-bold text-sm">Ask Durmah</h3>
                <p className="text-white/70 text-xs">Context: {title}</p>
             </div>
         </div>
         <div className="text-xs bg-white/10 px-2 py-1 rounded">
            Beta
         </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
          {messages.length === 0 && (
             <div className="text-center text-gray-400 mt-10">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Ask a question about this lecture.</p>
                <p className="text-xs mt-1">"What was the main point about...?"</p>
             </div>
          )}
          
          {messages.map((msg, i) => (
             <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    msg.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-br-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                 }`}>
                    {msg.content}
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
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
         <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
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
    </div>
  );
}
