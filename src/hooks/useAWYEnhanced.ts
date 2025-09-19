
import { useState, useEffect, useCallback } from 'react';
import { awyService } from '@/lib/awy/service';
import type { 
  AWYConnection, 
  AWYPresence, 
  AWYInteraction, 
  AWYNotification 
} from '@/types/billing';

export const useAWYEnhanced = (userId?: string) => {
  const [connections, setConnections] = useState<AWYConnection[]>([]);
  const [presence, setPresence] = useState<Record<string, AWYPresence>>({});
  const [interactions, setInteractions] = useState<AWYInteraction[]>([]);
  const [notifications, setNotifications] = useState<AWYNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all AWY data
  const fetchAWYData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const [connectionsData, presenceData, interactionsData, notificationsData] = await Promise.all([
        awyService.getUserConnections(userId),
        awyService.getPresenceForConnections(userId),
        awyService.getRecentInteractions(userId, 20),
        awyService.getUserNotifications(userId, true) // unread only
      ]);

      setConnections(connectionsData);
      setPresence(presenceData);
      setInteractions(interactionsData);
      setNotifications(notificationsData);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching AWY data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAWYData();
  }, [fetchAWYData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    const presenceSubscription = awyService.subscribeToPresenceUpdates(userId, (newPresence) => {
      setPresence(prev => ({
        ...prev,
        [newPresence.user_id]: newPresence
      }));
    });

    const interactionsSubscription = awyService.subscribeToInteractions(userId, (newInteraction) => {
      setInteractions(prev => [newInteraction, ...prev.slice(0, 19)]);
      // Refresh notifications when new interaction arrives
      fetchNotifications();
    });

    return () => {
      presenceSubscription.unsubscribe();
      interactionsSubscription.unsubscribe();
    };
  }, [userId]);

  const fetchNotifications = async () => {
    if (!userId) return;
    
    try {
      const notificationsData = await awyService.getUserNotifications(userId, true);
      setNotifications(notificationsData);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Connection management
  const createConnection = async (
    connectionEmail: string,
    relationshipLabel: string,
    displayName?: string
  ) => {
    if (!userId) throw new Error('User ID required');

    try {
      const connectionId = await awyService.createConnection(
        userId,
        connectionEmail,
        relationshipLabel,
        displayName
      );
      
      // Refresh connections
      await fetchAWYData();
      return connectionId;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteConnection = async (connectionId: string) => {
    try {
      await awyService.deleteConnection(connectionId);
      
      // Remove from local state
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateConnectionPermissions = async (
    connectionId: string,
    permissions: AWYConnection['permissions']
  ) => {
    try {
      await awyService.updateConnectionPermissions(connectionId, permissions);
      
      // Update local state
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId ? { ...conn, permissions } : conn
      ));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Presence management
  const updatePresence = async (presenceData: Partial<AWYPresence>) => {
    if (!userId) return;

    try {
      await awyService.updatePresence(userId, presenceData);
    } catch (err: any) {
      console.error('Error updating presence:', err);
    }
  };

  // Interaction management
  const sendInteraction = async (
    connectionId: string,
    interactionType: AWYInteraction['interaction_type'],
    message?: string
  ) => {
    if (!userId) throw new Error('User ID required');

    try {
      const interactionId = await awyService.sendInteraction(
        userId,
        connectionId,
        interactionType,
        message
      );
      
      // Refresh interactions
      const updatedInteractions = await awyService.getRecentInteractions(userId, 20);
      setInteractions(updatedInteractions);
      
      return interactionId;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const markInteractionAsRead = async (interactionId: string) => {
    try {
      await awyService.markInteractionAsRead(interactionId);
      
      // Update local state
      setInteractions(prev => prev.map(interaction => 
        interaction.id === interactionId 
          ? { ...interaction, read_at: new Date().toISOString() }
          : interaction
      ));
    } catch (err: any) {
      console.error('Error marking interaction as read:', err);
    }
  };

  // Notification management
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await awyService.markNotificationAsRead(notificationId);
      
      // Remove from local state
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!userId) return;

    try {
      await awyService.markAllNotificationsAsRead(userId);
      setNotifications([]);
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Call management
  const initiateCall = async (
    connectionId: string,
    recipientUserId: string,
    sessionType: 'video' | 'voice' | 'screen_share' = 'video'
  ) => {
    if (!userId) throw new Error('User ID required');

    try {
      const sessionId = await awyService.initiateCall(
        connectionId,
        userId,
        recipientUserId,
        sessionType
      );
      
      return sessionId;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Utility functions
  const getOnlineConnections = () => {
    return connections.filter(conn => 
      conn.status === 'active' && 
      conn.connected_user_id && 
      presence[conn.connected_user_id]?.is_online
    );
  };

  const getConnectionDisplayName = (connection: AWYConnection) => {
    return connection.display_name || connection.relationship_label;
  };

  const getUnreadNotificationCount = () => {
    return notifications.length;
  };

  const hasUnreadInteractions = () => {
    return interactions.some(interaction => 
      !interaction.read_at && interaction.to_user_id === userId
    );
  };

  return {
    // State
    connections,
    presence,
    interactions,
    notifications,
    loading,
    error,

    // Connection management
    createConnection,
    deleteConnection,
    updateConnectionPermissions,

    // Presence management
    updatePresence,

    // Interaction management
    sendInteraction,
    markInteractionAsRead,

    // Notification management
    markNotificationAsRead,
    markAllNotificationsAsRead,

    // Call management
    initiateCall,

    // Utility functions
    getOnlineConnections,
    getConnectionDisplayName,
    getUnreadNotificationCount,
    hasUnreadInteractions,

    // Refresh function
    refetch: fetchAWYData
  };
};
