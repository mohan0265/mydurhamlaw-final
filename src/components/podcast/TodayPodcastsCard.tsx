'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Play, Pause, Download, Clock, Calendar, RefreshCw, AlertCircle, Volume2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/supabase/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'

interface Podcast {
  id: string
  slot: 'pre' | 'post'
  title: string
  script: string
  audio_url: string
  created_at: string
  duration?: number
}

interface TodayPodcastsCardProps {
  className?: string
}

export const TodayPodcastsCard: React.FC<TodayPodcastsCardProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [generating, setGenerating] = useState<{ pre: boolean; post: boolean }>({ pre: false, post: false })

  // Fetch today's podcasts
  const fetchTodayPodcasts = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseClient()
      if (!supabase) return
      
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error: fetchError } = await supabase
        .from('podcasts')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: true })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setPodcasts(data || [])

    } catch (err) {
      console.error('Error fetching podcasts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load podcasts')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Generate podcast on demand
  const generatePodcast = async (slot: 'pre' | 'post') => {
    if (!user) return

    try {
      setGenerating(prev => ({ ...prev, [slot]: true }))
      setError(null)

      const response = await fetch('/api/podcast/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slot }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate podcast')
      }

      // Refresh podcasts list
      await fetchTodayPodcasts()

    } catch (err) {
      console.error(`Error generating ${slot} podcast:`, err)
      setError(err instanceof Error ? err.message : 'Failed to generate podcast')
    } finally {
      setGenerating(prev => ({ ...prev, [slot]: false }))
    }
  }

  // Audio playback controls
  const playPodcast = useCallback(async (podcast: Podcast) => {
    try {
      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause()
        setCurrentlyPlaying(null)
      }

      // If clicking the same podcast, just stop
      if (currentlyPlaying === podcast.id) {
        setCurrentAudio(null)
        return
      }

      const audio = new Audio(podcast.audio_url)
      audio.preload = 'auto'
      
      // Set up event listeners
      audio.onloadstart = () => console.log('🎵 Loading audio...')
      audio.oncanplay = () => console.log('🎵 Audio ready to play')
      audio.onended = () => {
        setCurrentlyPlaying(null)
        setCurrentAudio(null)
      }
      audio.onerror = (error) => {
        console.error('Audio playback error:', error)
        setError('Failed to play podcast audio')
        setCurrentlyPlaying(null)
        setCurrentAudio(null)
      }

      setCurrentAudio(audio)
      setCurrentlyPlaying(podcast.id)
      
      await audio.play()
      console.log('🔊 Playing podcast:', podcast.title)

    } catch (error) {
      console.error('Playback error:', error)
      setError('Failed to play podcast')
      setCurrentlyPlaying(null)
      setCurrentAudio(null)
    }
  }, [currentAudio, currentlyPlaying])

  const stopPodcast = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setCurrentAudio(null)
    }
    setCurrentlyPlaying(null)
  }, [currentAudio])

  // Download podcast
  const downloadPodcast = useCallback((podcast: Podcast) => {
    const link = document.createElement('a')
    link.href = podcast.audio_url
    link.download = `${podcast.slot}-podcast-${new Date().toISOString().split('T')[0]}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  // Load podcasts on mount
  useEffect(() => {
    fetchTodayPodcasts()
  }, [fetchTodayPodcasts])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        setCurrentAudio(null)
      }
    }
  }, [currentAudio])

  const prePodcast = podcasts.find(p => p.slot === 'pre')
  const postPodcast = podcasts.find(p => p.slot === 'post')

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', { timeZone: 'Europe/London', 
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const estimateDuration = (script: string) => {
    const wordCount = script.split(' ').length
    return Math.round(wordCount / 150 * 60) // Assuming 150 words per minute
  }

  return (
    <Card className={`${className} relative overflow-hidden`}>
      <CardContent className="p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">Today&apos;s Podcasts</h3>
              <p className="text-sm text-gray-600">Your daily law study briefings</p>
            </div>
          </div>
          
          <Button
            onClick={fetchTodayPodcasts}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 min-h-[40px]"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Podcasts List */}
        {!loading && (
          <div className="space-y-4">
            
            {/* Morning Podcast */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">AM</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">Morning Briefing</h4>
                  {prePodcast && (
                    <span className="text-xs text-gray-500">
                      • {formatTime(prePodcast.created_at)} • {estimateDuration(prePodcast.script)}s
                    </span>
                  )}
                </div>
              </div>

              {prePodcast ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 line-clamp-2">{prePodcast.title}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => playPodcast(prePodcast)}
                      size="sm"
                      className="flex items-center gap-2 min-h-[36px]"
                    >
                      {currentlyPlaying === prePodcast.id ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Play
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => downloadPodcast(prePodcast)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 min-h-[36px]"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Start your day with a personalized law briefing</p>
                  <Button
                    onClick={() => generatePodcast('pre')}
                    size="sm"
                    className="flex items-center gap-2 min-h-[36px]"
                    disabled={generating.pre}
                  >
                    {generating.pre ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Generate Morning Podcast
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Evening Podcast */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">PM</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">Evening Reflection</h4>
                  {postPodcast && (
                    <span className="text-xs text-gray-500">
                      • {formatTime(postPodcast.created_at)} • {estimateDuration(postPodcast.script)}s
                    </span>
                  )}
                </div>
              </div>

              {postPodcast ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 line-clamp-2">{postPodcast.title}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => playPodcast(postPodcast)}
                      size="sm"
                      className="flex items-center gap-2 min-h-[36px]"
                    >
                      {currentlyPlaying === postPodcast.id ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Play
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => downloadPodcast(postPodcast)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 min-h-[36px]"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">End your day with reflection and planning</p>
                  <Button
                    onClick={() => generatePodcast('post')}
                    size="sm"
                    className="flex items-center gap-2 min-h-[36px]"
                    disabled={generating.post}
                  >
                    {generating.post ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Generate Evening Podcast
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Auto-generated daily at 6:30 AM & 6:00 PM Singapore time</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TodayPodcastsCard