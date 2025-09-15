import { getSupabaseClient } from '@/lib/supabase/client';
import { authedFetch } from '@/lib/api/authedFetch';

export class AWYService {
  private supabase: any;

  constructor() {
    this.supabase = getSupabaseClient();
  }

  // Use API endpoints instead of direct database calls for better authentication
  async getUserConnections(userId: string): Promise<any[]> {
    try {
      const response = await authedFetch('/api/awy/connections');
      if (!response.ok) {
        throw new Error(`Failed to fetch connections: ${response.status}`);
      }
      const data = await response.json();
      return data.connections || [];
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw new Error('Failed to fetch connections');
    }
  }

  async createConnection(
    email: string,
    relationship: string,
    displayName?: string
  ): Promise<string> {
    try {
      const response = await authedFetch('/api/awy/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          relationship,
          displayName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create connection: ${response.status}`);
      }

      const data = await response.json();
      return data.connectionId;
    } catch (error) {
      console.error('Error creating connection:', error);
      throw error;
    }
  }

  async deleteConnection(connectionId: string): Promise<void> {
    try {
      const response = await authedFetch('/api/awy/connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: connectionId })
      });

      if (!response.ok) {
        throw new Error(`Failed to delete connection: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      throw new Error('Failed to delete connection');
    }
  }

  async getPresenceForConnections(): Promise<Record<string, any>> {
    try {
      const response = await authedFetch('/api/awy/presence');
      if (!response.ok) {
        throw new Error(`Failed to fetch presence: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching presence:', error);
      return {};
    }
  }

  async initiateCall(email: string): Promise<string> {
    try {
      const response = await authedFetch('/api/awy/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate call: ${response.status}`);
      }

      const data = await response.json();
      return data.roomUrl || data.url;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw new Error('Failed to initiate call');
    }
  }
}

// Singleton instance
export const awyService = new AWYService();
