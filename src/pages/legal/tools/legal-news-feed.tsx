'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import { 
  ArrowLeft,
  BookOpen, 
  Clock, 
  ExternalLink, 
  Heart, 
  MessageSquare, 
  Newspaper, 
  RefreshCw, 
  Volume2, 
  VolumeX 
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { SmartNewsAgent } from '@/components/news/SmartNewsAgent'
import { useAuth } from '@/lib/supabase/AuthContext'
import { CollapsibleText } from '@/components/ui/CollapsibleText'
import { getSupabaseClient } from '@/lib/supabase/client'
// Durmah config removed - using default audio settings
// import { useVoiceManager } from '@/lib/context/VoiceManagerContext' // Removed - using DurmahContext

interface RSSNewsItem {
  id: string
  title: string
  summary: string
  url: string
  source: string
  sourceType: 'durham' | 'uk-legal' | 'government'
  publishedAt: string
  topicTags: string[]
  content?: string
}

type SourceFilter = 'all' | 'durham' | 'uk-legal' | 'government'

interface SourceFilterOption {
  value: SourceFilter
  label: string
  icon: string
  description: string
}

const SOURCE_FILTERS: SourceFilterOption[] = [
  {
    value: 'all',
    label: 'All Sources',
    icon: '🌐',
    description: 'All legal news from UK sources'
  },
  {
    value: 'durham',
    label: 'Durham Only',
    icon: '📘',
    description: 'Durham University news and updates'
  },
  {
    value: 'uk-legal',
    label: 'UK Legal Only',
    icon: '⚖️',
    description: 'UK legal profession and court news'
  },
  {
    value: 'government',
    label: 'Government Only',
    icon: '🏛️',
    description: 'UK government and policy updates'
  }
]

