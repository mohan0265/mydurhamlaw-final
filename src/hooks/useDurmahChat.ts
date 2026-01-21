import { useState, useCallback, useRef, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@/lib/supabase/AuthContext';
import toast from 'react-hot-toast';
import { v5 as uuidv5 } from 'uuid';

// Namespace for deterministic UUIDs (Durmah Context Namespace)
const DURMAH_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; 

export type ChatSource = 'widget' | 'lecture' | 'assignment' | 'wellbeing' | 'community';
export type ChatScope = 'global' | 'lecture' | 'assignment' | 'thread';

export interface UseDurmahChatOptions {
  source: ChatSource;
  scope: ChatScope;
  context?: Record<string, any>; // e.g. { lectureId: '...' }
  initialMessages?: any[];
}

export type DurmahMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  // Extras
  saved_at?: string | null;
  visibility?: 'ephemeral' | 'saved';
};

export function useDurmahChat({ source, scope, context = {}, initialMessages = [] }: UseDurmahChatOptions) {
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [messages, setMessages] = useState<DurmahMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Ref to track if we've already fetched for the current conversation
  const fetchedRef = useRef<string | null>(null);

  // Extract stable context values to avoid JSON.stringify in dependency array
  const lectureId = context.lectureId;
  const assignmentId = context.assignmentId;

  // 1. Determine Conversation ID
  useEffect(() => {
    if (!user) return;
    
    let cId: string;

    if (scope === 'global') {
      // Stable Global ID for user
      cId = uuidv5(`global-${user.id}`, DURMAH_NAMESPACE);
    } 
    else if (scope === 'lecture' && lectureId) {
       // Stable Lecture Thread ID
       cId = uuidv5(`lecture-${user.id}-${lectureId}`, DURMAH_NAMESPACE);
    }
    else if (scope === 'assignment' && assignmentId) {
        // Stable Assignment Thread ID
        cId = uuidv5(`assignment-${user.id}-${assignmentId}`, DURMAH_NAMESPACE);
    }
    else {
      // Fallback to global if specific ID not provided
      console.warn('[useDurmahChat] Scope requires ID but none provided. Falling back to global.');
      cId = uuidv5(`global-${user.id}`, DURMAH_NAMESPACE);
    }

    setConversationId(cId);

    // Fetch messages if we haven't for this conversation ID yet
    if (fetchedRef.current !== cId && initialMessages.length === 0) {
        fetchedRef.current = cId;
        fetchMessages(cId);
    }

  }, [user, scope, lectureId, assignmentId]);

  const fetchMessages = useCallback(async (cId: string) => {
      console.log('[useDurmahChat] Fetching messages for Conversation ID:', cId);
      if (!cId || !supabase) {
          console.warn('[useDurmahChat] Cannot fetch: missing cId or supabase client');
          return;
      }
      
      try {
          const { data, error } = await supabase
            .from('durmah_messages')
            .select('*')
            .eq('conversation_id', cId)
            .order('created_at', { ascending: true });
          
          if (error) {
               console.error('[useDurmahChat] Fetch error:', error);
               return;
          }
          
          if (data) {
              console.log(`[useDurmahChat] Fetched ${data.length} messages from database`);
              setMessages(data.map((m: any) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  created_at: m.created_at,
                  saved_at: m.saved_at,
                  visibility: m.visibility
              })));
          }
      } catch (err) {
          console.error('[useDurmahChat] Unexpected fetch error:', err);
      }
  }, [supabase]);

  // Manual refetch function for external use
  const refetchMessages = useCallback(() => {
      if (conversationId) {
          fetchMessages(conversationId);
      }
  }, [conversationId, fetchMessages]);

  const sendMessage = useCallback(async (content: string, modality: 'text'|'voice' = 'text') => {
    console.log('[useDurmahChat] sendMessage called', { content, conversationId, user: !!user });

    if (!content.trim()) return;
    
    if (!user) {
        toast.error('You must be logged in to chat');
        return;
    }

    if (!conversationId) {
        console.error('[useDurmahChat] No conversation ID available');
        toast.error('Connection not ready. Please try again in a moment.');
        return;
    }

    // Optimistic Update
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const userMsg: DurmahMessage = {
        id: tempId,
        role: 'user',
        content,
        created_at: now,
        visibility: 'ephemeral'
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/durmah/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId,
          source,
          scope,
          context,
          modality
        }),
      });

      if (!response.ok) {
          let errorMsg = 'Failed to send message';
          try {
              const errData = await response.json();
              errorMsg = errData.error || errData.message || errorMsg;
              console.error('[useDurmahChat] Server Error:', errData);
          } catch (e) {
              // Ignore json parse error
          }
          throw new Error(errorMsg);
      }
      
      const data = await response.json();
      
      // Update user message with real ID from server
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.userMsgId || m.id } : m));

      // Append assistant reply with server-assigned ID
      const assistantMsg: DurmahMessage = {
          id: data.assistantMsgId || crypto.randomUUID(),
          role: 'assistant',
          content: data.reply,
          created_at: new Date().toISOString(),
          visibility: 'ephemeral'
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (err: any) {
      console.error('[useDurmahChat] Send error:', err);
      toast.error(err.message || 'Failed to send message');
      // Remove the optimistic user message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, source, scope, context, user]);



  const toggleSaveMetadata = useCallback(async (msgId: string, currentVisibility: string | undefined, silent = false) => {
      if (!supabase) {
          console.error('[useDurmahChat] Cannot toggle save: supabase client not available');
          if (!silent) toast.error('Connection not ready');
          return;
      }

      const newVisibility = currentVisibility === 'saved' ? 'ephemeral' : 'saved';
      const newSavedAt = newVisibility === 'saved' ? new Date().toISOString() : null;

      // Optimistic update
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, visibility: newVisibility as any, saved_at: newSavedAt } : m));

      try {
          const { error } = await supabase
            .from('durmah_messages')
            .update({ visibility: newVisibility, saved_at: newSavedAt })
            .eq('id', msgId);
          
          if (error) {
              console.error('[useDurmahChat] Toggle save error:', error);
              // Revert optimistic update on error
              setMessages(prev => prev.map(m => m.id === msgId ? { ...m, visibility: currentVisibility as any, saved_at: currentVisibility === 'saved' ? m.saved_at : null } : m));
              if (!silent) toast.error('Failed to update message');
              return;
          }
          
          if (!silent) {
              toast.success(newVisibility === 'saved' ? 'Message saved' : 'Message unsaved');
          }
      } catch (err) {
          console.error('[useDurmahChat] Unexpected toggle error:', err);
          // Revert on unexpected error
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, visibility: currentVisibility as any } : m));
          if (!silent) toast.error('Failed to update message');
      }
  }, [supabase]);

  // Log a message directly (e.g. from Voice Transcript) without triggering LLM
  const logMessage = useCallback(async (role: 'user'|'assistant', content: string, modality: 'text'|'voice' = 'text') => {
      if (!conversationId || !user || !supabase) {
          console.warn('[useDurmahChat] Cannot log message: missing required context');
          return;
      }

      try {
          const { data, error } = await supabase
            .from('durmah_messages')
            .insert({
                user_id: user.id,
                conversation_id: conversationId,
                role,
                content,
                modality,
                source,
                scope,
                visibility: 'ephemeral'
            })
            .select('id, created_at')
            .single();
          
          if (error) {
              console.error('[useDurmahChat] Log message error:', error);
              return;
          }

          if (data) {
              const newMsg: DurmahMessage = {
                  id: data.id,
                  role,
                  content,
                  created_at: data.created_at,
                  visibility: 'ephemeral'
              };
              setMessages(prev => [...prev, newMsg]);
          }
      } catch (err) {
          console.error('[useDurmahChat] Unexpected log error:', err);
      }
  }, [supabase, conversationId, user, source, scope]);

  const deleteMessages = useCallback(async (ids: string[]) => {
      if (!ids.length || !supabase) {
          console.warn('[useDurmahChat] Cannot delete: no IDs or supabase client missing');
          return;
      }
      
      // Store messages for potential rollback
      const deletedMessages = messages.filter(m => ids.includes(m.id));
      
      // Optimistic delete
      setMessages(prev => prev.filter(m => !ids.includes(m.id)));

      try {
          const { error } = await supabase
            .from('durmah_messages')
            .delete()
            .in('id', ids);

          if (error) {
              console.error('[useDurmahChat] Delete error:', error);
              // Rollback: restore deleted messages
              setMessages(prev => [...prev, ...deletedMessages].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              ));
              toast.error('Failed to delete');
              return;
          }
          
          toast.success('Deleted');
      } catch (err) {
          console.error('[useDurmahChat] Unexpected delete error:', err);
          // Rollback
          setMessages(prev => [...prev, ...deletedMessages].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ));
          toast.error('Failed to delete');
      }
  }, [supabase, messages]);

  const clearUnsaved = useCallback(async () => {
      if (!conversationId || !supabase) {
          console.warn('[useDurmahChat] Cannot clear unsaved: missing context');
          return;
      }

      // Store unsaved messages for potential rollback
      const unsavedMessages = messages.filter(m => m.visibility !== 'saved');
      
      // Optimistic update
      setMessages(prev => prev.filter(m => m.visibility === 'saved'));

      try {
          const { error } = await supabase
            .from('durmah_messages')
            .delete()
            .eq('conversation_id', conversationId)
            .neq('visibility', 'saved'); // Only delete non-saved

          if (error) {
              console.error('[useDurmahChat] Clear unsaved error:', error);
              // Rollback
              setMessages(prev => [...prev, ...unsavedMessages].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              ));
              toast.error('Failed to clear unsaved');
              return;
          }
          
          toast.success('Cleared unsaved messages');
      } catch (err) {
          console.error('[useDurmahChat] Unexpected clear error:', err);
          // Rollback
          setMessages(prev => [...prev, ...unsavedMessages].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ));
          toast.error('Failed to clear unsaved');
      }
  }, [supabase, conversationId, messages]);

  return {
    messages,
    sendMessage,
    isLoading,
    conversationId,
    toggleSaveMetadata,
    deleteMessages,
    clearUnsaved,
    logMessage,
    refetchMessages // NEW: Expose manual refetch
  };
}
