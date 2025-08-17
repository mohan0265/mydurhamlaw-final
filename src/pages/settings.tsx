'use client'

import { useState, useEffect, useContext, useRef } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { ArrowLeft, User, Volume2, Shield, Save, Camera, Play, Check, AlertCircle, Info, Heart, Eye, EyeOff, Clock, Bell, MessageCircle } from 'lucide-react'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import ModernSidebar from '@/components/layout/ModernSidebar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import toast from 'react-hot-toast'
// import { useVoiceManager } from '@/lib/context/VoiceManagerContext' // Removed - using DurmahContext
import type { UserProfile, SharingSettings } from '@/lib/types'
import { getOrigin } from '@/lib/utils/getOrigin'

interface ProfileData {
  full_name: string
  display_name: string
  email: string
  user_type: string
  avatar_url?: string
  durmah_voice: string
  voice_speed: string
  voice_mode_enabled: boolean
  ai_safety_level: string
  feedback_reminder_opt_in: boolean
  // Always With You settings
  parent1_email: string
  parent1_relationship: string
  parent1_display_name: string
  parent2_email: string
  parent2_relationship: string
  parent2_display_name: string
  sharing_settings: SharingSettings
}

const VOICE_OPTIONS = [
  { 
    id: 'nova', 
    name: 'Nova', 
    description: 'Warm and encouraging female voice',
    personality: 'female_warm',
    icon: '👩‍🎓'
  },
  { 
    id: 'echo', 
    name: 'Echo', 
    description: 'Confident and supportive male mentor',
    personality: 'male_mentor',
    icon: '👨‍🏫'
  },
  { 
    id: 'shimmer', 
    name: 'Shimmer', 
    description: 'Gentle and clear neutral voice',
    personality: 'neutral_gentle',
    icon: '🎭'
  },
  { 
    id: 'alloy', 
    name: 'Alloy', 
    description: 'Balanced and professional tone',
    personality: 'neutral_professional',
    icon: '⚖️'
  }
]

const VOICE_SPEEDS = [
  { id: '0.8', name: 'Slow', description: 'Relaxed pace for complex topics' },
  { id: '1.0', name: 'Normal', description: 'Natural conversational speed' },
  { id: '1.2', name: 'Fast', description: 'Quick pace for efficient learning' }
]

const AI_SAFETY_LEVELS = [
  { 
    id: 'conservative', 
    name: 'Conservative', 
    description: 'Extra cautious responses with more disclaimers',
    icon: '🛡️'
  },
  { 
    id: 'balanced', 
    name: 'Balanced', 
    description: 'Standard academic guidance with appropriate caution',
    icon: '⚖️'
  },
  { 
    id: 'exploratory', 
    name: 'Exploratory', 
    description: 'More detailed responses for advanced discussions',
    icon: '🔍'
  }
]

const USER_TYPE_LABELS = {
  'foundation': { name: 'Foundation Year', color: 'bg-green-100 text-green-800' },
  'year1': { name: 'Year 1', color: 'bg-blue-100 text-blue-800' },
  'year2': { name: 'Year 2', color: 'bg-purple-100 text-purple-800' },
  'year3': { name: 'Year 3', color: 'bg-red-100 text-red-800' }
}

