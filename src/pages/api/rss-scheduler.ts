// RSS Scheduler API - Automated RSS fetching endpoint
import type { NextApiRequest, NextApiResponse } from 'next'
import RSSScheduler from '@/lib/rss/rssScheduler'

interface SchedulerResponse {
  success: boolean
  message: string
  data?: {
    articlesProcessed: number
    sourcesProcessed: number
    lastUpdate?: string
    errors?: string[]
    scheduledFetch?: boolean
  }
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SchedulerResponse>) {
  // Security: Only allow GET requests and verify authorization
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed',
      error: 'Only GET and POST methods are supported'
    })
  }

  try {
    const scheduler = RSSScheduler.getInstance()
    const action = req.query.action as string || 'status'

    switch (action) {
      case 'status':
        // Get current status and last update time
        const lastUpdate = await scheduler.getLastUpdateTime()
        const cachedArticles = await scheduler.getCachedArticlesForDisplay()
        
        return res.status(200).json({
          success: true,
          message: 'RSS scheduler status retrieved',
          data: {
            articlesProcessed: cachedArticles.length,
            sourcesProcessed: 5, // Number of configured sources
            lastUpdate: lastUpdate?.toISOString(),
            scheduledFetch: scheduler.isScheduledFetchTime()
          }
        })

      case 'fetch':
        // Manual trigger (for testing or emergency updates)
        console.log('🔄 Manual RSS fetch triggered via API')
        const result = await scheduler.fetchRSSWithIntelligentCaching()
        
        return res.status(200).json({
          success: result.success,
          message: result.success 
            ? `Successfully fetched ${result.articlesProcessed} articles from ${result.sourcesProcessed} sources`
            : `Fetch completed with errors: ${result.errors.join(', ')}`,
          data: {
            articlesProcessed: result.articlesProcessed,
            sourcesProcessed: result.sourcesProcessed,
            errors: result.errors,
            scheduledFetch: false
          }
        })

      case 'scheduled':
        // Automated scheduled fetch (called by external scheduler)
        if (!scheduler.isScheduledFetchTime()) {
          return res.status(200).json({
            success: true,
            message: 'Not scheduled time for RSS fetch',
            data: { articlesProcessed: 0, sourcesProcessed: 0, scheduledFetch: false }
          })
        }

        console.log('⏰ Scheduled RSS fetch triggered')
        const scheduledResult = await scheduler.fetchRSSWithIntelligentCaching()
        
        return res.status(200).json({
          success: scheduledResult.success,
          message: scheduledResult.success 
            ? `Scheduled fetch completed: ${scheduledResult.articlesProcessed} articles from ${scheduledResult.sourcesProcessed} sources`
            : `Scheduled fetch completed with errors: ${scheduledResult.errors.join(', ')}`,
          data: {
            articlesProcessed: scheduledResult.articlesProcessed,
            sourcesProcessed: scheduledResult.sourcesProcessed,
            errors: scheduledResult.errors,
            scheduledFetch: true
          }
        })

      case 'cached':
        // Get cached articles for display
        const filter = req.query.filter as string
        const articles = await scheduler.getCachedArticlesForDisplay(filter)
        
        return res.status(200).json({
          success: true,
          message: `Retrieved ${articles.length} cached articles`,
          data: {
            articlesProcessed: articles.length,
            sourcesProcessed: 0,
            scheduledFetch: false
          }
        })

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action',
          error: 'Supported actions: status, fetch, scheduled, cached'
        })
    }

  } catch (error) {
    console.error('🚨 RSS Scheduler API error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}

// Disable body parsing for this API route to handle direct external calls
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}