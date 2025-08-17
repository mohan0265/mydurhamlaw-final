/**
 * Supabase Storage for Durmah Voice Sessions
 * Manages voice chat sessions and message history
 */

import { supabase } from '../supabase/client';
import { ChatMessage } from './llmRouter';

export interface VoiceSession {
  id: string;
  user_id: string;
  created_at: string;
  mode: 'push' | 'continuous';
  title?: string;
}

export interface VoiceMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  audio_url?: string;
  transcription_confidence?: number;
}

export interface CreateSessionOptions {
  mode?: 'push' | 'continuous';
  title?: string;
}

class VoiceSupabaseStore {
  /**
   * Create a new voice session
   */
  public async createSession(
    userId: string,
    options: CreateSessionOptions = {}
  ): Promise<VoiceSession | null> {
    if (!supabase) {
      console.warn('DURMAH_STORE_CREATE_SESSION_WARN: Supabase client not available')
      return null
    }

    try {
      console.log('DURMAH_STORE_CREATE_SESSION:', userId);
      
      const { data, error } = await supabase
        .from('durmah_sessions')
        .insert({
          user_id: userId,
          mode: options.mode || 'push',
          title: options.title
        })
        .select()
        .single();

      if (error) {
        if (error.message?.includes('relation') || error.message?.includes('table')) {
          console.warn('DURMAH_STORE_CREATE_SESSION_WARN: Tables not found, continuing without DB');
          return null;
        }
        console.error('DURMAH_STORE_CREATE_SESSION_ERR:', error);
        return null;
      }

      console.log('DURMAH_STORE_CREATE_SESSION_OK:', data.id);
      return data;
    } catch (error) {
      console.warn('DURMAH_STORE_CREATE_SESSION_WARN:', error);
      return null;
    }
  }