export default function SettingsPage() {
  const router = useRouter()
  const { session, userProfile } = useContext(AuthContext)
  // const voiceManager = useVoiceManager() // Removed - using DurmahContext
  const voiceManager = {
    isCurrentlyPlaying: (...args: any[]) => false,
    stopAudio: (...args: any[]) => {},
    canPlayAudio: (...args: any[]) => true,
    getPlayingStatus: () => ({ source: 'none' }),
    startAudio: (...args: any[]) => true
  } // Temporary stub
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    display_name: '',
    email: '',
    user_type: '',
    avatar_url: '',
    durmah_voice: 'nova',
    voice_speed: '1.0',
    voice_mode_enabled: true,
    ai_safety_level: 'balanced',
    feedback_reminder_opt_in: true,
    // Always With You settings
    parent1_email: '',
    parent1_relationship: '',
    parent1_display_name: '',
    parent2_email: '',
    parent2_relationship: '',
    parent2_display_name: '',
    sharing_settings: {
      show_live_status_to_parents: true,
      share_today_calendar: true,
      share_custom_notes: true,
      do_not_disturb: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00'
    }
  })

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // Load profile data
  useEffect(() => {
    if (userProfile && session?.user) {
      setProfile({
        full_name: userProfile.full_name || '',
        display_name: userProfile.display_name || '',
        email: session.user.email || '',
        user_type: userProfile.user_type || userProfile.year_group || '', // Handle legacy field
        avatar_url: userProfile.avatar_url || '',
        durmah_voice: userProfile.durmah_voice || userProfile.tts_voice || 'nova', // Handle legacy field
        voice_speed: userProfile.voice_speed || '1.0',
        voice_mode_enabled: userProfile.voice_mode_enabled !== false,
        ai_safety_level: userProfile.ai_safety_level || 'balanced',
        feedback_reminder_opt_in: userProfile.feedback_reminder_opt_in !== false,
        // Always With You settings
        parent1_email: userProfile?.parent1_email || '',
        parent1_relationship: userProfile?.parent1_relationship || '',
        parent1_display_name: userProfile?.parent1_display_name || '',
        parent2_email: userProfile?.parent2_email || '',
        parent2_relationship: userProfile?.parent2_relationship || '',
        parent2_display_name: userProfile?.parent2_display_name || '',
        sharing_settings: userProfile?.sharing_settings || {
          show_live_status_to_parents: true,
          share_today_calendar: true,
          share_custom_notes: true,
          do_not_disturb: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00'
        }
      })
      setAvatarPreview(userProfile.avatar_url || null)
      setLoading(false)
    }
  }, [userProfile, session])

  // Handle tab switching from URL
  useEffect(() => {
    const { tab } = router.query
    if (tab && typeof tab === 'string') {
      setActiveTab(tab)
    }
  }, [router.query])

  // Handle input changes
  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  // Handle sharing settings changes
  const handleSharingSettingsChange = (setting: keyof SharingSettings, value: any) => {
    setProfile(prev => ({
      ...prev,
      sharing_settings: {
        ...prev.sharing_settings,
        [setting]: value
      }
    }))
    setHasChanges(true)
  }

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !session?.user) return

    // Validate file
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image must be under 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    setUploadingAvatar(true)

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Create file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        })

      if (uploadError) throw uploadError

      // Create signed URL for preview
      const { data: urlData, error: urlError } = await supabase.storage
        .from('profile-pictures')
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      if (urlError) throw urlError

      // Update state
      const avatarUrl = urlData.signedUrl
      setAvatarPreview(avatarUrl)
      handleInputChange('avatar_url', filePath) // Store the path, not the signed URL
      toast.success('Profile picture updated!')

    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error('Failed to upload image. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Play voice preview
  const playVoicePreview = async (voiceId: string) => {
    // Simple voice preview - voice manager removed
    if (playingVoice === voiceId) {
      // Stop currently playing voice
      setPlayingVoice(null)
      return
    }

    setPlayingVoice(voiceId)

    try {
      const voiceOption = VOICE_OPTIONS.find(v => v.id === voiceId)
      const speed = parseFloat(profile.voice_speed)

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Hello! I'm ${voiceOption?.name}. I'm here to support your law studies at Durham University with warmth and clarity.`,
          voice: voiceId,
          speed: speed
        })
      })

      if (!response.ok) throw new Error('TTS request failed')

      const arrayBuffer = await response.arrayBuffer()
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)

      const audio = new Audio(audioUrl)
      audio.onended = () => {
        setPlayingVoice(null)
        URL.revokeObjectURL(audioUrl)
      }
      audio.onerror = () => {
        setPlayingVoice(null)
        URL.revokeObjectURL(audioUrl)
        toast.error('Failed to play voice preview')
      }

      // Play audio directly (voice manager removed)
      await audio.play()

    } catch (error) {
      console.error('Voice preview error:', error)
      setPlayingVoice(null)
      toast.error('Unable to play voice preview')
    }
  }

  // Save profile
  const handleSave = async () => {
    if (!session?.user || !hasChanges) return

    setSaving(true)

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      const updateData: Partial<UserProfile> = {
        full_name: profile.full_name,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        durmah_voice: profile.durmah_voice,
        tts_voice: profile.durmah_voice, // Update legacy field for compatibility
        voice_speed: profile.voice_speed,
        voice_mode_enabled: profile.voice_mode_enabled,
        ai_safety_level: profile.ai_safety_level,
        feedback_reminder_opt_in: profile.feedback_reminder_opt_in,
        // Always With You settings
        parent1_email: profile.parent1_email,
        parent1_relationship: profile.parent1_relationship,
        parent1_display_name: profile.parent1_display_name,
        parent2_email: profile.parent2_email,
        parent2_relationship: profile.parent2_relationship,
        parent2_display_name: profile.parent2_display_name,
        sharing_settings: profile.sharing_settings,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', session.user.id)

      if (error) throw error

      setHasChanges(false)
      toast.success('Your preferences have been saved successfully! 🎉')
      
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ModernSidebar>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </ModernSidebar>
    )
  }

  const userTypeInfo = USER_TYPE_LABELS[profile.user_type as keyof typeof USER_TYPE_LABELS] || 
    { name: profile.user_type, color: 'bg-gray-100 text-gray-800' }

  return (
    <ModernSidebar>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Personalize your MyDurhamLaw experience</p>
            </div>
          </div>
          
          {hasChanges && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px] ${
                activeTab === 'profile'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px] ${
                activeTab === 'voice'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4" />
                <span>Voice</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('safety')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px] ${
                activeTab === 'safety'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Safety</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px] ${
                activeTab === 'family'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>Always With You</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Student Profile</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Avatar */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                      {avatarPreview ? (
                        <Image
                          src={avatarPreview}
                          alt="Profile"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400 text-white text-2xl font-bold">
                          {profile.display_name?.charAt(0) || profile.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors disabled:opacity-50"
                    >
                      {uploadingAvatar ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Click the camera icon to update your photo
                  </p>
                </div>
              </div>

              {/* Right Column - Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <Input
                    value={profile.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <Input
                    value={profile.display_name}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    placeholder="How should Durmah address you?"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is how Durmah and other features will refer to you
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    value={profile.email}
                    readOnly
                    className="w-full bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed from this page
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${userTypeInfo.color}`}>
                      {userTypeInfo.name}
                    </span>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        This cannot be changed. It is fixed based on your current academic year.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Voice Tab */}
        {activeTab === 'voice' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Volume2 className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Voice Mode Preferences</h2>
            </div>

            <div className="space-y-6">
              {/* Enable Voice Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div>
                  <h3 className="font-medium text-gray-900">Enable Voice Mode</h3>
                  <p className="text-sm text-gray-600">Allow Durmah to speak responses aloud</p>
                </div>
                <button
                  onClick={() => handleInputChange('voice_mode_enabled', !profile.voice_mode_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    profile.voice_mode_enabled ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profile.voice_mode_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Voice Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Durmah&apos;s Voice
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {VOICE_OPTIONS.map((voice) => (
                    <div
                      key={voice.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        profile.durmah_voice === voice.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => handleInputChange('durmah_voice', voice.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{voice.icon}</span>
                          <span className="font-medium text-gray-900">{voice.name}</span>
                          {profile.durmah_voice === voice.id && (
                            <Check className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            playVoicePreview(voice.id)
                          }}
                          variant="ghost"
                          size="sm"
                          disabled={!profile.voice_mode_enabled}
                          className="p-2"
                        >
                          {playingVoice === voice.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">{voice.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voice Speed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Playback Speed
                </label>
                <div className="flex gap-3">
                  {VOICE_SPEEDS.map((speed) => (
                    <button
                      key={speed.id}
                      onClick={() => handleInputChange('voice_speed', speed.id)}
                      className={`flex-1 p-3 text-center border-2 rounded-lg transition-all ${
                        profile.voice_speed === speed.id
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-medium">{speed.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{speed.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Safety Tab */}
        {activeTab === 'safety' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">AI Safety & Feedback</h2>
            </div>

            <div className="space-y-6">
              {/* AI Safety Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  AI Safety Level
                </label>
                <div className="space-y-3">
                  {AI_SAFETY_LEVELS.map((level) => (
                    <div
                      key={level.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        profile.ai_safety_level === level.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => handleInputChange('ai_safety_level', level.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{level.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{level.name}</span>
                            {profile.ai_safety_level === level.id && (
                              <Check className="w-4 h-4 text-purple-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback Reminder */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <h3 className="font-medium text-gray-900">Feedback Reminders</h3>
                  <p className="text-sm text-gray-600">Get reminded to rate AI responses for quality improvement</p>
                </div>
                <button
                  onClick={() => handleInputChange('feedback_reminder_opt_in', !profile.feedback_reminder_opt_in)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    profile.feedback_reminder_opt_in ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profile.feedback_reminder_opt_in ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Always With You Tab */}
        {activeTab === 'family' && (
        <div className="space-y-6">
          {/* Always With You Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-pink-600" />
                <h2 className="text-xl font-semibold text-gray-900">Always With You</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Stay connected with your loved ones during your law school journey. Set up secure access for up to 2 family members or close friends.
              </p>
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Heart className="w-5 h-5 text-pink-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-pink-800">Privacy First</h3>
                    <p className="text-sm text-pink-700 mt-1">
                      You have complete control over what information is shared. Your loved ones can only see what you explicitly choose to share.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loved Ones Setup */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Loved Ones</h3>
              
              {/* Parent 1 */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Loved One 1</span>
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={profile.parent1_email}
                      onChange={(e) => handleInputChange('parent1_email', e.target.value)}
                      placeholder="mum@example.com"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship
                    </label>
                    <Input
                      value={profile.parent1_relationship}
                      onChange={(e) => handleInputChange('parent1_relationship', e.target.value)}
                      placeholder="Mum, Dad, Guardian..."
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <Input
                      value={profile.parent1_display_name}
                      onChange={(e) => handleInputChange('parent1_display_name', e.target.value)}
                      placeholder="How they'll appear"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Parent 2 */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Loved One 2 (Optional)</span>
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={profile.parent2_email}
                      onChange={(e) => handleInputChange('parent2_email', e.target.value)}
                      placeholder="dad@example.com"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship
                    </label>
                    <Input
                      value={profile.parent2_relationship}
                      onChange={(e) => handleInputChange('parent2_relationship', e.target.value)}
                      placeholder="Dad, Partner, Friend..."
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <Input
                      value={profile.parent2_display_name}
                      onChange={(e) => handleInputChange('parent2_display_name', e.target.value)}
                      placeholder="How they'll appear"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sharing Settings */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What Can Your Loved Ones See?</h3>
              
              <div className="space-y-4">
                {/* Live Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <Eye className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Show Your Online Status</h4>
                        <p className="text-sm text-gray-600">Allow loved ones to see when you&apos;re online and your current activity</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSharingSettingsChange('show_live_status_to_parents', !profile.sharing_settings.show_live_status_to_parents)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        profile.sharing_settings.show_live_status_to_parents ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          profile.sharing_settings.show_live_status_to_parents ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {!profile.sharing_settings.show_live_status_to_parents && (
                    <div className="p-3 bg-blue-25 border border-blue-100 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700">
                          <strong>Privacy Mode:</strong> You&apos;ll stay logged in but appear offline to loved ones. However, you&apos;ll still see when they&apos;re online and can receive video calls from them.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Today's Calendar */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Today&apos;s Schedule</h4>
                      <p className="text-sm text-gray-600">Share your daily lectures, seminars, and study sessions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSharingSettingsChange('share_today_calendar', !profile.sharing_settings.share_today_calendar)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      profile.sharing_settings.share_today_calendar ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profile.sharing_settings.share_today_calendar ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Shared Notes */}
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Personal Updates</h4>
                      <p className="text-sm text-gray-600">Share notes about your studies, mood, and plans</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSharingSettingsChange('share_custom_notes', !profile.sharing_settings.share_custom_notes)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      profile.sharing_settings.share_custom_notes ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profile.sharing_settings.share_custom_notes ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Availability */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Availability</h3>
              
              <div className="space-y-4">
                {/* Do Not Disturb */}
                <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <EyeOff className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Do Not Disturb</h4>
                      <p className="text-sm text-gray-600">Temporarily hide from loved ones and disable video calls</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSharingSettingsChange('do_not_disturb', !profile.sharing_settings.do_not_disturb)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      profile.sharing_settings.do_not_disturb ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profile.sharing_settings.do_not_disturb ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Quiet Hours */}
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <Bell className="w-5 h-5 text-amber-600" />
                    <h4 className="font-medium text-gray-900">Quiet Hours</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Set hours when video calls are automatically disabled (you&apos;ll still appear online to loved ones)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <Input
                        type="time"
                        value={profile.sharing_settings.quiet_hours_start}
                        onChange={(e) => handleSharingSettingsChange('quiet_hours_start', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <Input
                        type="time"
                        value={profile.sharing_settings.quiet_hours_end}
                        onChange={(e) => handleSharingSettingsChange('quiet_hours_end', e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Instructions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How Your Loved Ones Access</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <p>They visit <code className="bg-gray-100 px-2 py-1 rounded">{getOrigin().replace(/^https?:\/\//, '')}/loved-one-login</code></p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <p>Enter the email address you&apos;ve added above</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <p>Access your dashboard based on your sharing preferences</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Security:</strong> Only the email addresses you add here can access your information. You can remove access at any time by clearing the email fields.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Save Button - Mobile */}
        {hasChanges && (
          <div className="md:hidden">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2 py-3"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving Your Preferences...' : 'Save Changes'}
            </Button>
          </div>
        )}

        {/* Success Message */}
        {!hasChanges && !loading && (
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">All changes saved</span>
            </div>
          </div>
        )}

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <div className="sticky bottom-4 left-4 right-4 md:relative md:bottom-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800">
                    You have unsaved changes. Don&apos;t forget to save your preferences!
                  </p>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 hidden md:flex"
                >
                  Save Now
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ModernSidebar>
  )
}

export async function getServerSideProps() {
  return { props: {} };
}