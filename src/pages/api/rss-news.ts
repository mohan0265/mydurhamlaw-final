// Enhanced RSS News API Route - Smart caching with twice-daily automated updates
import type { NextApiRequest, NextApiResponse } from 'next'
import Parser from 'rss-parser'
import RSSScheduler from '@/lib/rss/rssScheduler'

export interface RSSArticle {
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

interface RSSFeedConfig {
  name: string
  url: string
  sourceType: 'durham' | 'uk-legal' | 'government'
  category: string
  enabled: boolean
}

const RSS_FEEDS: RSSFeedConfig[] = [
  {
    name: 'Law Gazette',
    url: 'https://www.lawgazette.co.uk/rss',
    sourceType: 'uk-legal',
    category: 'Legal News',
    enabled: true
  },
  {
    name: 'UK Ministry of Justice',
    url: 'https://www.gov.uk/government/organisations/ministry-of-justice.atom',
    sourceType: 'government',
    category: 'Government',
    enabled: true
  },
  {
    name: 'Legal Cheek',
    url: 'https://www.legalcheek.com/feed/',
    sourceType: 'uk-legal',
    category: 'Legal News',
    enabled: true
  },
  {
    name: 'UK Supreme Court',
    url: 'https://www.supremecourt.uk/rss/news.xml',
    sourceType: 'government',
    category: 'Court News',
    enabled: true
  },
  {
    name: 'Durham University',
    url: 'https://www.durham.ac.uk/news/rss/',
    sourceType: 'durham',
    category: 'Durham News',
    enabled: true
  },
  {
    name: 'Scottish Legal',
    url: 'https://www.scottishlegal.com/feed',
    sourceType: 'uk-legal',
    category: 'Legal News',
    enabled: false // Fallback source
  }
]

// Cache for RSS feeds (10 minutes for live feeds)
interface CacheEntry {
  data: RSSArticle[]
  timestamp: number
}

const feedCache = new Map<string, CacheEntry>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes for real RSS feeds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { filter, source, force } = req.query // Enhanced filtering and force refresh

