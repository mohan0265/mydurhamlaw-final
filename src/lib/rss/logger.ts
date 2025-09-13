// RSS Logger - Comprehensive logging for RSS operations
import { getSupabaseClient } from '@/lib/supabase/client'

export interface RSSLogEntry {
  id?: string
  level: 'info' | 'warn' | 'error' | 'debug'
  source: string
  message: string
  metadata?: any
  timestamp: string
  uk_time: string
  session_id?: string
}

class RSSLogger {
  private static instance: RSSLogger
  private sessionId: string
  private logQueue: RSSLogEntry[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    this.sessionId = `rss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.startBatchFlush()
  }

  static getInstance(): RSSLogger {
    if (!RSSLogger.instance) {
      RSSLogger.instance = new RSSLogger()
    }
    return RSSLogger.instance
  }

  /**
   * Log an info message
   */
  info(source: string, message: string, metadata?: any): void {
    this.log('info', source, message, metadata)
  }

  /**
   * Log a warning message
   */
  warn(source: string, message: string, metadata?: any): void {
    this.log('warn', source, message, metadata)
  }

  /**
   * Log an error message
   */
  error(source: string, message: string, metadata?: any): void {
    this.log('error', source, message, metadata)
  }

  /**
   * Log a debug message (only in development)
   */
  debug(source: string, message: string, metadata?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', source, message, metadata)
    }
  }

  /**
   * Log RSS fetch start
   */
  logFetchStart(source: string, url: string): void {
    this.info(source, `Starting RSS fetch from ${url}`, { url })
  }

  /**
   * Log RSS fetch success
   */
  logFetchSuccess(source: string, url: string, articleCount: number, duration?: number): void {
    this.info(source, `Successfully fetched ${articleCount} articles`, {
      url,
      articleCount,
      duration,
      success: true
    })
  }

  /**
   * Log RSS fetch error
   */
  logFetchError(source: string, url: string, error: Error | string, attempt?: number): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    this.error(source, `RSS fetch failed: ${errorMessage}`, {
      url,
      error: errorMessage,
      attempt,
      success: false
    })
  }

  /**
   * Log cache operations
   */
  logCacheOperation(operation: 'hit' | 'miss' | 'update' | 'clear', source: string, details?: any): void {
    this.info('cache', `Cache ${operation} for ${source}`, {
      operation,
      source,
      ...details
    })
  }

  /**
   * Log schedule execution
   */
  logScheduleExecution(status: 'started' | 'completed' | 'failed', details?: any): void {
    const level = status === 'failed' ? 'error' : 'info'
    this.log(level, 'scheduler', `RSS schedule execution ${status}`, {
      status,
      ...details
    })
  }

  /**
   * Core logging method
   */
  private log(level: RSSLogEntry['level'], source: string, message: string, metadata?: any): void {
    const now = new Date()
    const ukTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(now)

    const logEntry: RSSLogEntry = {
      level,
      source,
      message,
      metadata,
      timestamp: now.toISOString(),
      uk_time: ukTime,
      session_id: this.sessionId
    }

    // Console output for immediate feedback
    const consoleMessage = `[${ukTime}] [${level.toUpperCase()}] [${source}] ${message}`
    switch (level) {
      case 'error':
        console.error(consoleMessage, metadata || '')
        break
      case 'warn':
        console.warn(consoleMessage, metadata || '')
        break
      case 'debug':
        console.debug(consoleMessage, metadata || '')
        break
      default:
        console.log(consoleMessage, metadata || '')
    }

    // Add to queue for batch insertion
    this.logQueue.push(logEntry)

    // Immediate flush for errors
    if (level === 'error') {
      this.flushLogs()
    }
  }

  /**
   * Start batch flushing logs every 30 seconds
   */
  private startBatchFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushLogs()
    }, 30000) // 30 seconds
  }

  /**
   * Flush queued logs to Supabase
   */
  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return

    const logsToFlush = [...this.logQueue]
    this.logQueue = []

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error('Supabase client unavailable for flushing RSS logs')
        return
      }

      const { error } = await supabase
        .from('rss_logs')
        .insert(logsToFlush)

      if (error) {
        console.error('Failed to flush RSS logs to database:', error)
        // Put logs back in queue on error
        this.logQueue.unshift(...logsToFlush)
      }
    } catch (error) {
      console.error('Error flushing RSS logs:', error)
      // Put logs back in queue on error
      this.logQueue.unshift(...logsToFlush)
    }
  }

  /**
   * Get recent logs for monitoring
   */
  async getRecentLogs(limit: number = 100): Promise<RSSLogEntry[]> {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error('Supabase client unavailable for getting recent RSS logs')
        return []
      }

      const { data, error } = await supabase
        .from('rss_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get recent RSS logs:', error)
      return []
    }
  }

  /**
   * Get error logs for debugging
   */
  async getErrorLogs(hoursBack: number = 24): Promise<RSSLogEntry[]> {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error('Supabase client unavailable for getting RSS error logs')
        return []
      }

      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
      
      const { data, error } = await supabase
        .from('rss_logs')
        .select('*')
        .eq('level', 'error')
        .gte('timestamp', cutoffTime)
        .order('timestamp', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get RSS error logs:', error)
      return []
    }
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(hoursBack: number = 24): Promise<{
    totalFetches: number
    successfulFetches: number
    failedFetches: number
    averageArticles: number
    errorRate: number
  }> {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error('Supabase client unavailable for getting RSS performance stats')
        return {
          totalFetches: 0,
          successfulFetches: 0,
          failedFetches: 0,
          averageArticles: 0,
          errorRate: 0
        }
      }

      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
      
      const { data, error } = await supabase
        .from('rss_logs')
        .select('level, metadata')
        .gte('timestamp', cutoffTime)
        .in('level', ['info', 'error'])
        .contains('metadata', { success: true })
        .or('metadata->>success.eq.true,metadata->>success.eq.false')

      if (error) throw error

      const logs = data || []
      const totalFetches = logs.length
      const successfulFetches = logs.filter(log => log.metadata?.success === true).length
      const failedFetches = totalFetches - successfulFetches
      const totalArticles = logs
        .filter(log => log.metadata?.success === true)
        .reduce((sum, log) => sum + (log.metadata?.articleCount || 0), 0)
      const averageArticles = successfulFetches > 0 ? Math.round(totalArticles / successfulFetches) : 0
      const errorRate = totalFetches > 0 ? Math.round((failedFetches / totalFetches) * 100) : 0

      return {
        totalFetches,
        successfulFetches,
        failedFetches,
        averageArticles,
        errorRate
      }
    } catch (error) {
      console.error('Failed to get RSS performance stats:', error)
      return {
        totalFetches: 0,
        successfulFetches: 0,
        failedFetches: 0,
        averageArticles: 0,
        errorRate: 0
      }
    }
  }

  /**
   * Clean up old logs (keep last 7 days)
   */
  async cleanupOldLogs(): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error('Supabase client unavailable for RSS logs cleanup')
        return
      }

      const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      
      const { error } = await supabase
        .from('rss_logs')
        .delete()
        .lt('timestamp', cutoffTime)

      if (error) throw error
      this.info('logger', 'Cleaned up old RSS logs', { cutoffTime })
    } catch (error) {
      this.error('logger', 'Failed to clean up old RSS logs', { error: error instanceof Error ? error.message : String(error) })
    }
  }

  /**
   * Cleanup on process exit
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    
    // Flush remaining logs synchronously if possible
    if (this.logQueue.length > 0) {
      this.flushLogs()
    }
  }
}

// Auto-cleanup on process exit
if (typeof window === 'undefined') {
  const logger = RSSLogger.getInstance()
  
  process.on('SIGTERM', () => {
    logger.destroy()
  })
  
  process.on('SIGINT', () => {
    logger.destroy()
  })

  process.on('exit', () => {
    logger.destroy()
  })
}

export default RSSLogger