export default function LegalNewsFeedPage() {
  const router = useRouter()
  const { user, userProfile } = useAuth()
  // const voiceManager = useVoiceManager() // Removed - using DurmahContext
  const voiceManager = useMemo(() => ({
    isCurrentlyPlaying: (...args: any[]) => false,
    stopAudio: (...args: any[]) => {},
    canPlayAudio: (...args: any[]) => true,
    getPlayingStatus: () => ({ source: 'none' }),
    startAudio: (...args: any[]) => true
  }), []); // Temporary stub wrapped in useMemo
  
  // Debug mode for RSS testing
  const [debugMode] = useState(() => 
    typeof window !== 'undefined' && window.location.search.includes('debug=true')
  )
  
  // Core state
  const [articles, setArticles] = useState<RSSNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<RSSNewsItem | null>(null)
  const [savedArticles, setSavedArticles] = useState<string[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [sourceMetadata, setSourceMetadata] = useState<any>(null)
  const [cacheStatus, setCacheStatus] = useState<string>('loading')
  
  // Source filtering state
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')

  // Add animations and scrollbar CSS
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideInFromLeft {
        0% { opacity: 0; transform: translateX(-20px); }
        100% { opacity: 1; transform: translateX(0); }
      }
      .animate-slideIn {
        animation: slideInFromLeft 0.6s ease-out forwards;
        animation-delay: var(--animation-delay, 0s);
      }
      
      /* Custom scrollbar styling for analysis panel */
      .smart-analysis-panel::-webkit-scrollbar {
        width: 6px;
      }
      .smart-analysis-panel::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
      }
      .smart-analysis-panel::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
        transition: background 0.2s ease;
      }
      .smart-analysis-panel::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
      .smart-analysis-panel {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 #f1f5f9;
        position: relative;
      }
      
      /* Scroll indicator gradient */
      .smart-analysis-panel::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 6px;
        height: 20px;
        background: linear-gradient(transparent, rgba(255, 255, 255, 0.8));
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .smart-analysis-panel:hover::after {
        opacity: 1;
      }
    `
    document.head.appendChild(style)
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

  // Fetch live RSS feeds using API route with source filtering
  const fetchLiveRSSNews = useCallback(async (filter: SourceFilter = 'all'): Promise<{articles: RSSNewsItem[], metadata: any}> => {
    console.log(`📡 Fetching live RSS feeds with filter: ${filter}...`)
    
    try {
      const url = `/api/rss-news${filter !== 'all' ? `?filter=${filter}` : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`RSS API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch live RSS feeds')
      }

      console.log('✅ Successfully fetched', data.articles?.length || 0, 'articles from', data.feedsProcessed, 'sources')
      return {
        articles: data.articles || [],
        metadata: {
          feedsProcessed: data.feedsProcessed,
          totalSources: data.totalSources,
          sourceBreakdown: data.sourceBreakdown,
          timestamp: data.timestamp,
          lastUpdate: data.lastUpdate,
          cacheStatus: data.cacheStatus,
          smartCacheEnabled: data.smartCacheEnabled
        }
      }
      
    } catch (error) {
      console.error('🚨 Live RSS fetch error:', error)
      throw error
    }
  }, [])

  // Load live RSS news articles with source filtering
  const loadLiveNewsArticles = useCallback(async (filter: SourceFilter = sourceFilter) => {
    try {
      setLoading(true)
      setError(null)
      
      if (debugMode) {
        console.log(`🔧 Debug: Loading live RSS feeds with filter: ${filter}...`)
      }
      
      // Fetch RSS feeds with intelligent caching
      const { articles: liveArticles, metadata } = await fetchLiveRSSNews(filter)
      
      // Sort by publication date (newest first)
      liveArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      
      setArticles(liveArticles)
      setSourceMetadata(metadata)
      setLastRefresh(new Date())
      
      // Set last update time if provided from cache
      if (metadata.lastUpdate) {
        setLastUpdate(new Date(metadata.lastUpdate))
      }
      
      // Set cache status
      setCacheStatus(metadata.cacheStatus || 'live')
      
      if (debugMode) {
        console.log('🔧 Debug: Live articles loaded:', liveArticles.length)
        console.log('🔧 Debug: Source breakdown:', metadata.sourceBreakdown)
      }
      
    } catch (err: any) {
      console.error('🚨 Error loading live RSS articles:', err)
      setError(err.message || 'Failed to load live RSS feeds')
      setArticles(getEmergencyFallbackArticles())
    } finally {
      setLoading(false)
    }
  }, [fetchLiveRSSNews, sourceFilter, debugMode])

  // Emergency fallback when all RSS feeds fail
  const getEmergencyFallbackArticles = (): RSSNewsItem[] => [
    {
      id: 'emergency-fallback-1',
      title: 'Live RSS Feeds Temporarily Unavailable',
      summary: 'We are experiencing temporary difficulties accessing live RSS feeds from our trusted sources. Please try refreshing in a few minutes.',
      url: '#',
      source: 'MyDurhamLaw System',
      sourceType: 'government',
      publishedAt: new Date().toISOString(),
      topicTags: ['System', 'Notice'],
      content: 'Our live RSS aggregation service is temporarily unavailable. This may be due to network connectivity or external source maintenance.'
    },
    {
      id: 'emergency-fallback-2',
      title: 'Direct Access to Legal Sources',
      summary: 'Access legal news directly from Law Gazette, UK Supreme Court, and other trusted sources.',
      url: 'https://www.lawgazette.co.uk',
      source: 'Law Gazette',
      sourceType: 'uk-legal',
      publishedAt: new Date().toISOString(),
      topicTags: ['Legal', 'Resources'],
      content: 'Visit trusted legal news sources directly for the most current information on UK legal developments.'
    }
  ]

  // Load saved articles for the user
  const loadSavedArticles = useCallback(async () => {
    if (!user) return
    
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.warn('Supabase client not available for saved articles')
        return
      }

      const { data } = await supabase
        .from('saved_articles')
        .select('article_id')
        .eq('user_id', user.id)
      
      if (data) {
        setSavedArticles(data.map(item => item.article_id))
      }
    } catch (error) {
      // Silent fail for saved articles
      console.warn('Failed to load saved articles:', error)
    }
  }, [user])

  // Handle "Get AI Analysis" button click - opens Durmah with article context
  const handleAIAnalysisClick = useCallback(async (article: RSSNewsItem) => {
    try {
      // 1. Log interest event to Supabase
      const interestPayload = {
        event_type: 'news_ai_analysis_clicked',
        source: 'legal_news',
        title: article.title,
        url: article.url,
        snippet: article.summary || article.content?.substring(0, 300),
        tags: article.topicTags || [article.sourceType]
      };

      console.log('[News] Logging interest event:', interestPayload);

      await fetch('/api/durmah/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(interestPayload)
      }).catch(err => {
        // Silent fail for analytics - don't block main flow
        console.warn('[News] Failed to log interest event:', err);
      });

      // 2. Build analysis message for Durmah
      const analysisMessage = `Please analyze this news item for my Durham Law studies.

**Title**: ${article.title}
**Source**: ${article.source || article.sourceType}
**URL**: ${article.url}
${article.summary ? `**Summary**: ${article.summary}` : ''}

Tell me:
1. A 5-bullet summary in plain English
2. Key legal concepts involved
3. How this could be used in an essay (with 2-3 angles)
4. A "cite safely" reminder

**Important**: Analyze only the information provided above. Do not invent additional facts or details beyond what I've shared.`;

      // 3. Open Durmah widget and inject message
      console.log('[News] Opening Durmah with analysis request');
      
      window.postMessage({
        type: 'OPEN_DURMAH',
        payload: {
          mode: 'study',
          autoMessage: analysisMessage
        }
      }, '*');

      // 4. Visual feedback - clear selectedArticle to avoid confusion
      setSelectedArticle(null);

    } catch (err) {
      console.error('[News] Error in handleAIAnalysisClick:', err);
    }
  }, [])

  // Enhanced play article with voice manager integration and toggle behavior
  const playArticle = useCallback(async (article: RSSNewsItem) => {
    // Check if this article is currently playing - if so, stop it (toggle behavior)
    if (voiceManager.isCurrentlyPlaying('news', article.id)) {
      console.log('🛑 Stopping currently playing article:', article.title)
      voiceManager.stopAudio()
      return
    }

    // Check if we can play audio (respects voice priority hierarchy)
    if (!voiceManager.canPlayAudio('news')) {
      const currentStatus = voiceManager.getPlayingStatus()
      if (currentStatus.source === 'durmah') {
        // Show tooltip or alert for Durmah priority
        alert('Voice assistant active. Please wait for Durmah to finish.')
        return
      } else {
        // Stop other audio and proceed
        voiceManager.stopAudio(true)
      }
    }
    
    try {
      // Enhanced text content: title + full summary + closing phrase
      const fullSummary = article.content || article.summary || 'No content available'
      const textToSpeak = [
        article.title,
        fullSummary,
        "Click the link above to read the full article from the original source."
      ].join('. ')
      
      // Use default audio config
      const audioConfig = { voice: 'nova', speed: 1.0, volume: 0.8 }
      
      console.log('🔊 Generating audio for:', article.title.substring(0, 50) + '...')
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: textToSpeak,
          voice: audioConfig.voice,
          speed: audioConfig.speed
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate speech: ${response.status} ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)
      
      console.log('🎵 Audio generated, preparing playback...')
      
      // Create fresh Audio instance to avoid memory conflicts
      const audio = new Audio()
      audio.preload = 'auto'
      audio.volume = audioConfig.volume
      audio.src = audioUrl

      // Load the audio data
      audio.load()
      
      // Wait for audio to be ready and add intentional delay for proper initialization
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Audio loading timeout'))
        }, 10000) // 10 second timeout
        
        audio.oncanplaythrough = () => {
          clearTimeout(timeoutId)
          resolve(true)
        }
        
        audio.onerror = () => {
          clearTimeout(timeoutId)
          reject(new Error('Audio loading failed'))
        }
      })
      
      // Add 1-second intentional delay for proper audio initialization
      console.log('⏳ Adding 1-second delay for optimal audio startup...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Register with voice manager BEFORE starting playback
      const success = voiceManager.startAudio('news', article.id, audio)
      if (!success) {
        console.warn('🚫 Voice manager rejected audio start request')
        URL.revokeObjectURL(audioUrl)
        return
      }
      
      // Start playback from the beginning
      audio.currentTime = 0
      console.log('🔊 Starting audio playback from beginning')
      await audio.play()
      
    } catch (error) {
      console.error('🚨 Enhanced audio playback error:', error)
      voiceManager.stopAudio() // Clean up voice manager state
      alert(`Unable to play audio: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    }
  }, [voiceManager, userProfile])

  // Save/unsave article functions
  const toggleSaveArticle = useCallback(async (article: RSSNewsItem) => {
    if (!user) {
      alert('Please log in to save articles')
      return
    }

    const isSaved = savedArticles.includes(article.id)
    
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      if (isSaved) {
        const { error } = await supabase
          .from('saved_articles')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', article.id)

        if (error) throw error
        setSavedArticles(prev => prev.filter(id => id !== article.id))
      } else {
        const { error } = await supabase
          .from('saved_articles')
          .insert([{
            user_id: user.id,
            article_id: article.id,
            article_data: article,
          }])

        if (error) throw error
        setSavedArticles(prev => [...prev, article.id])
      }
    } catch (error) {
      console.error('Save article error:', error)
    }
  }, [user, savedArticles])

  // Filter articles based on source filter (already filtered server-side, but applying client-side for consistency)
  const filteredArticles = sourceFilter === 'all' ? articles : articles.filter(article => article.sourceType === sourceFilter)

  // Utility functions - enhanced time formatting
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} mins ago`
    if (diffHours === 1) return '1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    
    const diffWeeks = Math.floor(diffDays / 7)
    if (diffWeeks === 1) return '1 week ago'
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`
    
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getTagColor = (tag: string, sourceType: string = 'uk-legal') => {
    // Source-specific color schemes
    if (sourceType === 'durham') {
      const durhamColors: Record<string, string> = {
        'Student': 'bg-purple-100 text-purple-800',
        'Research': 'bg-indigo-100 text-indigo-800',
        'Campus': 'bg-blue-100 text-blue-800',
        'Events': 'bg-green-100 text-green-800',
        'University': 'bg-purple-100 text-purple-800'
      }
      return durhamColors[tag] || 'bg-purple-100 text-purple-800'
    }
    
    if (sourceType === 'government') {
      const govColors: Record<string, string> = {
        'Policy': 'bg-indigo-100 text-indigo-800',
        'Government': 'bg-blue-100 text-blue-800',
        'Court': 'bg-red-100 text-red-800',
        'Breaking': 'bg-red-200 text-red-900'
      }
      return govColors[tag] || 'bg-indigo-100 text-indigo-800'
    }
    
    // UK Legal colors
    const legalColors: Record<string, string> = {
      'Court': 'bg-red-100 text-red-800',
      'Criminal': 'bg-orange-100 text-orange-800',
      'Civil': 'bg-blue-100 text-blue-800',
      'Commercial': 'bg-green-100 text-green-800',
      'Employment': 'bg-yellow-100 text-yellow-800',
      'Property': 'bg-cyan-100 text-cyan-800',
      'Family': 'bg-pink-100 text-pink-800',
      'Technology': 'bg-purple-100 text-purple-800',
      'Human Rights': 'bg-emerald-100 text-emerald-800',
      'Legal': 'bg-slate-100 text-slate-800',
      'Breaking': 'bg-red-200 text-red-900',
      'Important': 'bg-amber-200 text-amber-900'
    }
    return legalColors[tag] || 'bg-gray-100 text-gray-800'
  }

  // Removed auto-refresh - now handled by automated twice-daily system
  // RSS feeds are automatically updated at 6AM and 6PM Singapore time

  // Load data on mount and when source filter changes
  useEffect(() => {
    loadLiveNewsArticles()
    if (user) {
      loadSavedArticles()
    }
  }, [loadLiveNewsArticles, loadSavedArticles, user])

  // Handle source filter changes
  const handleSourceFilterChange = useCallback((newFilter: SourceFilter) => {
    setSourceFilter(newFilter)
    loadLiveNewsArticles(newFilter)
  }, [loadLiveNewsArticles])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
              <div 
                className="absolute inset-0 w-24 h-24 border-4 border-transparent border-r-pink-400 rounded-full animate-spin mx-auto" 
                style={{animationDirection: 'reverse', animationDuration: '1.5s'} as React.CSSProperties}
              ></div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Loading Live Legal News
              </h2>
              <p className="text-lg text-gray-700 max-w-md mx-auto">
                Fetching latest updates from Law Gazette, UK Supreme Court, Ministry of Justice, Durham University and more...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0 sm:justify-between mb-4 sm:mb-8">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-slate-100 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base min-h-[44px] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">← Dashboard</span>
            <span className="sm:hidden">← Back</span>
          </Button>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Source Filter Dropdown */}
            <div className="relative">
              <select
                value={sourceFilter}
                onChange={(e) => handleSourceFilterChange(e.target.value as SourceFilter)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[44px] w-full sm:w-auto"
              >
                {SOURCE_FILTERS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Removed manual refresh - now automated twice daily */}
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border min-h-[44px]">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Auto-updated</span>
              <span className="text-xs">twice daily</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 relative px-2 sm:px-0">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl">
                <Newspaper className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-30 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Live Legal News
              </h1>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-base sm:text-lg text-gray-600">
                <span className={`w-2 h-2 rounded-full ${
                  cacheStatus === 'cached' ? 'bg-blue-500' : 
                  cacheStatus === 'live' ? 'bg-green-500 animate-pulse' : 
                  cacheStatus === 'emergency-cache' ? 'bg-orange-500' : 'bg-gray-500'
                }`}></span>
                <span>
                  {cacheStatus === 'cached' ? 'Smart Cache' : 
                   cacheStatus === 'live' ? 'Live RSS' : 
                   cacheStatus === 'emergency-cache' ? 'Emergency Cache' : 'Loading'} • {SOURCE_FILTERS.find(f => f.value === sourceFilter)?.label}
                </span>
                {lastUpdate && (
                  <span className="text-sm text-gray-500 text-center">
                    • Last updated {formatTimeAgo(lastUpdate.toISOString())}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 border border-purple-200/50 shadow-lg">
            <p className="text-gray-700 text-base sm:text-lg font-medium italic text-center">
              &ldquo;Curated legal news from trusted sources, automatically updated twice daily at 6AM and 6PM Singapore time.&rdquo;
            </p>
            {sourceMetadata && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 mt-4 text-sm text-gray-600">
                <span>📊 {sourceMetadata.feedsProcessed} sources active</span>
                <span>📰 {articles.length} articles loaded</span>
                <span>🤖 {cacheStatus === 'cached' ? 'Smart cached' : cacheStatus === 'live' ? 'Live fetched' : 'System'}</span>
                {sourceMetadata.sourceBreakdown && (
                  <span className="text-center">🎯 {sourceFilter !== 'all' ? `${SOURCE_FILTERS.find(f => f.value === sourceFilter)?.label} filter` : 'All sources'}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Newspaper className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800">Unable to Load Live RSS Feeds</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                  {debugMode && (
                    <div className="mt-2 p-3 bg-red-100 rounded text-xs">
                      <strong>Debug Info:</strong><br />
                      Live RSS Sources: {sourceMetadata?.feedsProcessed || 0}<br />
                      Current Filter: {sourceFilter}<br />
                      <button 
                        onClick={() => console.log('Source metadata:', sourceMetadata)}
                        className="mt-1 px-2 py-1 bg-red-200 rounded"
                      >
                        Log Metadata
                      </button>
                    </div>
                  )}
                </div>
                <div className="ml-auto text-xs text-red-600">
                  System will auto-retry at next scheduled update
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {debugMode && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-blue-800 mb-3">🔧 Live RSS Debug Panel</h3>
              <div className="text-sm space-y-2">
                <div>Active RSS Sources: {sourceMetadata?.feedsProcessed || 0}</div>
                <div>Total Articles: {articles.length}</div>
                <div>Durham Articles: {sourceMetadata?.sourceBreakdown?.durham || 0}</div>
                <div>UK Legal Articles: {sourceMetadata?.sourceBreakdown?.ukLegal || 0}</div>
                <div>Government Articles: {sourceMetadata?.sourceBreakdown?.government || 0}</div>
                <div>Current Filter: {SOURCE_FILTERS.find(f => f.value === sourceFilter)?.label}</div>
                <div>Filtered Articles: {filteredArticles.length}</div>
                <div>Loading State: {loading ? 'Loading...' : 'Complete'}</div>
                <div>Last Refresh: {lastRefresh?.toLocaleTimeString() || 'Never'}</div>
                <div>Error State: {error || 'None'}</div>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => window.open('?debug=false', '_self')}
                    className="px-3 py-1 bg-blue-200 rounded min-h-[44px]"
                  >
                    Disable Debug
                  </button>
                  <button 
                    onClick={() => {
                      console.log('🧪 Testing Live RSS API...')
                      fetchLiveRSSNews(sourceFilter)
                        .then(({articles, metadata}) => console.log('✅ Live RSS Test Success:', {articles: articles.length, metadata}))
                        .catch(error => console.error('❌ Live RSS Test Failed:', error))
                    }}
                    className="px-3 py-1 bg-green-200 rounded min-h-[44px]"
                  >
                    Test Live RSS
                  </button>
                  <button 
                    onClick={() => {
                      console.log('📊 Articles by Source:', {
                        durham: articles.filter(a => a.sourceType === 'durham').map(a => ({title: a.title, source: a.source})),
                        ukLegal: articles.filter(a => a.sourceType === 'uk-legal').map(a => ({title: a.title, source: a.source})),
                        government: articles.filter(a => a.sourceType === 'government').map(a => ({title: a.title, source: a.source}))
                      })
                    }}
                    className="px-3 py-1 bg-yellow-200 rounded min-h-[44px]"
                  >
                    Log Articles
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* News Articles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Articles List */}
          <div className="lg:col-span-2 space-y-6">
            {filteredArticles.map((article, index) => (
              <Card 
                key={article.id} 
                className={`hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border-l-4 ${
                  article.sourceType === 'durham'
                    ? 'border-l-purple-600 bg-purple-50/50' 
                    : article.sourceType === 'government'
                    ? 'border-l-indigo-600 bg-indigo-50/50'
                    : 'border-l-blue-500 bg-white/90'
                } backdrop-blur-sm animate-slideIn`}
                style={{ '--animation-delay': `${index * 0.1}s` } as React.CSSProperties}
              >
                <CardContent className="p-4 sm:p-6">
                  
                  {/* Article Header */}
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3 sm:gap-0">
                    <div className="flex-1 w-full sm:w-auto">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 leading-tight">
                        {article.title}
                      </h2>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTimeAgo(article.publishedAt)}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-lg">
                            {article.sourceType === 'durham' && '📘'}
                            {article.sourceType === 'government' && '🏛️'}
                            {article.sourceType === 'uk-legal' && '⚖️'}
                          </span>
                          <span className="text-sm sm:text-base">{article.source}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            article.sourceType === 'durham' ? 'bg-purple-100 text-purple-700' :
                            article.sourceType === 'government' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {SOURCE_FILTERS.find(f => f.value === article.sourceType)?.label.replace(' Only', '')}
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-4">
                      <button
                        onClick={() => toggleSaveArticle(article)}
                        className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                          savedArticles.includes(article.id)
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${savedArticles.includes(article.id) ? 'fill-current' : ''}`} />
                      </button>
                      
                      {article.url !== '#' && (
                        <div className="relative group">
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Read full article at source"
                            className="flex items-center gap-1 p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px]"
                            title="Read full article at source"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-xs font-medium hidden sm:inline">Full Article</span>
                          </a>
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            Read Full Article at Source
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Topic Tags */}
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
                    {article.topicTags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getTagColor(tag, article.sourceType)}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="mb-4">
                    <CollapsibleText
                      maxLines={3}
                      className="text-sm sm:text-base text-gray-700 leading-relaxed"
                      showMoreText="Read Full Summary"
                      showLessText="Show Less"
                      buttonClassName="text-blue-600 hover:text-blue-800 font-medium"
                      gradientClassName="from-white to-transparent"
                    >
                      {article.summary}
                    </CollapsibleText>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-4 border-t border-gray-100">
                    <Button
                      onClick={() => handleAIAnalysisClick(article)}
                      className="flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span className="hidden sm:inline">Get AI Analysis</span>
                      <span className="sm:hidden">AI Analysis</span>
                    </Button>
                    
                    <Button
                      onClick={() => playArticle(article)}
                      variant="outline"
                      className="flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
                      disabled={loading || (!voiceManager.canPlayAudio('news') && !voiceManager.isCurrentlyPlaying('news', article.id))}
                      title={
                        !voiceManager.canPlayAudio('news') && !voiceManager.isCurrentlyPlaying('news', article.id)
                          ? 'Voice assistant active. Please wait for Durmah to finish.'
                          : undefined
                      }
                    >
                      {voiceManager.isCurrentlyPlaying('news', article.id) ? (
                        <>
                          <VolumeX className="w-4 h-4" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          Listen
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Ask Durmah Link */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        const topic = encodeURIComponent(article.title.substring(0, 100))
                        router.push(`/dashboard?topic=${topic}`)
                      }}
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors min-h-[44px] py-2 w-full text-left"
                    >
                      💬 Ask Durmah about this article
                    </button>
                  </div>

                </CardContent>
              </Card>
            ))}

            {filteredArticles.length === 0 && !loading && (
              <Card>
                <CardContent className="p-6 sm:p-12 text-center">
                  <Newspaper className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                    No {SOURCE_FILTERS.find(f => f.value === sourceFilter)?.label} Articles Found
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500">
                    No articles available for the selected filter. Try changing the source filter or refreshing the feeds.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Smart Analysis Panel with Independent Scrolling */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 sm:top-8 max-h-[60vh] sm:max-h-[70vh] lg:max-h-[75vh] xl:max-h-[80vh] overflow-y-auto pr-2 scroll-smooth smart-analysis-panel" style={{ scrollbarGutter: 'stable' }}>
              {selectedArticle ? (
                <SmartNewsAgent 
                  article={selectedArticle} 
                  onAnalysisComplete={() => {
                    // Analysis complete
                  }}
                />
              ) : (
                <Card>
                  <CardContent className="p-6 sm:p-8 text-center">
                    <BookOpen className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                      AI Legal Analysis
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Click &ldquo;Get AI Analysis&rdquo; on any article to receive intelligent insights about its relevance to your law studies, 
                      discussion questions, and connections to legal modules.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">{articles.length}</div>
              <p className="text-sm sm:text-base text-gray-600">Total Articles</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">
                {sourceMetadata?.sourceBreakdown?.durham || 0}
              </div>
              <p className="text-sm sm:text-base text-gray-600">📘 Durham News</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-pink-600 mb-2">{savedArticles.length}</div>
              <p className="text-sm sm:text-base text-gray-600">💾 Saved Articles</p>
            </CardContent>
          </Card>
        </div>

        {/* Debug Mode Help */}
        {!debugMode && error && (
          <div className="mt-6 sm:mt-8 text-center px-4">
            <p className="text-sm text-gray-500">
              Having issues with the live RSS feeds? {' '}
              <button 
                onClick={() => window.open('?debug=true', '_self')}
                className="text-purple-600 hover:text-purple-800 underline min-h-[44px] py-2"
              >
                Enable debug mode
              </button>
              {' '} to see detailed error information.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}