// RSS System Test API - Test the automated RSS system functionality
import type { NextApiRequest, NextApiResponse } from 'next'
import RSSScheduler from '@/lib/rss/rssScheduler'
import RSSLogger from '@/lib/rss/logger'
import CronScheduler from '@/lib/rss/cronScheduler'

interface TestResponse {
  success: boolean
  message: string
  data?: any
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TestResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed',
      error: 'Only GET method is supported'
    })
  }

  const testType = req.query.test as string || 'all'

  try {
    const rssScheduler = RSSScheduler.getInstance()
    const rssLogger = RSSLogger.getInstance()
    const cronScheduler = CronScheduler.getInstance()

    switch (testType) {
      case 'scheduler':
        // Test RSS scheduler functionality
        console.log('🧪 Testing RSS Scheduler...')
        const schedulerResult = await rssScheduler.fetchRSSWithIntelligentCaching()
        
        return res.status(200).json({
          success: schedulerResult.success,
          message: `RSS Scheduler test completed`,
          data: {
            articlesProcessed: schedulerResult.articlesProcessed,
            sourcesProcessed: schedulerResult.sourcesProcessed,
            errors: schedulerResult.errors,
            hasErrors: schedulerResult.errors.length > 0
          }
        })

      case 'cache':
        // Test caching functionality
        console.log('🧪 Testing RSS Cache...')
        const cachedArticles = await rssScheduler.getCachedArticlesForDisplay()
        const lastUpdate = await rssScheduler.getLastUpdateTime()
        
        return res.status(200).json({
          success: true,
          message: `RSS Cache test completed`,
          data: {
            cachedArticlesCount: cachedArticles.length,
            lastUpdate: lastUpdate?.toISOString(),
            cacheAge: lastUpdate ? Date.now() - lastUpdate.getTime() : null,
            sampleTitles: cachedArticles.slice(0, 3).map(a => a.title)
          }
        })

      case 'cron':
        // Test cron scheduler status
        console.log('🧪 Testing Cron Scheduler...')
        const cronStatus = cronScheduler.getStatus()
        const isScheduledTime = rssScheduler.isScheduledFetchTime()
        
        return res.status(200).json({
          success: true,
          message: `Cron Scheduler test completed`,
          data: {
            cronTasks: cronStatus,
            isScheduledFetchTime: isScheduledTime,
            currentSingaporeTime: new Intl.DateTimeFormat('en-SG', {
              timeZone: 'Asia/Singapore',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }).format(new Date())
          }
        })

      case 'logger':
        // Test logging functionality
        console.log('🧪 Testing RSS Logger...')
        
        // Create test log entries
        rssLogger.info('test', 'RSS system test initiated')
        rssLogger.warn('test', 'This is a test warning')
        rssLogger.debug('test', 'Debug information', { testData: true })
        
        // Get recent logs and performance stats
        const recentLogs = await rssLogger.getRecentLogs(10)
        const errorLogs = await rssLogger.getErrorLogs(1) // Last 1 hour
        const performanceStats = await rssLogger.getPerformanceStats(24) // Last 24 hours
        
        return res.status(200).json({
          success: true,
          message: `RSS Logger test completed`,
          data: {
            recentLogsCount: recentLogs.length,
            errorLogsCount: errorLogs.length,
            performanceStats,
            sampleLogEntries: recentLogs.slice(0, 3).map(log => ({
              level: log.level,
              source: log.source,
              message: log.message,
              timestamp: log.timestamp
            }))
          }
        })

      case 'all':
        // Comprehensive system test
        console.log('🧪 Running comprehensive RSS system test...')
        
        const testResults = {
          scheduler: { success: false, error: null as string | null },
          cache: { success: false, error: null as string | null },
          cron: { success: false, error: null as string | null },
          logger: { success: false, error: null as string | null }
        }

        // Test scheduler
        try {
          const result = await rssScheduler.fetchRSSWithIntelligentCaching()
          testResults.scheduler.success = result.success
          if (!result.success) {
            testResults.scheduler.error = result.errors.join(', ')
          }
        } catch (error) {
          testResults.scheduler.error = error instanceof Error ? error.message : String(error)
        }

        // Test cache
        try {
          const cached = await rssScheduler.getCachedArticlesForDisplay()
          testResults.cache.success = cached.length > 0
          if (cached.length === 0) {
            testResults.cache.error = 'No cached articles found'
          }
        } catch (error) {
          testResults.cache.error = error instanceof Error ? error.message : String(error)
        }

        // Test cron
        try {
          const status = cronScheduler.getStatus()
          testResults.cron.success = status.length > 0
          if (status.length === 0) {
            testResults.cron.error = 'No cron tasks configured'
          }
        } catch (error) {
          testResults.cron.error = error instanceof Error ? error.message : String(error)
        }

        // Test logger
        try {
          rssLogger.info('comprehensive-test', 'Running comprehensive RSS system test')
          const logs = await rssLogger.getRecentLogs(5)
          testResults.logger.success = logs.length > 0
          if (logs.length === 0) {
            testResults.logger.error = 'No log entries found'
          }
        } catch (error) {
          testResults.logger.error = error instanceof Error ? error.message : String(error)
        }

        const allTestsPass = Object.values(testResults).every(test => test.success)
        
        return res.status(200).json({
          success: allTestsPass,
          message: allTestsPass 
            ? 'All RSS system tests passed successfully ✅' 
            : 'Some RSS system tests failed ❌',
          data: {
            testResults,
            overallStatus: allTestsPass ? 'PASS' : 'FAIL',
            timestamp: new Date().toISOString(),
            singaporeTime: new Intl.DateTimeFormat('en-SG', {
              timeZone: 'Asia/Singapore',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }).format(new Date())
          }
        })

      case 'manual-trigger':
        // Manual trigger for testing (emergency use)
        console.log('🧪 Manual RSS fetch trigger test...')
        const manualResult = await cronScheduler.triggerManualFetch()
        
        return res.status(200).json({
          success: manualResult.success,
          message: `Manual RSS trigger test completed`,
          data: {
            articlesProcessed: manualResult.articlesProcessed,
            sourcesProcessed: manualResult.sourcesProcessed,
            errors: manualResult.errors,
            hasErrors: manualResult.errors.length > 0
          }
        })

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid test type',
          error: 'Supported test types: scheduler, cache, cron, logger, all, manual-trigger'
        })
    }

  } catch (error) {
    console.error('🚨 RSS system test error:', error)
    return res.status(500).json({
      success: false,
      message: 'RSS system test failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}

// Configuration for this API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}