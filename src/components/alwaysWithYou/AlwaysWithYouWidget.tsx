'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Heart, Video, Phone, X, Moon, PhoneCall } from 'lucide-react'
import { useAuth } from '@/lib/supabase/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import PresenceService from '@/lib/services/presenceService'
import VideoCallService from '@/lib/services/videoCallService'
import { LovedOne, StudentSharingSettings, VideoCallSession } from '@/lib/types/alwaysWithYou'
import VideoCallModal from './VideoCallModal'
import toast from 'react-hot-toast'

interface AlwaysWithYouWidgetProps {
  className?: string
}

export const AlwaysWithYouWidget: React.FC<AlwaysWithYouWidgetProps> = ({
  className = ''
}) => {
  const { user, userProfile } = useAuth() || { user: null, userProfile: null }
  const [isExpanded, setIsExpanded] = useState(false)
  const [lovedOnes, setLovedOnes] = useState<LovedOne[]>([])
  const [sharingSettings, setSharingSettings] = useState<StudentSharingSettings | null>(null)
  const [showCallModal, setShowCallModal] = useState(false)
  const [selectedParent, setSelectedParent] = useState<LovedOne | null>(null)
  const [incomingCall, setIncomingCall] = useState<VideoCallSession | null>(null)
  const [lovedOnesOnline, setLovedOnesOnline] = useState<LovedOne[]>([])
  const [studentHiddenPresence, setStudentHiddenPresence] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)

  const presenceService = PresenceService.getInstance()
  const videoCallService = VideoCallService.getInstance()

  const loadLovedOnesAndSettings = useCallback(async () => {
    if (!user) return

    const supabase = getSupabaseClient()
    if (!supabase) return

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('parent1_email, parent1_relationship, parent1_display_name, parent2_email, parent2_relationship, parent2_display_name, sharing_settings')
        .eq('id', user.id)
        .single()

      if (error || !profile) return

      const loved: LovedOne[] = []
      
      if (profile.parent1_email) {
        loved.push({
          email: profile.parent1_email,
          relationship: profile.parent1_relationship || 'Parent',
          display_name: profile.parent1_display_name || 'Parent 1',
          is_online: false
        })
      }

      if (profile.parent2_email) {
        loved.push({
          email: profile.parent2_email,
          relationship: profile.parent2_relationship || 'Parent',
          display_name: profile.parent2_display_name || 'Parent 2',
          is_online: false
        })
      }

      setLovedOnes(loved)
      const settings = profile.sharing_settings || {
        show_live_status_to_parents: true,
        share_today_calendar: true,
        share_custom_notes: true,
        do_not_disturb: false
      }
      setSharingSettings(settings)
      setStudentHiddenPresence(!settings.show_live_status_to_parents)

    } catch (error) {
      console.error('Failed to load loved ones:', error)
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    // Load loved ones and settings first
    loadLovedOnesAndSettings()
  }, [user, loadLovedOnesAndSettings])

  const handleIncomingCall = useCallback((session: VideoCallSession) => {
    setIncomingCall(session)
    
    // Show notification
    const parentInfo = lovedOnes.find(p => p.email === session.parent_email)
    toast(`📞 Incoming call from ${parentInfo?.display_name || 'loved one'}`, {
      duration: 10000,
      position: 'top-center'
    })
  }, [lovedOnes]);

  const handleCallAccepted = (session: VideoCallSession) => {
    setIncomingCall(null)
    setShowCallModal(true)
  }

  const handleCallEnded = (session: VideoCallSession) => {
    setIncomingCall(null)
    setShowCallModal(false)
    toast.success('Call ended')
  }

  const handleCallError = (error: string) => {
    setIncomingCall(null)
    setShowCallModal(false)
    toast.error(error)
  }

  const initializeServices = useCallback(async () => {
    if (!user) return

    try {
      // Always initialize presence service for user's own presence tracking
      await presenceService.initialize(user.id)
      
      // Only initialize video call service if loved ones are configured
      if (lovedOnes.length > 0) {
        await videoCallService.initialize(user.id, {
          onIncomingCall: handleIncomingCall,
          onCallAccepted: handleCallAccepted,
          onCallEnded: handleCallEnded,
          onCallError: handleCallError
        })
      }
    } catch (error) {
      console.error('Failed to initialize services:', error)
    }
  }, [user, lovedOnes.length, handleIncomingCall]);

  // Re-initialize services when loved ones change
  useEffect(() => {
    if (!user || !lovedOnes) return

    // Initialize services
    initializeServices()

    // Set up presence subscriptions
    const setupPresenceSubscriptions = (): (() => void)[] => {
      const unsubscribers: (() => void)[] = []
  
      // Only set up subscriptions if loved ones are configured
      if (lovedOnes.length === 0) {
        return unsubscribers
      }
  
      // Real-time subscriptions will be handled by the presence checking useEffect
  
      return unsubscribers
    }
    const unsubscribers = setupPresenceSubscriptions()

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [user, lovedOnes.length, initializeServices])

  // Check loved one presence every 10 seconds
  useEffect(() => {
    if (lovedOnes.length === 0) return

    const checkLovedOnesPresence = async () => {
      const onlineLovedOnes: LovedOne[] = []
      
      for (const lovedOne of lovedOnes) {
        try {
          const supabase = getSupabaseClient()
          if (!supabase) continue
          
          const { data } = await supabase
            .from('parent_session_tokens')
            .select('last_used_at, is_active')
            .eq('parent_email', lovedOne.email)
            .eq('is_active', true)
            .order('last_used_at', { ascending: false })
            .limit(1)
            .single()

          if (data) {
            const lastUsed = new Date(data.last_used_at || 0)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
            
            if (lastUsed > fiveMinutesAgo) {
              onlineLovedOnes.push({ ...lovedOne, is_online: true })
            }
          }
        } catch (error) {
          // Loved one not online, skip
        }
      }
      
      setLovedOnesOnline(onlineLovedOnes)
    }

    // Check immediately and then every 10 seconds
    checkLovedOnesPresence()
    const interval = setInterval(checkLovedOnesPresence, 10000)
    
    return () => clearInterval(interval)
  }, [lovedOnes])

  const startCall = async (parent: LovedOne) => {
    if (!user) return

    // Check if in quiet hours or do not disturb
    if (sharingSettings?.do_not_disturb) {
      toast.error('Do Not Disturb is enabled. Disable it in settings to make calls.')
      return
    }

    if (sharingSettings && presenceService.isInQuietHours(
      sharingSettings.quiet_hours_start,
      sharingSettings.quiet_hours_end
    )) {
      toast.error('Currently in quiet hours. Video calls are disabled.')
      return
    }

    setSelectedParent(parent)
    
    try {
      const session = await videoCallService.initiateCall(user.id, parent.email)
      if (session) {
        setShowCallModal(true)
        toast.success(`Calling ${parent.display_name}...`)
      }
    } catch (error) {
      console.error('Failed to start call:', error)
      toast.error('Failed to start video call')
    }
  }

  const answerCall = async () => {
    if (!incomingCall) return

    try {
      await videoCallService.answerCall(incomingCall.id)
      setIncomingCall(null)
      setShowCallModal(true)
    } catch (error) {
      console.error('Failed to answer call:', error)
      toast.error('Failed to answer call')
    }
  }

  const declineCall = async () => {
    if (!incomingCall) return

    const supabase = getSupabaseClient()
    if (!supabase) return

    try {
      await supabase
        .from('video_call_sessions')
        .update({ status: 'ended' })
        .eq('id', incomingCall.id)

      setIncomingCall(null)
      toast('Call declined')
    } catch (error) {
      console.error('Failed to decline call:', error)
    }
  }

  const getHeartAnimation = () => {
    if (incomingCall) {
      return 'animate-bounce'
    }
    if (lovedOnesOnline.length > 0) {
      return 'animate-pulse'
    }
    return ''
  }

  const getHeartGlow = () => {
    if (incomingCall) {
      return 'shadow-lg shadow-red-500/50 bg-gradient-to-r from-red-400 to-pink-500'
    }
    if (lovedOnesOnline.length > 0) {
      return 'shadow-lg shadow-pink-500/30 bg-gradient-to-r from-pink-400 to-red-400'
    }
    return 'bg-gray-400 shadow-sm'
  }

  const getTooltipMessage = () => {
    if (lovedOnes.length === 0) {
      return 'No Loved Ones Added'
    }
    
    if (incomingCall) {
      const caller = lovedOnes.find(p => p.email === incomingCall.parent_email)
      return `Call from ${caller?.display_name || 'Loved one'}`
    }
    
    if (lovedOnesOnline.length === 0) {
      return 'No Loved Ones Online'
    }
    
    if (lovedOnesOnline.length === 1) {
      return `${lovedOnesOnline[0]?.display_name || 'Someone'} is Online`
    }
    
    if (lovedOnesOnline.length === 2) {
      return `${lovedOnesOnline[0]?.display_name || 'Someone'} and ${lovedOnesOnline[1]?.display_name || 'Someone'} are Online`
    }
    
    return `${lovedOnesOnline.length} loved ones online`
  }

  const getOnlineBadgeCount = () => {
    if (incomingCall) return 1
    return lovedOnesOnline.length
  }

  // Don't show widget if no user
  if (!user) {
    return null
  }

  // Don't show if do not disturb is on
  if (sharingSettings?.do_not_disturb) {
    return (
      <div className="fixed bottom-4 right-4 md:top-20 md:bottom-auto md:right-6 z-50">
        <div className="bg-gray-500 text-white p-2 rounded-full shadow-lg">
          <Moon className="w-5 h-5" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div 
        ref={widgetRef}
        className={`fixed bottom-4 right-4 md:top-20 md:bottom-auto md:right-6 z-50 group ${className}`}
      >
        {/* Floating Heart Icon */}
        <div
          className={`relative w-14 h-14 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 ${getHeartGlow()} ${getHeartAnimation()}`}
          onClick={() => setIsExpanded(!isExpanded)}
          title={getTooltipMessage()}
        >
          <Heart className={`w-6 h-6 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${lovedOnes.length === 0 ? 'opacity-50' : 'opacity-100'}`} fill="currentColor" />
          
          {/* Online Badge Count (Mobile) */}
          {getOnlineBadgeCount() > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center md:hidden animate-pulse">
              {getOnlineBadgeCount()}
            </div>
          )}
        </div>

        {/* Desktop Tooltip */}
        <div className="absolute top-full right-0 mt-2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity hidden md:block">
          {getTooltipMessage()}
          <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
        </div>

        {/* Expanded Popup Panel */}
        {isExpanded && (
          <div className="absolute bottom-full right-0 mb-2 md:top-full md:bottom-auto md:mt-2 md:mb-0 bg-white rounded-lg shadow-xl border border-gray-200 min-w-72 max-w-80 animate-in slide-in-from-bottom-2 md:animate-in md:slide-in-from-top-2">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-pink-500" fill="currentColor" />
                  <h3 className="font-semibold text-gray-900">Always With You</h3>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Incoming call section */}
              {incomingCall && (
                <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                        <PhoneCall className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-red-800">Incoming Call</p>
                        <p className="text-sm text-red-600">
                          from {lovedOnes.find(p => p.email === incomingCall.parent_email)?.display_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={answerCall}
                        className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-colors"
                        title="Accept Call"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={declineCall}
                        className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors"
                        title="Decline Call"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Loved ones list */}
              {lovedOnes.length > 0 ? (
                <div className="space-y-3">
                  {lovedOnes.map((parent, index) => {
                    const isOnline = lovedOnesOnline.some(online => online.email === parent.email)
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'} ${isOnline ? 'animate-pulse' : ''}`} />
                            {isOnline && (
                              <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-400 animate-ping opacity-50" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {parent.display_name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {isOnline ? 'Online now' : 'Offline'} • {parent.relationship}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => startCall(parent)}
                          disabled={!isOnline}
                          className={`p-2 rounded-full transition-all duration-200 ${
                            isOnline
                              ? 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-110'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                          title={isOnline ? `Call ${parent.display_name}` : `${parent.display_name} is offline`}
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-3">
                    No loved ones added yet
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    Add up to 2 loved ones to stay connected
                  </p>
                  <button
                    onClick={() => {
                      setIsExpanded(false)
                      window.open('/settings?tab=family', '_blank')
                    }}
                    className="text-sm bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                  >
                    Add Loved Ones
                  </button>
                </div>
              )}

              {lovedOnes.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setIsExpanded(false)
                      window.open('/settings?tab=family', '_blank')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Manage loved ones →
                  </button>
                  <p className="text-xs text-gray-400">
                    {lovedOnesOnline.length} of {lovedOnes.length} online
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile expanded overlay */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden" onClick={() => setIsExpanded(false)} />
      )}

      {/* Video call modal */}
      {showCallModal && selectedParent && (
        <VideoCallModal
          session={videoCallService.getCurrentSession()}
          onClose={() => {
            setShowCallModal(false)
            setSelectedParent(null)
          }}
          localStream={videoCallService.getLocalStream()}
          remoteStream={videoCallService.getRemoteStream()}
          onEndCall={() => {
            videoCallService.endCall()
            setShowCallModal(false)
            setSelectedParent(null)
          }}
          onToggleCamera={() => videoCallService.toggleCamera()}
          onToggleMicrophone={() => videoCallService.toggleMicrophone()}
        />
      )}
    </>
  )
}

export default AlwaysWithYouWidget