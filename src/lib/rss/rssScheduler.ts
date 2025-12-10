// RSS Scheduler - Automated twice-daily RSS fetching with intelligent caching
import { getSupabaseClient } from '@/lib/supabase/client'
import RSSLogger from './logger'

interface RSSCacheEntry {
  id: string
  source_name: string
  source_url: string
  articles: any[]
  last_fetched: string
  last_modified: string | null
  etag: string | null
  error_count: number
  status: 'active' | 'error' | 'disabled'
  metadata: {
    articlesCount: number
    successfulFetch: boolean
    errorMessage?: string
  }
}

export interface RSSScheduleLog {
  id: string
  scheduled_time: string
  execution_time: string
  status: 'success' | 'error' | 'partial'
  sources_processed: number
  articles_fetched: number
  error_details?: string
  uk_time: string
  execution_duration_ms: number
}

class RSSScheduler {
  private static instance: RSSScheduler
  private isRunning = false
  private logger: RSSLogger

  constructor() {
    this.logger = RSSLogger.getInstance()
  }

  static getInstance(): RSSScheduler {
    if (!RSSScheduler.instance) {
      RSSScheduler.instance = new RSSScheduler()
    }
    return RSSScheduler.instance
  }

  /**
   * Check if RSS content has changed using ETags and Last-Modified headers
   */
  private async hasRSSContentChanged(
    sourceUrl: string, 
    cachedEtag: string | null, 
    cachedLastModified: string | null
  ): Promise<{ changed: boolean; etag?: string; lastModified?: string }> {
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'MyDurhamLaw-RSS-Reader/2.0',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }

      // Add conditional headers to check for changes
      if (cachedEtag) {
        headers['If-None-Match'] = cachedEtag
      }
      if (cachedLastModified) {
        headers['If-Modified-Since'] = cachedLastModified
      }

      const response = await fetch(sourceUrl, {
        method: 'HEAD',
        headers,
      })

      // 304 means content hasn't changed
      if (response.status === 304) {
        return { changed: false }
      }