  try {
    const scheduler = RSSScheduler.getInstance()
    
    // Check if we should use cached data or force a fresh fetch
    const forceFresh = force === 'true' || source // Force fresh for specific source requests
    
    if (!forceFresh) {
      // Try to serve from intelligent cache first
      console.log('📚 Attempting to serve from intelligent cache...')
      const cachedArticles = await scheduler.getCachedArticlesForDisplay(filter as string)
      const lastUpdate = await scheduler.getLastUpdateTime()
      
      if (cachedArticles.length > 0) {
        console.log(`✅ Serving ${cachedArticles.length} articles from intelligent cache`)
        
        return res.status(200).json({
          success: true,
          articles: cachedArticles,
          feedsProcessed: 5, // Number of configured sources
          totalSources: RSS_FEEDS.length,
          sourceBreakdown: {
            durham: cachedArticles.filter(a => a.sourceType === 'durham').length,
            ukLegal: cachedArticles.filter(a => a.sourceType === 'uk-legal').length,
            government: cachedArticles.filter(a => a.sourceType === 'government').length
          },
          timestamp: new Date().toISOString(),
          lastUpdate: lastUpdate?.toISOString(),
          cacheStatus: 'cached'
        })
      }
    }

    // Fallback to live RSS fetching if cache is empty or force refresh requested
    console.log('📡 Cache miss or force refresh - fetching live RSS feeds...')
    
    const parser = new Parser({
      customFields: {
        item: ['description', 'content', 'contentSnippet', 'summary', 'content:encoded']
      },
      timeout: 15000, // Increased timeout for reliability
      headers: {
        'User-Agent': 'MyDurhamLaw-RSS-Reader/2.0 (Smart-Cache)'
      }
    })

    const allArticles: RSSArticle[] = []
    let enabledFeeds = RSS_FEEDS.filter(feed => feed.enabled)
    
    // Apply filter if specified
    if (filter && filter !== 'all') {
      enabledFeeds = enabledFeeds.filter(feed => feed.sourceType === filter)
    }
    
    // Apply specific source filter if provided
    if (source) {
      enabledFeeds = enabledFeeds.filter(feed => 
        feed.name.toLowerCase().includes(source.toString().toLowerCase())
      )
    }
    
    console.log(`📊 Processing ${enabledFeeds.length} live RSS feeds...`)

    // Fetch all feeds in parallel with robust error handling
    const feedPromises = enabledFeeds.map(async (feedConfig) => {
      try {
        // Check memory cache for very recent data (5 minutes)
        const cached = feedCache.get(feedConfig.url)
        if (cached && (Date.now() - cached.timestamp) < (5 * 60 * 1000) && !forceFresh) {
          console.log(`⚡ Using memory cache for ${feedConfig.name}`)
          return cached.data
        }

        console.log(`🔄 Fetching fresh data from ${feedConfig.name}...`)
        
        const feed = await parser.parseURL(feedConfig.url)
        const articles: RSSArticle[] = []

        if (feed.items && feed.items.length > 0) {
          feed.items.slice(0, 20).forEach((item, index) => {
            // Clean and extract content
            const title = cleanHtml(item.title || 'Untitled Article')
            const description = item.contentSnippet || item.description || item.summary || ''
            const content = item['content:encoded'] || item.content || description
            const cleanContent = cleanHtml(content)
            const summary = cleanContent.substring(0, 350) + (cleanContent.length > 350 ? '...' : '')
            
            const article: RSSArticle = {
              id: `${feedConfig.sourceType}-${feedConfig.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`,
              title,
              summary: summary || 'No summary available',
              url: item.link || '#',
              source: feedConfig.name,
              sourceType: feedConfig.sourceType,
              publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
              topicTags: [feedConfig.category, ...extractAdvancedTopicTags(title, cleanContent, feedConfig.sourceType)],
              content: cleanContent
            }
            articles.push(article)
          })
        }

        // Update memory cache
        feedCache.set(feedConfig.url, {
          data: articles,
          timestamp: Date.now()
        })

        console.log(`✅ Successfully parsed ${articles.length} articles from ${feedConfig.name}`)
        return articles

      } catch (error) {
        console.error(`❌ Failed to fetch ${feedConfig.name}:`, error instanceof Error ? error.message : String(error))
        
        // Try fallback to cached data if available
        const cached = feedCache.get(feedConfig.url)
        if (cached && (Date.now() - cached.timestamp) < (2 * 60 * 60 * 1000)) { // 2 hours fallback
          console.log(`🔄 Using stale cache for ${feedConfig.name} due to fetch error`)
          return cached.data
        }
        
        return [] // Return empty array for failed feeds
      }
    })

    // Wait for all feeds to complete (or fail)
    const feedResults = await Promise.allSettled(feedPromises)
    
    // Collect all successful results
    feedResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value)
      } else {
        console.warn(`⚠️ Feed ${enabledFeeds[index]?.name || 'unknown'} failed:`, result.reason)
      }
    })

    // Sort by publication date (newest first)
    allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    console.log(`📰 Total articles aggregated: ${allArticles.length}`)

    // Return success response with enhanced metadata
    return res.status(200).json({
      success: true,
      articles: allArticles,
      feedsProcessed: enabledFeeds.length,
      totalSources: RSS_FEEDS.length,
      sourceBreakdown: {
        durham: allArticles.filter(a => a.sourceType === 'durham').length,
        ukLegal: allArticles.filter(a => a.sourceType === 'uk-legal').length,
        government: allArticles.filter(a => a.sourceType === 'government').length
      },
      timestamp: new Date().toISOString(),
      cacheStatus: forceFresh ? 'forced-fresh' : 'live',
      smartCacheEnabled: true
    })

  } catch (error) {
    console.error('🚨 RSS aggregation error:', error)
    
    // Emergency fallback to any cached data available
    try {
      const scheduler = RSSScheduler.getInstance()
      const emergencyCache = await scheduler.getCachedArticlesForDisplay()
      
      if (emergencyCache.length > 0) {
        console.log(`🚨 Using emergency cache: ${emergencyCache.length} articles`)
        return res.status(200).json({
          success: true,
          articles: emergencyCache,
          feedsProcessed: 0,
          totalSources: RSS_FEEDS.length,
          sourceBreakdown: {
            durham: emergencyCache.filter(a => a.sourceType === 'durham').length,
            ukLegal: emergencyCache.filter(a => a.sourceType === 'uk-legal').length,
            government: emergencyCache.filter(a => a.sourceType === 'government').length
          },
          timestamp: new Date().toISOString(),
          cacheStatus: 'emergency-cache',
          error: 'Live feeds failed, serving from emergency cache'
        })
      }
    } catch (cacheError) {
      console.error('🚨 Emergency cache also failed:', cacheError)
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to aggregate RSS feeds',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Clean HTML content and extract text
 */
function cleanHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Extract advanced topic tags from article content with source-specific logic
 */
function extractAdvancedTopicTags(title: string, content: string, sourceType: string): string[] {
  const text = `${title} ${content}`.toLowerCase()
  const tags: string[] = []

  // Source-specific tags
  if (sourceType === 'durham') {
    const durhamMappings = {
      'Student': ['student', 'undergraduate', 'postgraduate', 'course', 'module'],
      'Research': ['research', 'publication', 'study', 'academic', 'faculty'],
      'Campus': ['campus', 'college', 'accommodation', 'facilities', 'library'],
      'Events': ['event', 'conference', 'seminar', 'workshop', 'lecture']
    }
    Object.entries(durhamMappings).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(tag)
      }
    })
  }

  // General legal tags
  const legalMappings = {
    'Court': ['court', 'judge', 'ruling', 'verdict', 'trial', 'appeal', 'tribunal', 'hearing'],
    'Policy': ['policy', 'regulation', 'legislation', 'reform', 'government', 'parliament'],
    'Criminal': ['criminal', 'crime', 'prosecution', 'sentence', 'police', 'arrest', 'conviction'],
    'Civil': ['civil', 'contract', 'tort', 'negligence', 'damages', 'compensation'],
    'Human Rights': ['human rights', 'discrimination', 'equality', 'freedom', 'liberty', 'echr'],
    'Property': ['property', 'housing', 'landlord', 'tenant', 'conveyancing', 'planning'],
    'Employment': ['employment', 'workplace', 'dismissal', 'redundancy', 'discrimination'],
    'Family': ['family', 'divorce', 'child', 'custody', 'marriage', 'adoption', 'domestic'],
    'Commercial': ['business', 'commercial', 'company', 'corporate', 'insolvency', 'merger'],
    'Technology': ['technology', 'digital', 'cyber', 'data protection', 'gdpr', 'ai']
  }

  Object.entries(legalMappings).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      tags.push(tag)
    }
  })

  // Add urgency/importance tags
  if (text.includes('breaking') || text.includes('urgent') || text.includes('immediate')) {
    tags.push('Breaking')
  }
  if (text.includes('landmark') || text.includes('historic') || text.includes('significant')) {
    tags.push('Important')
  }

  // Default tags based on source
  if (tags.length === 0) {
    if (sourceType === 'government') tags.push('Policy')
    else if (sourceType === 'durham') tags.push('University')
    else tags.push('Legal')
  }

  return tags.slice(0, 4) // Limit to 4 tags maximum
}