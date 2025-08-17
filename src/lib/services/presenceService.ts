'use client'

import { supabase } from '@/lib/supabase/client'
import { PresenceData } from '@/lib/types/alwaysWithYou'

class PresenceService {
  private static instance: PresenceService
  private heartbeatInterval: NodeJS.Timeout | null = null
  private currentUserId: string | null = null
  private isActive = false

  static getInstance(): PresenceService {
    if (!PresenceService.instance) {
      PresenceService.instance = new PresenceService()
    }
    return PresenceService.instance
  }

  /**
   * Initialize presence tracking for a user
   */
  async initialize(userId: string): Promise<void> {
    if (this.currentUserId === userId && this.isActive) {
      return // Already initialized for this user
    }

    this.currentUserId = userId
    this.isActive = true

    // Set initial online status
    await this.updatePresence(true)

    // Start heartbeat to maintain online status
    this.startHeartbeat()

    // Listen for page visibility changes
    this.setupVisibilityListeners()

    // Set offline when page unloads
    this.setupUnloadListeners()

    console.log('✅ Presence service initialized for user:', userId)
  }

  /**
   * Update user presence in database
   */
  private async updatePresence(isOnline: boolean, activity?: string, currentPage?: string): Promise<void> {
    if (!this.currentUserId) return
    if (!supabase) return

    try {
      const presenceData: Partial<PresenceData> = {
        user_id: this.currentUserId,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        current_page: currentPage || (typeof window !== 'undefined' ? window.location.pathname : undefined),
        activity
      }

      const { error } = await supabase
        .from('user_presence')
        .upsert(presenceData, { onConflict: 'user_id' })

      if (error) {
        console.error('Failed to update presence:', error)
      }
    } catch (error) {
      console.error('Presence update error:', error)
    }
  }

  /**
   * Set user activity (e.g., "Studying Contract Law", "In Lecture")
   */
  async setActivity(activity: string): Promise<void> {
    if (!this.currentUserId) return
    
    await this.updatePresence(true, activity)
  }

  /**
   * Clear user activity
   */
  async clearActivity(): Promise<void> {
    if (!this.currentUserId) return
    
    await this.updatePresence(true, '')
  }

  /**
   * Get presence status for a user
   */
  async getPresence(userId: string): Promise<PresenceData | null> {
    if (!supabase) return null
    
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) return null

      return data as PresenceData
    } catch (error) {
      console.error('Failed to get presence:', error)
      return null
    }
  }

  /**
   * Subscribe to presence changes for a user
   */
  subscribeToPresence(userId: string, callback: (presence: PresenceData | null) => void): () => void {
    if (!supabase) return () => {}
    
    const subscription = supabase
      .channel(`presence-${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_presence',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          if (payload.eventType === 'DELETE') {
            callback(null)
          } else {
            callback(payload.new as PresenceData)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  /**
   * Start heartbeat to maintain online status
   */
  private startHeartbeat(): void {
    // Update presence every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.isActive) {
        this.updatePresence(true)
      }
    }, 30000)
  }

  /**
   * Setup visibility change listeners
   */
  private setupVisibilityListeners(): void {
    if (typeof window === 'undefined') return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.updatePresence(false)
      } else {
        this.updatePresence(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  /**
   * Setup page unload listeners to set offline status
   */
  private setupUnloadListeners(): void {
    if (typeof window === 'undefined') return

    const handleUnload = () => {
      // Use sendBeacon for reliable offline status update
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator && this.currentUserId) {
        const data = new FormData()
        data.append('user_id', this.currentUserId)
        data.append('is_online', 'false')
        data.append('last_seen', new Date().toISOString())
        
        // Note: This would need a backend endpoint to handle the beacon
        // For now, we'll use the standard method
      }
      
      this.updatePresence(false)
    }

    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('pagehide', handleUnload)
  }

  /**
   * Stop presence tracking
   */
  stop(): void {
    this.isActive = false
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.currentUserId) {
      this.updatePresence(false)
    }

    this.currentUserId = null
    console.log('🛑 Presence service stopped')
  }

  /**
   * Check if user is currently in quiet hours
   */
  isInQuietHours(quietStart?: string, quietEnd?: string): boolean {
    if (!quietStart || !quietEnd) return false

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    const startParts = quietStart.split(':')
    const endParts = quietEnd.split(':')
    
    if (startParts.length !== 2 || endParts.length !== 2) return false
    
    const startHour = Number(startParts[0])
    const startMin = Number(startParts[1])
    const endHour = Number(endParts[0])
    const endMin = Number(endParts[1])
    
    // Validate parsed time values
    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      return false
    }
    
    const quietStartTime = startHour * 60 + startMin
    const quietEndTime = endHour * 60 + endMin

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (quietStartTime > quietEndTime) {
      return currentTime >= quietStartTime || currentTime <= quietEndTime
    } else {
      return currentTime >= quietStartTime && currentTime <= quietEndTime
    }
  }
}

export default PresenceService