      return {
        changed: true,
        etag: response.headers.get('etag') || undefined,
        lastModified: response.headers.get('last-modified') || undefined
      }

    } catch (error: unknown) {
      console.error(`Failed to check RSS content change for ${sourceUrl}:`, error)
      // If we can't check, assume it has changed to be safe
      return { changed: true }
    }
  }

  /**
   * Get cached RSS data from Supabase
   */
  private async getCachedRSSData(): Promise<RSSCacheEntry[]> {
    const supabase = getSupabaseClient()
    if (!supabase) return []
    
    try {
      const { data, error } = await supabase
        .from('rss_cache')
        .select('*')
        .eq('status', 'active')
        .order('last_fetched', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: unknown) {
      console.error('Failed to get cached RSS data:', error)
      return []
    }
  }

  /**
   * Update RSS cache in Supabase
   */
  private async updateRSSCache(cacheEntry: Partial<RSSCacheEntry>): Promise<void> {
    const supabase = getSupabaseClient()
    if (!supabase) return
    
    try {
      const { error } = await supabase
        .from('rss_cache')
        .upsert({
          ...cacheEntry,
          last_fetched: new Date().toISOString()
        })

      if (error) throw error
    } catch (error: unknown) {
      console.error('Failed to update RSS cache:', error)
      throw error
    }
  }

  /**
   * Log RSS schedule execution to Supabase
   */
  private async logScheduleExecution(logEntry: Omit<RSSScheduleLog, 'id'>): Promise<void> {
    const supabase = getSupabaseClient()
    if (!supabase) return
    
    try {
      const { error } = await supabase
        .from('rss_schedule_logs')
        .insert(logEntry)

      if (error) throw error
    } catch (error: unknown) {
      console.error('Failed to log schedule execution:', error)
    }
  }

  /**
   * Fetch RSS articles with intelligent caching
   */
  async fetchRSSWithIntelligentCaching(): Promise<{
    success: boolean
    articlesProcessed: number
    sourcesProcessed: number
    errors: string[]
  }> {
    if (this.isRunning) {
      this.logger.warn('scheduler', 'RSS fetch already running, skipping duplicate request')
      return { success: false, articlesProcessed: 0, sourcesProcessed: 0, errors: ['Already running'] }
    }

    this.isRunning = true
    const startTime = Date.now()
    const ukTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date())

    let totalArticles = 0
    let sourcesProcessed = 0
    const errors: string[] = []

    try {
      this.logger.logScheduleExecution('started', { 
        ukTime, 
        scheduledFetch: true 
      })

      // Get current cached data
      const cachedData = await this.getCachedRSSData()
      this.logger.info('cache', `Found ${cachedData.length} cached RSS sources`)

      // RSS feeds configuration (same as original)
      const RSS_FEEDS = [
        { name: 'Law Gazette', url: 'https://www.lawgazette.co.uk/rss', sourceType: 'uk-legal' },
        { name: 'UK Ministry of Justice', url: 'https://www.gov.uk/government/organisations/ministry-of-justice.atom', sourceType: 'government' },
        { name: 'Legal Cheek', url: 'https://www.legalcheek.com/feed/', sourceType: 'uk-legal' },
        { name: 'UK Supreme Court', url: 'https://www.supremecourt.uk/rss/news.xml', sourceType: 'government' },
        { name: 'Durham University', url: 'https://www.durham.ac.uk/news/rss/', sourceType: 'durham' }
      ]

      // Process each RSS feed
      for (const feed of RSS_FEEDS) {
        try {
          const cachedEntry = cachedData.find(entry => entry.source_url === feed.url)
          
          // Check if content has changed
          const contentCheck = await this.hasRSSContentChanged(
            feed.url,
            cachedEntry?.etag || null,
            cachedEntry?.last_modified || null
          )

          if (!contentCheck.changed && cachedEntry) {
            this.logger.info(feed.name, 'Skipping - no content changes detected', {
              etag: cachedEntry.etag,
              lastModified: cachedEntry.last_modified
            })
            continue
          }

          this.logger.logFetchStart(feed.name, feed.url)

          // Call our existing RSS API to fetch fresh data
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/rss-news?source=${encodeURIComponent(feed.name)}`, {
            method: 'GET',
            headers: { 'User-Agent': 'MyDurhamLaw-Scheduler/2.0' }
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()
          if (!data.success) {
            throw new Error(data.error || 'RSS fetch failed')
          }

          // Update cache with fresh data
          await this.updateRSSCache({
            id: cachedEntry?.id || `${feed.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            source_name: feed.name,
            source_url: feed.url,
            articles: data.articles || [],
            etag: contentCheck.etag || null,
            last_modified: contentCheck.lastModified || null,
            error_count: 0,
            status: 'active',
            metadata: {
              articlesCount: data.articles?.length || 0,
              successfulFetch: true
            }
          })

          const articleCount = data.articles?.length || 0
          totalArticles += articleCount
          sourcesProcessed++
          
          this.logger.logFetchSuccess(feed.name, feed.url, articleCount)
          this.logger.logCacheOperation('update', feed.name, { 
            articleCount, 
            hasEtag: !!contentCheck.etag,
            hasLastModified: !!contentCheck.lastModified 
          })

        } catch (feedError: unknown) {
          const errorMessage = feedError instanceof Error ? feedError.message : String(feedError)
          const safeError = feedError instanceof Error ? feedError : new Error(String(feedError))
          
          this.logger.logFetchError(feed.name, feed.url, safeError)
          errors.push(`${feed.name}: ${errorMessage}`)

          // Update error count in cache
          const cachedEntry = cachedData.find(entry => entry.source_url === feed.url)
          if (cachedEntry) {
            try {
              await this.updateRSSCache({
                ...cachedEntry,
                error_count: (cachedEntry.error_count || 0) + 1,
                status: (cachedEntry.error_count || 0) >= 2 ? 'error' : 'active',
                metadata: {
                  ...cachedEntry.metadata,
                  successfulFetch: false,
                  errorMessage
                }
              })
            } catch (cacheError: unknown) {
              console.error('Failed to update error count in cache:', cacheError)
            }
          }
        }
      }

      const executionDuration = Date.now() - startTime
      const status = errors.length === 0 ? 'success' : (sourcesProcessed > 0 ? 'partial' : 'error')

      // Log the execution
      await this.logScheduleExecution({
        scheduled_time: new Date().toISOString(),
        execution_time: new Date().toISOString(),
        status,
        sources_processed: sourcesProcessed,
        articles_fetched: totalArticles,
        error_details: errors.length > 0 ? errors.join('; ') : undefined,
        uk_time: ukTime,
        execution_duration_ms: executionDuration
      })

      this.logger.logScheduleExecution('completed', {
        sourcesProcessed,
        totalArticles,
        errors: errors.length,
        executionDuration,
        ukTime
      })

      return {
        success: status !== 'error',
        articlesProcessed: totalArticles,
        sourcesProcessed,
        errors
      }

    } catch (criticalError: unknown) {
      const errorMessage = criticalError instanceof Error ? criticalError.message : String(criticalError)
      this.logger.error('scheduler', 'Critical error in RSS fetch', { error: errorMessage })
      this.logger.logScheduleExecution('failed', { 
        error: errorMessage, 
        ukTime,
        executionDuration: Date.now() - startTime
      })
      errors.push(`Critical error: ${errorMessage}`)

      // Log the failed execution
      try {
        await this.logScheduleExecution({
          scheduled_time: new Date().toISOString(),
          execution_time: new Date().toISOString(),
          status: 'error',
          sources_processed: sourcesProcessed,
          articles_fetched: totalArticles,
          error_details: errorMessage,
          uk_time: ukTime,
          execution_duration_ms: Date.now() - startTime
        })
      } catch (logError: unknown) {
        console.error('Failed to log critical error execution:', logError)
      }

      return {
        success: false,
        articlesProcessed: totalArticles,
        sourcesProcessed,
        errors
      }
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Get the last update timestamp from cache
   */
  async getLastUpdateTime(): Promise<Date | null> {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    
    try {
      const { data, error } = await supabase
        .from('rss_schedule_logs')
        .select('execution_time')
        .eq('status', 'success')
        .order('execution_time', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) return null
      return new Date(data.execution_time)
    } catch (error: unknown) {
      return null
    }
  }

  /**
   * Get RSS articles from cache for display
   */
  async getCachedArticlesForDisplay(filter?: string): Promise<any[]> {
    const supabase = getSupabaseClient()
    if (!supabase) return []
    
    try {
      const { data, error } = await supabase
        .from('rss_cache')
        .select('articles, source_name, last_fetched')
        .eq('status', 'active')
        .gte('last_fetched', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

      if (error) throw error

      // Flatten all articles from all sources
      const allArticles = data.flatMap(entry => 
        entry.articles.map((article: any) => ({
          ...article,
          cachedAt: entry.last_fetched
        }))
      )

      // Filter by source type if specified
      if (filter && filter !== 'all') {
        return allArticles.filter(article => article.sourceType === filter)
      }

      return allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    } catch (error: unknown) {
      console.error('Failed to get cached articles:', error)
      return []
    }
  }

  /**
   * Check if it's time for a scheduled fetch (6AM or 6PM UK time)
   */
  isScheduledFetchTime(): boolean {
    const now = new Date()
    const ukTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }))
    const hour = ukTime.getHours()
    const minute = ukTime.getMinutes()
    
    // Check if it's 6:00 AM or 6:00 PM UK time (with 5-minute window)
    return (hour === 6 && minute < 5) || (hour === 18 && minute < 5)
  }
}

export default RSSScheduler