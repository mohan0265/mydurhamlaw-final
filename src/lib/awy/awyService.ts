
import { getSupabaseClient } from '@/lib/supabase/client';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { 
  AWYConnection, 
  AWYPresence, 
  AWYInteraction, 
  AWYCallSession, 
  AWYNotification 
} from '@/types/billing';

export class AWYService {
  private supabase: any;

  constructor(isServer = false) {
    this.supabase = isServer ? getSupabaseServerClient() : getSupabaseClient();
  }

  private ensureSupabase(): any {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    return this.ensureSupabase();
  }

  // Connection Management
  async createConnection(
    userId: string,
    connectionEmail: string,
    relationshipLabel: string,
    displayName?: string
  ): Promise<string> {
    const { data, error } = await this.ensureSupabase()
      .rpc('create_awy_connection', {
        user_id_param: userId,
        connection_email_param: connectionEmail,
        relationship_label_param: relationshipLabel,
        display_name_param: displayName
      });

    if (error) {
      console.error('Error creating AWY connection:', error);
      throw new Error(error.message || 'Failed to create connection');
    }

    return data;
  }

  async acceptInvitation(invitationToken: string, acceptingUserId: string): Promise<boolean> {
    const { data, error } = await this.ensureSupabase()
      .rpc('accept_awy_invitation', {
        invitation_token_param: invitationToken,
        accepting_user_id: acceptingUserId
      });

    if (error) {
      console.error('Error accepting invitation:', error);
      return false;
    }

    return data || false;
  }

  async getUserConnections(userId: string): Promise<AWYConnection[]> {
    const { data, error } = await this.ensureSupabase()
      .from('awy_connections')
      .select(`
        *,
        connected_user:profiles!awy_connections_connected_user_id_fkey (
          id,
          display_name,
          email
        )
      `)
      .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
      throw new Error('Failed to fetch connections');
    }

    return data || [];
  }

  async updateConnectionPermissions(
    connectionId: string,
    permissions: AWYConnection['permissions']
  ): Promise<void> {
    const { error } = await this.ensureSupabase()
      .from('awy_connections')
      .update({ permissions })
      .eq('id', connectionId);

    if (error) {
      console.error('Error updating connection permissions:', error);
      throw new Error('Failed to update permissions');
    }
  }

  async deleteConnection(connectionId: string): Promise<void> {
    const { error } = await this.ensureSupabase()
      .from('awy_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      console.error('Error deleting connection:', error);
      throw new Error('Failed to delete connection');
    }
  }

  // Presence Management
  async updatePresence(
    userId: string,
    presenceData: Partial<AWYPresence>
  ): Promise<void> {
    const { error } = await this.ensureSupabase()
      .from('awy_presence')
      .upsert({
        user_id: userId,
        ...presenceData,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating presence:', error);
      throw new Error('Failed to update presence');
    }
  }

  async getPresenceForConnections(userId: string): Promise<Record<string, AWYPresence>> {
    // Get user's connections first
    const connections = await this.getUserConnections(userId);
    const connectedUserIds = connections
      .filter(conn => conn.status === 'active' && conn.connected_user_id)
      .map(conn => conn.connected_user_id!);

    if (connectedUserIds.length === 0) {
      return {};
    }

    const { data, error } = await this.ensureSupabase()
      .from('awy_presence')
      .select('*')
      .in('user_id', connectedUserIds);

    if (error) {
      console.error('Error fetching presence data:', error);
      return {};
    }

    // Convert to record format
    const presenceMap: Record<string, AWYPresence> = {};
    data?.forEach((presence: any) => {
      presenceMap[presence.user_id] = presence;
    });

    return presenceMap;
  }

  // Interaction Management
  async sendInteraction(
    fromUserId: string,
    connectionId: string,
    interactionType: AWYInteraction['interaction_type'],
    message?: string
  ): Promise<string> {
    const { data, error } = await this.ensureSupabase()
      .rpc('send_awy_interaction', {
        from_user_id_param: fromUserId,
        connection_id_param: connectionId,
        interaction_type_param: interactionType,
        message_param: message
      });

    if (error) {
      console.error('Error sending interaction:', error);
      throw new Error('Failed to send interaction');
    }

    return data;
  }

  async getRecentInteractions(userId: string, limit: number = 20): Promise<AWYInteraction[]> {
    const { data, error } = await this.ensureSupabase()
      .from('awy_interactions')
      .select(`
        *,
        from_user:profiles!awy_interactions_from_user_id_fkey (
          display_name
        ),
        to_user:profiles!awy_interactions_to_user_id_fkey (
          display_name
        ),
        connection:awy_connections (
          relationship_label
        )
      `)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching interactions:', error);
      throw new Error('Failed to fetch interactions');
    }

    return data || [];
  }

  async markInteractionAsRead(interactionId: string): Promise<void> {
    const { error } = await this.ensureSupabase()
      .from('awy_interactions')
      .update({ read_at: new Date().toISOString() })
      .eq('id', interactionId);

    if (error) {
      console.error('Error marking interaction as read:', error);
    }
  }

  // Call Session Management
  async initiateCall(
    connectionId: string,
    initiatorUserId: string,
    recipientUserId: string,
    sessionType: AWYCallSession['session_type'] = 'video'
  ): Promise<string> {
    const { data, error } = await this.ensureSupabase()
      .from('awy_call_sessions')
      .insert({
        connection_id: connectionId,
        initiator_user_id: initiatorUserId,
        recipient_user_id: recipientUserId,
        session_type: sessionType,
        status: 'initiating'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error initiating call:', error);
      throw new Error('Failed to initiate call');
    }

    return data.id;
  }

  async updateCallSession(
    sessionId: string,
    updates: Partial<AWYCallSession>
  ): Promise<void> {
    const { error } = await this.ensureSupabase()
      .from('awy_call_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating call session:', error);
      throw new Error('Failed to update call session');
    }
  }

  async getCallSession(sessionId: string): Promise<AWYCallSession | null> {
    const { data, error } = await this.ensureSupabase()
      .from('awy_call_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching call session:', error);
      return null;
    }

    return data;
  }

  // Notification Management
  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<AWYNotification[]> {
    let query = this.ensureSupabase()
      .from('awy_notifications')
      .select('*')
      .eq('user_id', userId);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await this.ensureSupabase()
      .from('awy_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await this.ensureSupabase()
      .from('awy_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Real-time subscriptions
  subscribeToPresenceUpdates(userId: string, callback: (presence: AWYPresence) => void) {
    return this.ensureSupabase()
      .channel(`presence:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'awy_presence'
        },
        (payload: any) => {
          if (payload.new) {
            callback(payload.new as AWYPresence);
          }
        }
      )
      .subscribe();
  }

  subscribeToInteractions(userId: string, callback: (interaction: AWYInteraction) => void) {
    return this.ensureSupabase()
      .channel(`interactions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'awy_interactions',
          filter: `to_user_id=eq.${userId}`
        },
        (payload: any) => {
          if (payload.new) {
            callback(payload.new as AWYInteraction);
          }
        }
      )
      .subscribe();
  }

  subscribeToCallSessions(userId: string, callback: (session: AWYCallSession) => void) {
    return this.ensureSupabase()
      .channel(`calls:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'awy_call_sessions',
          filter: `or(initiator_user_id.eq.${userId},recipient_user_id.eq.${userId})`
        },
        (payload: any) => {
          if (payload.new) {
            callback(payload.new as AWYCallSession);
          }
        }
      )
      .subscribe();
  }
}

// Singleton instances
export const awyService = new AWYService();
export const serverAWYService = new AWYService(true);