  /**
   * Append a message to a session
   */
  public async appendMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata: {
      audioUrl?: string;
      transcriptionConfidence?: number;
    } = {}
  ): Promise<VoiceMessage | null> {
    if (!supabase) {
      console.warn('DURMAH_STORE_APPEND_MSG_WARN: Supabase client not available')
      return null
    }

    try {
      console.log('DURMAH_STORE_APPEND_MSG:', sessionId, role);
      
      const { data, error } = await supabase
        .from('durmah_messages')
        .insert({
          session_id: sessionId,
          role,
          content,
          audio_url: metadata.audioUrl,
          transcription_confidence: metadata.transcriptionConfidence
        })
        .select()
        .single();

      if (error) {
        if (error.message?.includes('relation') || error.message?.includes('table')) {
          console.warn('DURMAH_STORE_APPEND_MSG_WARN: Tables not found, continuing without DB');
          return null;
        }
        console.error('DURMAH_STORE_APPEND_MSG_ERR:', error);
        return null;
      }

      console.log('DURMAH_STORE_APPEND_MSG_OK:', data.id);
      return data;
    } catch (error) {
      console.warn('DURMAH_STORE_APPEND_MSG_WARN:', error);
      return null;
    }
  }

  /**
   * Get recent messages from a session
   */
  public async getRecent(
    sessionId: string,
    limit: number = 10
  ): Promise<VoiceMessage[]> {
    if (!supabase) {
      console.warn('DURMAH_STORE_GET_RECENT_WARN: Supabase client not available')
      return []
    }

    try {
      console.log('DURMAH_STORE_GET_RECENT:', sessionId, limit);
      
      const { data, error } = await supabase
        .from('durmah_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('DURMAH_STORE_GET_RECENT_ERR:', error);
        return [];
      }

      // Return in chronological order (oldest first)
      return (data || []).reverse();
    } catch (error) {
      console.error('DURMAH_STORE_GET_RECENT_ERR:', error);
      return [];
    }
  }

  /**
   * Get all sessions for a user
   */
  public async getUserSessions(userId: string): Promise<VoiceSession[]> {
    if (!supabase) {
      console.warn('DURMAH_STORE_GET_SESSIONS_WARN: Supabase client not available')
      return []
    }

    try {
      console.log('DURMAH_STORE_GET_SESSIONS:', userId);
      
      const { data, error } = await supabase
        .from('durmah_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('DURMAH_STORE_GET_SESSIONS_ERR:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('DURMAH_STORE_GET_SESSIONS_ERR:', error);
      return [];
    }
  }

  /**
   * List sessions with message counts (for future use)
   */
  public async listSessions(userId: string, limit: number = 20): Promise<(VoiceSession & { messageCount: number })[]> {
    if (!supabase) {
      console.warn('DURMAH_STORE_LIST_SESSIONS_WARN: Supabase client not available')
      return []
    }

    try {
      console.log('DURMAH_STORE_LIST_SESSIONS:', userId, limit);
      
      const { data, error } = await supabase
        .from('durmah_sessions')
        .select(`
          *,
          durmah_messages(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('DURMAH_STORE_LIST_SESSIONS_ERR:', error);
        return [];
      }

      return (data || []).map(session => ({
        ...session,
        messageCount: session.durmah_messages?.[0]?.count || 0
      }));
    } catch (error) {
      console.error('DURMAH_STORE_LIST_SESSIONS_ERR:', error);
      return [];
    }
  }

  /**
   * Update session title
   */
  public async updateSessionTitle(
    sessionId: string,
    title: string
  ): Promise<boolean> {
    if (!supabase) {
      console.warn('DURMAH_STORE_UPDATE_TITLE_WARN: Supabase client not available')
      return false
    }

    try {
      console.log('DURMAH_STORE_UPDATE_TITLE:', sessionId, title);
      
      const { error } = await supabase
        .from('durmah_sessions')
        .update({ title })
        .eq('id', sessionId);

      if (error) {
        console.error('DURMAH_STORE_UPDATE_TITLE_ERR:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('DURMAH_STORE_UPDATE_TITLE_ERR:', error);
      return false;
    }
  }

  /**
   * Delete a session and all its messages
   */
  public async deleteSession(sessionId: string): Promise<boolean> {
    if (!supabase) {
      console.warn('DURMAH_STORE_DELETE_SESSION_WARN: Supabase client not available')
      return false
    }

    try {
      console.log('DURMAH_STORE_DELETE_SESSION:', sessionId);
      
      // Delete messages first (due to foreign key constraint)
      const { error: messagesError } = await supabase
        .from('durmah_messages')
        .delete()
        .eq('session_id', sessionId);

      if (messagesError) {
        console.error('DURMAH_STORE_DELETE_MESSAGES_ERR:', messagesError);
        return false;
      }

      // Delete session
      const { error: sessionError } = await supabase
        .from('durmah_sessions')
        .delete()
        .eq('id', sessionId);

      if (sessionError) {
        console.error('DURMAH_STORE_DELETE_SESSION_ERR:', sessionError);
        return false;
      }

      console.log('DURMAH_STORE_DELETE_SESSION_OK:', sessionId);
      return true;
    } catch (error) {
      console.error('DURMAH_STORE_DELETE_SESSION_ERR:', error);
      return false;
    }
  }

  /**
   * Convert VoiceMessage array to ChatMessage array for LLM
   */
  public toChatMessages(voiceMessages: VoiceMessage[]): ChatMessage[] {
    return voiceMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Get session by ID
   */
  public async getSession(sessionId: string): Promise<VoiceSession | null> {
    if (!supabase) {
      console.warn('DURMAH_STORE_GET_SESSION_WARN: Supabase client not available')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('durmah_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('DURMAH_STORE_GET_SESSION_ERR:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('DURMAH_STORE_GET_SESSION_ERR:', error);
      return null;
    }
  }

  /**
   * Get conversation context for LLM (recent messages formatted as ChatMessage)
   */
  public async getConversationContext(
    sessionId: string,
    contextLimit: number = 10
  ): Promise<ChatMessage[]> {
    const messages = await this.getRecent(sessionId, contextLimit);
    return this.toChatMessages(messages);
  }

  /**
   * Clean up old sessions (utility function)
   */
  public async cleanupOldSessions(
    userId: string,
    keepDays: number = 30
  ): Promise<number> {
    if (!supabase) {
      console.warn('DURMAH_STORE_CLEANUP_WARN: Supabase client not available')
      return 0
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);

      const { data, error } = await supabase
        .from('durmah_sessions')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('DURMAH_STORE_CLEANUP_ERR:', error);
        return 0;
      }

      const deletedCount = data?.length || 0;
      console.log('DURMAH_STORE_CLEANUP_OK:', deletedCount, 'sessions deleted');
      return deletedCount;
    } catch (error) {
      console.error('DURMAH_STORE_CLEANUP_ERR:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const supabaseStore = new VoiceSupabaseStore();