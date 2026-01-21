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

  // 1. Determine Conversation ID
  useEffect(() => {
    if (!user) return;
    
    let cId: string;

    if (scope === 'global') {
      // Stable Global ID for user
      cId = uuidv5(`global-${user.id}`, DURMAH_NAMESPACE);
    } 
    else if (scope === 'lecture' && context.lectureId) {
       // Stable Lecture Thread ID
       cId = uuidv5(`lecture-${user.id}-${context.lectureId}`, DURMAH_NAMESPACE);
    }
    else if (scope === 'assignment' && context.assignmentId) {
        // Stable Assignment Thread ID
        cId = uuidv5(`assignment-${user.id}-${context.assignmentId}`, DURMAH_NAMESPACE);
    }
    else {
      // Fallback: Random session if weird scope
      // Or maybe session-based?
      // Let's default to a random session ID if we can't be deterministic yet
      // BUT user wants deterministic.
      // If scope is missing ID, maybe just global?
      console.warn('[useDurmahChat] Scope requires ID but none provided. Falling back to random.');
      cId = crypto.randomUUID(); 
    }

    setConversationId(cId);

    // Initial Load?
    // We rely on initialMessages usually, but we could fetch here.
    // For now, assume parent passes initial or we fetch?
    // Let's implement fetch if empty.
    
    if (initialMessages.length === 0) {
        fetchMessages(cId);
    }

  }, [user, scope, JSON.stringify(context)]);

  const fetchMessages = async (cId: string) => {
      console.log('[useDurmahChat] Fetching messages for Conversation ID:', cId);
      if (!cId || !supabase) return; // Guard against null client
      const { data, error } = await supabase
        .from('durmah_messages')
        .select('*')
        .eq('conversation_id', cId)
        .order('created_at', { ascending: true });
      
      if (error) {
           console.error('[useDurmahChat] Fetch error:', error);
      }
      
      if (data) {
          console.log(`[useDurmahChat] Fetched ${data.length} messages`);
          setMessages(data.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              created_at: m.created_at,
              saved_at: m.saved_at,
              visibility: m.visibility
          })));
      }
  };

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
        // Try to recover ID?
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

      // We expect a stream or JSON. 
      // The updated API should probably return standard JSON for simplicity first, 
      // OR stream.
      // If stream, we need reader.
      // For now, let's assume JSON to start (easier reliable implementation), 
      // then upgrade to stream if "Streaming" was strict requirement.
      // The Legacy API used stream.
      // I will implement non-stream first for robustness, then stream if needed.
      // Actually, user likes "Voice" which implies streaming/realtime.
      // But for "Chat Widget", standard request is safer.
      // Let's handle JSON response for now.
      
      const data = await response.json();
      
      // Update with real ID if returned
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.userMsgId || m.id } : m));

      // Append assistant reply
      const assistantMsg: DurmahMessage = {
          id: data.assistantMsgId || crypto.randomUUID(),
          role: 'assistant',
          content: data.reply,
          created_at: new Date().toISOString(),
          visibility: 'ephemeral'
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to send message');
      // Revert optimistic? Or show error state
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, source, scope, context, user]);



  const toggleSaveMetadata = useCallback(async (msgId: string, currentVisibility: string | undefined, silent = false) => {
      const newVisibility = currentVisibility === 'saved' ? 'ephemeral' : 'saved';
      const newSavedAt = newVisibility === 'saved' ? new Date().toISOString() : null;

      // Optimistic
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, visibility: newVisibility as any, saved_at: newSavedAt } : m));

      await supabase
        .from('durmah_messages')
        .update({ visibility: newVisibility, saved_at: newSavedAt })
        .eq('id', msgId);
      
      if (!silent) {
          toast.success(newVisibility === 'saved' ? 'Message saved' : 'Message unsaved');
      }
  }, [supabase]);

  // Log a message directly (e.g. from Voice Transcript) without triggering LLM
  const logMessage = useCallback(async (role: 'user'|'assistant', content: string, modality: 'text'|'voice' = 'text') => {
      if (!conversationId || !user) return;

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
  }, [supabase, conversationId, user, source, scope]);

  const deleteMessages = useCallback(async (ids: string[]) => {
      if (!ids.length) return;
      
      // Optimistic delete
      setMessages(prev => prev.filter(m => !ids.includes(m.id)));

      const { error } = await supabase
        .from('durmah_messages')
        .delete()
        .in('id', ids);

      if (error) {
          console.error('Failed to delete', error);
          toast.error('Failed to delete');
          // Revert? Hard to revert delete without fetching. 
          // Assume success usually.
      } else {
          toast.success('Deleted');
      }
  }, [supabase]);

  const clearUnsaved = useCallback(async () => {
      if (!conversationId) return;

      // Optimistic
      setMessages(prev => prev.filter(m => m.visibility === 'saved'));

      const { error } = await supabase
        .from('durmah_messages')
        .delete()
        .eq('conversation_id', conversationId)
        .neq('visibility', 'saved'); // Only delete non-saved

      if (error) {
          toast.error('Failed to clear unsaved');
      } else {
          toast.success('Cleared unsaved messages');
      }
  }, [supabase, conversationId]);

  return {
    messages,
    sendMessage,
    isLoading,
    conversationId,
    toggleSaveMetadata,
    deleteMessages,
    clearUnsaved,
    logMessage
  };
}
