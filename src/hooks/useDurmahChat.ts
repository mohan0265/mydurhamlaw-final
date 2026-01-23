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
  // NEW: Session management options
  sessionId?: string | null;  // Explicit session ID (overrides auto-generation)
  skipAutoFetch?: boolean;  // Don't auto-fetch messages on mount
  onSessionCreate?: (sessionId: string) => void;  // Callback when session created
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

export function useDurmahChat({ 
  source, 
  scope, 
  context = {}, 
  initialMessages = [],
  sessionId = null,
  skipAutoFetch = false,
  onSessionCreate
}: UseDurmahChatOptions) {
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [messages, setMessages] = useState<DurmahMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(sessionId);
  
  // Ref to track if we've already fetched for the current conversation
  const fetchedRef = useRef<string | null>(null);
  
  // Refs for deduplication
  const lastSendRef = useRef<{ text: string; ts: number } | null>(null);
  const lastLoggedRef = useRef<{ role: string; content: string; ts: number } | null>(null);

  // Extract stable context values to avoid JSON.stringify in dependency array
  const lectureId = context.lectureId;
  const assignmentId = context.assignmentId;

  // 1. Determine Conversation ID
  useEffect(() => {
    if (!user) return;
    
    // If explicit sessionId provided, use it
    if (sessionId) {
      setConversationId(sessionId);
      if (!skipAutoFetch && fetchedRef.current !== sessionId) {
        fetchedRef.current = sessionId;
        fetchMessages(sessionId);
      }
      return;
    }
    
    // Otherwise, generate stable ID (legacy behavior)
    let cId: string;

    if (scope === 'global') {
      cId = uuidv5(`global-${user.id}`, DURMAH_NAMESPACE);
    } 
    else if (scope === 'lecture' && lectureId) {
       cId = uuidv5(`lecture-${user.id}-${lectureId}`, DURMAH_NAMESPACE);
    }
    else if (scope === 'assignment' && assignmentId) {
        cId = uuidv5(`assignment-${user.id}-${assignmentId}`, DURMAH_NAMESPACE);
    }
    else {
      console.warn('[useDurmahChat] Scope requires ID but none provided. Falling back to global.');
      cId = uuidv5(`global-${user.id}`, DURMAH_NAMESPACE);
    }

    setConversationId(cId);

    // Fetch messages if auto-fetch enabled
    if (!skipAutoFetch && fetchedRef.current !== cId && initialMessages.length === 0) {
        fetchedRef.current = cId;
        fetchMessages(cId);
    }

  }, [user, scope, lectureId, assignmentId, sessionId, skipAutoFetch]);

  const fetchMessages = useCallback(async (cId: string) => {
      console.log('[useDurmahChat] Fetching messages for Conversation ID:', cId);
      if (!cId || !supabase) {
          console.warn('[useDurmahChat] Cannot fetch: missing cId or supabase client');
          return;
      }
      
      try {
          // SELECT table based on scope
          if (scope === 'assignment') {
             const { data, error } = await supabase
               .from('assignment_session_messages')
               .select('*')
               .eq('session_id', cId)
               .order('created_at', { ascending: true });

             if (error) {
                 console.error('[useDurmahChat] Fetch assignment messages error:', error);
                 return;
             }
             if (data) {
                  console.log(`[useDurmahChat] Fetched ${data.length} messages from assignment_session_messages`);
                  
                  // Dedupe consecutive identical messages (UI-level safety net)
                  const deduped: any[] = [];
                  data.forEach((m: any) => {
                      const last = deduped[deduped.length - 1];
                      if (!last || last.role !== m.role || last.content !== m.content) {
                          deduped.push(m);
                      }
                  });

                  setMessages(deduped.map((m: any) => ({
                      id: m.id,
                      role: m.role,
                      content: m.content || '(no content)',
                      created_at: m.created_at,
                      // assignment_session_messages might not have same visibility columns yet, adapting:
                      visibility: 'saved' // Assignments are always saved
                  })));
             }
          } else {
              // Legacy/Global behavior
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
          }
      } catch (err) {
          console.error('[useDurmahChat] Unexpected fetch error:', err);
      }
  }, [supabase, scope]);

  // Manual refetch function for external use
  const refetchMessages = useCallback(() => {
      if (conversationId) {
          fetchMessages(conversationId);
      }
  }, [conversationId, fetchMessages]);
  const sendMessage = useCallback(async (content: string, modality: 'text'|'voice' = 'text') => {

    const normalize = (s: string) => s.trim().replace(/\s+/g, " ");
    const normalized = normalize(content);

    if (!normalized) return;
    
    // Client-side dedupe guard (1500ms)
    const nowTs = Date.now();
    if (lastSendRef.current && lastSendRef.current.text === normalized && (nowTs - lastSendRef.current.ts < 1500)) {
        console.warn('[useDurmahChat] sendMessage: Blocking rapid duplicate send');
        return;
    }
    lastSendRef.current = { text: normalized, ts: nowTs };
    
    if (!user) {
        toast.error('You must be logged in to chat');
        return;
    }

    let targetId = conversationId;

    // Fallback: Check if we can generate it immediately (race condition fix)
    if (!targetId && user) {
        if (scope === 'assignment' && assignmentId) {
            targetId = uuidv5(`assignment-${user.id}-${assignmentId}`, DURMAH_NAMESPACE);
            setConversationId(targetId); // update state for next time
        } else if (scope === 'global') {
             targetId = uuidv5(`global-${user.id}`, DURMAH_NAMESPACE);
             setConversationId(targetId);
        }
    }

    if (!targetId) {
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
          conversationId: targetId,
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
  }, [conversationId, source, scope, context, user, assignmentId]);



  const toggleSaveMetadata = useCallback(async (msgId: string, currentVisibility: string | undefined, silent = false): Promise<boolean> => {
      if (!supabase) {
          console.error('[useDurmahChat] Cannot toggle save: supabase client not available');
          if (!silent) toast.error('Connection not ready');
          return false;
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
              return false;
          }
          
          if (!silent) {
              toast.success(newVisibility === 'saved' ? 'Message saved' : 'Message unsaved');
          }
          return true;
      } catch (err) {
          console.error('[useDurmahChat] Unexpected toggle error:', err);
          // Revert on unexpected error
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, visibility: currentVisibility as any } : m));
          if (!silent) toast.error('Failed to update message');
          return false;
      }
  }, [supabase]);

  // Log a message directly (e.g. from Voice Transcript) without triggering LLM
  const logMessage = useCallback(async (role: 'user'|'assistant', content: string, modality: 'text'|'voice' = 'text') => {
      if (!conversationId || !user || !supabase) {
          console.warn('[useDurmahChat] Cannot log message: missing required context');
          return;
      }

      try {
          let data, error;

          if (scope === 'assignment' && context.assignmentId) {
             // 1. Ensure Session Exists
             await supabase.from('assignment_sessions').upsert({
                 id: conversationId,
                 assignment_id: context.assignmentId,
                 user_id: user.id,
                 title: `Session ${new Date().toLocaleDateString()}`
             }, { onConflict: 'id' });

             // 1.5. Deduplicate (Refined)
             const normalize = (s: string) => s.trim().replace(/\s+/g, " ");
             const normalized = normalize(content);
             const nowTs = Date.now();
             
             const isMatch = lastLoggedRef.current && 
                             lastLoggedRef.current.role === role && 
                             lastLoggedRef.current.content === normalized && 
                             (nowTs - lastLoggedRef.current.ts < 2000);
             
             // Additional check for role-specific user ID if applicable
             // (role='assistant' ignores user_id, role='user' would match it implicitly via the ref)
             if (isMatch) {
                 console.warn('[useDurmahChat] Dropping duplicate message:', normalized.substring(0, 20));
                 return;
             }
             lastLoggedRef.current = { role, content: normalized, ts: nowTs };

             // 2. Insert Message
             const res = await supabase.from('assignment_session_messages').insert({
                 session_id: conversationId,
                 user_id: user.id,
                 role,
                 content,
                 // modality not in schema yet, adding to content metadata if needed or ignore
             }).select('id, created_at').single();
             
             data = res.data; 
             error = res.error;
          } else {
             // Legacy
             const res = await supabase
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
            data = res.data;
            error = res.error;
          }
          
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
                  visibility: scope === 'assignment' ? 'saved' : 'ephemeral'
              };
              setMessages(prev => [...prev, newMsg]);
          }
      } catch (err) {
          console.error('[useDurmahChat] Unexpected log error:', err);
      }
  }, [supabase, conversationId, user, source, scope, context]);

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
          const tableName = scope === 'assignment' ? 'assignment_session_messages' : 'durmah_messages';
          const { error } = await supabase
            .from(tableName)
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
  }, [supabase, messages, scope]);

  const clearUnsaved = useCallback(async () => {
      if (!conversationId || !supabase) {
          console.warn('[useDurmahChat] Cannot clear unsaved: missing context');
          return;
      }

      // 1. Identify Unsaved: Neither visibility 'saved' OR nor saved_at timestamp
      const unsavedMessages = messages.filter(m => !(m.visibility === 'saved' || !!m.saved_at));
      
      if (unsavedMessages.length === 0) {
          return;
      }

      // Optimistic update: ONLY remove those that are truly unsaved
      setMessages(prev => prev.filter(m => (m.visibility === 'saved' || !!m.saved_at)));
      
      // Assignment scope doesn't use ephemeral messages in the same way, return early
      if (scope === 'assignment') return;

      try {
          // 2. Precise DB deletion for unsaved messages in this conversation
          const { error } = await supabase
            .from('durmah_messages')
            .delete()
            .eq('conversation_id', conversationId)
            .is('saved_at', null)
            .or('visibility.is.null,visibility.neq.saved');

          if (error) {
              console.error('[useDurmahChat] Clear unsaved error:', error);
              // Rollback
              setMessages(prev => [...prev, ...unsavedMessages].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              ));
              toast.error('Failed to clear unsaved');
              return;
          }
          
          toast.success(`Cleared ${unsavedMessages.length} unsaved messages`);
      } catch (err) {
          console.error('[useDurmahChat] Unexpected clear error:', err);
          // Rollback
          setMessages(prev => [...prev, ...unsavedMessages].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ));
          toast.error('Failed to clear unsaved');
      }
  }, [supabase, conversationId, messages]);

  // ----------------------------
  // SESSION MANAGEMENT FUNCTIONS
  // ----------------------------

  /**
   * Create a new session record in the database
   * Call this when starting a new session (widget open, mic start)
   */
  const createSession = useCallback(async (sessionId: string, title?: string) => {
    if (!user || !supabase) {
      console.warn('[useDurmahChat] Cannot create session: missing user or supabase');
      return false;
    }

    try {
      const { error } = await supabase
        .from('durmah_sessions')
        .insert({
          id: sessionId,
          user_id: user.id,
          source,
          scope,
          scope_id: context.lectureId || context.assignmentId || null,
          title: title || `Session ${new Date().toLocaleString()}`,
          created_at: new Date().toISOString(),
          saved: false,
          message_count: 0
        });

      if (error) {
        console.error('[useDurmahChat] Create session error:', error);
        return false;
      }

      console.log('[useDurmahChat] Session created:', sessionId);
      if (onSessionCreate) {
        onSessionCreate(sessionId);
      }
      return true;
    } catch (err) {
      console.error('[useDurmahChat] Unexpected create session error:', err);
      return false;
    }
  }, [user, supabase, source, scope, context, onSessionCreate]);

  /**
   * Save entire session: mark all messages as saved + update session record
   * Returns true on success
   */
  const saveSession = useCallback(async (sessionId?: string, customTitle?: string) => {
    const targetSessionId = sessionId || conversationId;
    if (!targetSessionId || !user || !supabase) {
      console.warn('[useDurmahChat] Cannot save session: missing required data');
      return false;
    }

    try {
      // 1. Mark all messages in session as saved
      const { error: messagesError } = await supabase
        .from('durmah_messages')
        .update({
          visibility: 'saved',
          saved_at: new Date().toISOString()
        })
        .eq('conversation_id', targetSessionId);

      if (messagesError) {
        console.error('[useDurmahChat] Save messages error:', messagesError);
        toast.error('Failed to save messages');
        return false;
      }

      // 2. Generate session title if not provided
      const sessionTitle = customTitle || generateSessionTitle();

      // 3. Update session record
      const { error: sessionError } = await supabase
        .from('durmah_sessions')
        .update({
          saved: true,
          closed_at: new Date().toISOString(),
          title: sessionTitle,
          message_count: messages.length
        })
        .eq('id', targetSessionId);

      if (sessionError) {
        console.error('[useDurmahChat] Save session error:', sessionError);
        toast.error('Failed to update session');
        return false;
      }

      // 4. Update local state
      setMessages(prev => prev.map(m => ({
        ...m,
        visibility: 'saved' as any,
        saved_at: new Date().toISOString()
      })));

      toast.success('Session saved to library');
      return true;
    } catch (err) {
      console.error('[useDurmahChat] Unexpected save session error:', err);
      toast.error('Failed to save session');
      return false;
    }
  }, [conversationId, user, supabase, messages]);

  /**
   * Discard entire session: delete all messages + session record
   * Returns true on success
   */
  const discardSession = useCallback(async (sessionId?: string) => {
    const targetSessionId = sessionId || conversationId;
    if (!targetSessionId || !supabase) {
      console.warn('[useDurmahChat] Cannot discard session: missing required data');
      return false;
    }

    try {
      if (scope === 'assignment') {
        // 1. Delete all messages from assignment_session_messages
        const { error: messagesError } = await supabase
          .from('assignment_session_messages')
          .delete()
          .eq('session_id', targetSessionId);

        if (messagesError) {
          console.error('[useDurmahChat] Delete assignment messages error:', messagesError);
          toast.error('Failed to delete messages');
          return false;
        }

        // 2. Delete from assignment_sessions
        const { error: sessionError } = await supabase
          .from('assignment_sessions')
          .delete()
          .eq('id', targetSessionId);

        if (sessionError) {
          console.error('[useDurmahChat] Delete assignment session error:', sessionError);
        }
      } else {
        // Legacy/Global behavior
        // 1. Delete all messages from durmah_messages
        const { error: messagesError } = await supabase
          .from('durmah_messages')
          .delete()
          .eq('conversation_id', targetSessionId);

        if (messagesError) {
          console.error('[useDurmahChat] Delete messages error:', messagesError);
          toast.error('Failed to delete messages');
          return false;
        }

        // 2. Delete session record from durmah_sessions
        const { error: sessionError } = await supabase
          .from('durmah_sessions')
          .delete()
          .eq('id', targetSessionId);

        if (sessionError) {
          console.error('[useDurmahChat] Delete session error:', sessionError);
        }
      }

      // 3. Clear local state
      setMessages([]);
      
      toast.success('Session discarded');
      return true;
    } catch (err) {
      console.error('[useDurmahChat] Unexpected discard session error:', err);
      toast.error('Failed to discard session');
      return false;
    }
  }, [conversationId, supabase, scope]);

  /**
   * Helper: Generate session title from messages
   */
  const generateSessionTitle = useCallback(() => {
    if (messages.length === 0) {
      return `Empty Session - ${new Date().toLocaleString()}`;
    }

    // Get first user message for context
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      const preview = firstUserMsg.content.substring(0, 40);
      return `${preview}${firstUserMsg.content.length > 40 ? '...' : ''}`;
    }

    // Fallback: use source/scope info
    const sourceLabel = scope === 'lecture' ? 'Lecture Chat' : 
                       scope === 'assignment' ? 'Assignment Chat' : 
                       'Durmah Session';
    return `${sourceLabel} - ${new Date().toLocaleString()}`;
  }, [messages, scope]);

  return {
    messages,
    sendMessage,
    isLoading,
    conversationId,
    toggleSaveMetadata,
    deleteMessages,
    clearUnsaved,
    logMessage,
    refetchMessages,
    // NEW: Session management
    createSession,
    saveSession,
    discardSession
  };
}
