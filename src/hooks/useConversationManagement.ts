
'use client';

import { useState, useCallback, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  context?: string; // Page context for context-aware responses
}

export function useConversationManagement(userId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations from Supabase
  const loadConversations = useCallback(async () => {
    if (!userId) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('voice_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedConversations: Conversation[] = (data || []).map((conv: any) => ({
        id: conv.id,
        title: conv.title,
        messages: JSON.parse(conv.messages || '[]'),
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
        userId: conv.user_id,
        context: conv.context
      }));

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Save conversation to Supabase
  const saveConversation = useCallback(async (conversation: Conversation) => {
    if (!userId) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('voice_conversations')
        .upsert({
          id: conversation.id,
          user_id: userId,
          title: conversation.title,
          messages: JSON.stringify(conversation.messages),
          context: conversation.context,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      setConversations(prev => {
        const index = prev.findIndex(c => c.id === conversation.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = conversation;
          return updated;
        } else {
          return [conversation, ...prev];
        }
      });

    } catch (error) {
      console.error('Error saving conversation:', error);
      toast.error('Failed to save conversation');
    }
  }, [userId]);

  // Create new conversation
  const createConversation = useCallback((context?: string): Conversation => {
    const newConversation: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userId || '',
      context
    };

    setCurrentConversation(newConversation);
    return newConversation;
  }, [userId]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('voice_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }

      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  }, [currentConversation]);

  // Add message to current conversation
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!currentConversation) return;

    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, newMessage],
      updatedAt: new Date(),
      title: currentConversation.messages.length === 0 ? 
        message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '') :
        currentConversation.title
    };

    setCurrentConversation(updatedConversation);
    saveConversation(updatedConversation);

    return newMessage;
  }, [currentConversation, saveConversation]);

  // Update streaming message
  const updateStreamingMessage = useCallback((messageId: string, content: string, isComplete = false) => {
    if (!currentConversation) return;

    const updatedConversation = {
      ...currentConversation,
      messages: currentConversation.messages.map(msg => 
        msg.id === messageId 
          ? { ...msg, content, isStreaming: !isComplete }
          : msg
      ),
      updatedAt: new Date()
    };

    setCurrentConversation(updatedConversation);

    if (isComplete) {
      saveConversation(updatedConversation);
    }
  }, [currentConversation, saveConversation]);

  // Clear all conversations
  const clearAllConversations = useCallback(async () => {
    if (!userId) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('voice_conversations')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setConversations([]);
      setCurrentConversation(null);
      toast.success('All conversations cleared');
    } catch (error) {
      console.error('Error clearing conversations:', error);
      toast.error('Failed to clear conversations');
    }
  }, [userId]);

  // Load conversations when userId changes
  useEffect(() => {
    if (userId) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversation(null);
    }
  }, [userId, loadConversations]);

  return {
    conversations,
    currentConversation,
    isLoading,
    createConversation,
    setCurrentConversation,
    addMessage,
    updateStreamingMessage,
    deleteConversation,
    clearAllConversations,
    saveConversation,
    loadConversations
  };
}
