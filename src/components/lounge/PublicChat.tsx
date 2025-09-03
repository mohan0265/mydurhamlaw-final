import React, { useState, useEffect, useRef } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Smile, Paperclip, Reply } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'emoji' | 'system';
  reply_to_id?: string;
  reactions: Record<string, string[]>;
  created_at: string;
  profile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export const PublicChat: React.FC = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch messages and subscribe to new ones
  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const subscription = supabase
      .channel('lounge_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lounge_messages' },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data: messages } = await supabase
        .from('lounge_messages')
        .select(`
          *,
          profile:profiles(full_name, avatar_url)
        `)
        .order('created_at', { ascending: true })
        .limit(50);

      if (messages) {
        setMessages(messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const messageData = {
        user_id: user.id,
        content: newMessage.trim(),
        message_type: 'text' as const,
        reply_to_id: replyTo?.id || null
      };

      await supabase
        .from('lounge_messages')
        .insert([messageData]);

      setNewMessage('');
      setReplyTo(null);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const reactions = { ...message.reactions };
      const emojiReactions = reactions[emoji] || [];
      
      if (emojiReactions.includes(user.id)) {
        // Remove reaction
        reactions[emoji] = emojiReactions.filter(id => id !== user.id);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        // Add reaction
        reactions[emoji] = [...emojiReactions, user.id];
      }

      await supabase
        .from('lounge_messages')
        .update({ reactions })
        .eq('id', messageId);
        
      // Update local state
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, reactions } : m
      ));
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <AnimatePresence>
          {messages.map((message, index) => {
            const isOwn = message.user_id === user?.id;
            const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex items-start space-x-3 mb-4 ${
                  isOwn ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.profile?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {message.profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Message Content */}
                <div className={`flex-1 max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                  {showAvatar && (
                    <div className={`flex items-center space-x-2 mb-1 ${
                      isOwn ? 'justify-end' : ''
                    }`}>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {message.profile?.full_name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}

                  {/* Reply indicator */}
                  {message.reply_to_id && (
                    <div className={`text-xs text-gray-500 mb-1 ${
                      isOwn ? 'text-right' : ''
                    }`}>
                      <Reply className="inline w-3 h-3 mr-1" />
                      Replying to message
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`inline-block p-3 rounded-lg max-w-full break-words ${
                      isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {message.message_type === 'system' ? (
                      <div className="text-center italic text-gray-600 dark:text-gray-400">
                        {message.content}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>

                  {/* Reactions */}
                  {Object.keys(message.reactions).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${
                      isOwn ? 'justify-end' : ''
                    }`}>
                      {Object.entries(message.reactions).map(([emoji, userIds]) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className={`h-6 px-2 text-xs rounded-full ${
                            userIds.includes(user?.id || '')
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-800'
                          }`}
                          onClick={() => addReaction(message.id, emoji)}
                        >
                          {emoji} {userIds.length}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Quick reactions */}
                  {!isOwn && (
                    <div className="flex space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {['👍', '❤️', '😊', '🎉'].map(emoji => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                          onClick={() => addReaction(message.id, emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        onClick={() => setReplyTo(message)}
                      >
                        <Reply className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Reply className="w-4 h-4" />
              <span>Replying to {replyTo.profile?.full_name || 'Unknown User'}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(null)}
            >
              ×
            </Button>
          </div>
          <p className="text-sm text-gray-500 truncate mt-1">
            {replyTo.content}
          </p>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Smile className="w-4 h-4" />
          </Button>
          
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            disabled={!user}
          />
          
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim() || !user}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {!user && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Please sign in to participate in the chat
          </p>
        )}
      </div>
    </div>
  );
};

export default PublicChat;
