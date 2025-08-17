'use client'

import { supabase } from '@/lib/supabase/client'
import { VideoCallSession } from '@/lib/types/alwaysWithYou'

interface CallEventHandlers {
  onIncomingCall?: (session: VideoCallSession) => void
  onCallAccepted?: (session: VideoCallSession) => void
  onCallEnded?: (session: VideoCallSession) => void
  onCallError?: (error: string) => void
}

class VideoCallService {
  private static instance: VideoCallService
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private currentSession: VideoCallSession | null = null
  private eventHandlers: CallEventHandlers = {}
  private signalingChannel: any = null

  private readonly iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]

  static getInstance(): VideoCallService {
    if (!VideoCallService.instance) {
      VideoCallService.instance = new VideoCallService()
    }
    return VideoCallService.instance
  }

  /**
   * Initialize video call service
   */
  async initialize(userId: string, eventHandlers: CallEventHandlers): Promise<void> {
    if (!supabase) {
      console.warn('Supabase client not available, video calls disabled')
      return
    }
    
    this.eventHandlers = eventHandlers

    // Set up signaling channel using Supabase Realtime
    this.signalingChannel = supabase
      .channel(`video-calls-${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'video_call_sessions',
          filter: `student_id=eq.${userId}`
        }, 
        (payload) => this.handleSignalingMessage(payload)
      )
      .subscribe()

    console.log('✅ Video call service initialized for user:', userId)
  }

  /**
   * Initiate a call to a parent/loved one
   */
  async initiateCall(studentId: string, parentEmail: string): Promise<VideoCallSession | null> {
    try {
      // Create call session in database
      if (!supabase) {
        throw new Error('Database not available')
      }
      
      const { data: session, error } = await supabase
        .from('video_call_sessions')
        .insert({
          student_id: studentId,
          parent_email: parentEmail,
          status: 'initiating'
        })
        .select()
        .single()

      if (error || !session) {
        console.error('Failed to create call session:', error)
        this.eventHandlers.onCallError?.('Failed to initiate call')
        return null
      }

      this.currentSession = session as VideoCallSession

      // Get user media
      await this.getUserMedia()

      // Create peer connection
      await this.createPeerConnection()

      // Create offer
      const offer = await this.peerConnection!.createOffer()
      await this.peerConnection!.setLocalDescription(offer)

      // Update session with offer
      await supabase
        .from('video_call_sessions')
        .update({
          status: 'ringing',
          metadata: { offer: offer }
        })
        .eq('id', session.id)

      console.log('📞 Call initiated to:', parentEmail)
      return this.currentSession

    } catch (error) {
      console.error('Failed to initiate call:', error)
      this.eventHandlers.onCallError?.('Failed to start video call')
      return null
    }
  }

  /**
   * Answer an incoming call
   */
  async answerCall(sessionId: string): Promise<void> {
    try {
      if (!this.currentSession || this.currentSession.id !== sessionId) {
        throw new Error('No matching call session found')
      }

      // Get user media
      await this.getUserMedia()

      // Create peer connection
      await this.createPeerConnection()

      // Get the offer from session metadata
      if (!supabase) {
        throw new Error('Database not available')
      }
      
      const { data: session } = await supabase
        .from('video_call_sessions')
        .select('metadata')
        .eq('id', sessionId)
        .single()

      if (session?.metadata?.offer) {
        await this.peerConnection!.setRemoteDescription(session.metadata.offer)
        
        // Create answer
        const answer = await this.peerConnection!.createAnswer()
        await this.peerConnection!.setLocalDescription(answer)

        // Update session with answer
        if (supabase) {
          await supabase
            .from('video_call_sessions')
            .update({
              status: 'active',
              metadata: { 
                ...session.metadata,
                answer: answer 
              }
            })
            .eq('id', sessionId)
        }

        this.eventHandlers.onCallAccepted?.(this.currentSession)
        console.log('✅ Call answered')
      }

    } catch (error) {
      console.error('Failed to answer call:', error)
      this.eventHandlers.onCallError?.('Failed to answer call')
    }
  }

  /**
   * End the current call
   */
  async endCall(): Promise<void> {
    if (!this.currentSession) return

    try {
      // Update session status
      if (supabase) {
        await supabase
          .from('video_call_sessions')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
            duration: this.calculateCallDuration()
          })
          .eq('id', this.currentSession.id)
      }

      // Clean up
      this.cleanup()

      this.eventHandlers.onCallEnded?.(this.currentSession)
      this.currentSession = null

      console.log('📞 Call ended')

    } catch (error) {
      console.error('Failed to end call:', error)
    }
  }

  /**
   * Get user media (camera and microphone)
   */
  private async getUserMedia(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
    } catch (error) {
      console.error('Failed to get user media:', error)
      throw new Error('Camera and microphone access required for video calls')
    }
  }

  /**
   * Create WebRTC peer connection
   */
  private async createPeerConnection(): Promise<void> {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    })

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!)
      })
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0] || null
    }

    // Handle ICE candidates
    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate && this.currentSession) {
        // Send ICE candidate through signaling
        await this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate
        })
      }
    }

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState
      console.log('Connection state:', state)
      
      if (state === 'failed' || state === 'disconnected') {
        this.endCall()
      }
    }
  }

  /**
   * Handle signaling messages from Supabase Realtime
   */
  private async handleSignalingMessage(payload: any): Promise<void> {
    try {
      const session = payload.new as VideoCallSession

      if (session.status === 'ringing' && !this.currentSession) {
        // Incoming call
        this.currentSession = session
        this.eventHandlers.onIncomingCall?.(session)
      } else if (session.status === 'active' && this.currentSession?.id === session.id) {
        // Call was accepted
        const metadata = session.metadata as any
        if (metadata?.answer && this.peerConnection) {
          await this.peerConnection.setRemoteDescription(metadata.answer)
        }
      } else if (session.status === 'ended' && this.currentSession?.id === session.id) {
        // Call was ended
        this.cleanup()
        this.eventHandlers.onCallEnded?.(session)
        this.currentSession = null
      }

    } catch (error) {
      console.error('Error handling signaling message:', error)
    }
  }

  /**
   * Send signaling message
   */
  private async sendSignalingMessage(message: any): Promise<void> {
    if (!this.currentSession || !supabase) return

    try {
      const { data: session } = await supabase
        .from('video_call_sessions')
        .select('metadata')
        .eq('id', this.currentSession.id)
        .single()

      const updatedMetadata = {
        ...session?.metadata,
        signaling: message
      }

      await supabase
        .from('video_call_sessions')
        .update({ metadata: updatedMetadata })
        .eq('id', this.currentSession.id)

    } catch (error) {
      console.error('Failed to send signaling message:', error)
    }
  }

  /**
   * Calculate call duration in seconds
   */
  private calculateCallDuration(): number {
    if (!this.currentSession?.started_at) return 0

    const startTime = new Date(this.currentSession.started_at).getTime()
    const endTime = Date.now()
    return Math.floor((endTime - startTime) / 1000)
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    this.remoteStream = null
  }

  /**
   * Get local video stream for UI
   */
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  /**
   * Get remote video stream for UI
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  /**
   * Get current call session
   */
  getCurrentSession(): VideoCallSession | null {
    return this.currentSession
  }

  /**
   * Toggle camera on/off
   */
  toggleCamera(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
      }
    }
  }

  /**
   * Toggle microphone on/off
   */
  toggleMicrophone(): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
      }
    }
  }

  /**
   * Destroy the service and clean up
   */
  destroy(): void {
    this.cleanup()
    
    if (this.signalingChannel) {
      this.signalingChannel.unsubscribe()
      this.signalingChannel = null
    }

    this.currentSession = null
    this.eventHandlers = {}
    
    console.log('🛑 Video call service destroyed')
  }
}

export default VideoCallService