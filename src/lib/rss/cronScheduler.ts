// Cron Scheduler - Runs RSS fetching twice daily at 6AM and 6PM UK time (GMT/BST)
import cron, { ScheduledTask } from 'node-cron'
import RSSScheduler from './rssScheduler'

class CronScheduler {
  private static instance: CronScheduler
  private scheduledTasks: ScheduledTask[] = []
  private isInitialized = false

  static getInstance(): CronScheduler {
    if (!CronScheduler.instance) {
      CronScheduler.instance = new CronScheduler()
    }
    return CronScheduler.instance
  }

  /**
   * Initialize cron jobs for RSS fetching
   * Runs at 6:00 AM and 6:00 PM UK time (GMT/BST)
   */
  initialize(): void {
    if (this.isInitialized) {
      console.log('⚠️ Cron scheduler already initialized')
      return
    }

    try {
      const rssScheduler = RSSScheduler.getInstance()

      // Schedule for 6:00 AM UK time (06:00 UTC)
      const morningTask = cron.schedule('0 6 * * *', async () => {
        try {
          console.log('🌅 Morning RSS fetch starting (6:00 AM UK time)')
          const result = await rssScheduler.fetchRSSWithIntelligentCaching()
          console.log(`🌅 Morning fetch completed: ${result.articlesProcessed} articles, ${result.sourcesProcessed} sources`)
        } catch (error) {
          console.error('🚨 Morning RSS fetch failed:', error)
        }
      }, {
        timezone: 'UTC'
      })

      // Schedule for 6:00 PM UK time (18:00 UTC)  
      const eveningTask = cron.schedule('0 18 * * *', async () => {
        try {
          console.log('🌆 Evening RSS fetch starting (6:00 PM UK time)')
          const result = await rssScheduler.fetchRSSWithIntelligentCaching()
          console.log(`🌆 Evening fetch completed: ${result.articlesProcessed} articles, ${result.sourcesProcessed} sources`)
        } catch (error) {
          console.error('🚨 Evening RSS fetch failed:', error)
        }
      }, {
        timezone: 'UTC'
      })

      this.scheduledTasks.push(morningTask, eveningTask)
      this.isInitialized = true

      console.log('✅ RSS Cron scheduler initialized successfully')
      console.log('📅 Scheduled times:')
      console.log('   🌅 Morning: 6:00 AM UK time (06:00 UTC)')
      console.log('   🌆 Evening: 6:00 PM UK time (18:00 UTC)')
      
    } catch (error) {
      console.error('🚨 Failed to initialize cron scheduler:', error)
    }
  }

  /**
   * Start all scheduled tasks
   */
  start(): void {
    if (!this.isInitialized) {
      this.initialize()
    }

    this.scheduledTasks.forEach(task => {
      if (!task.getStatus()) {
        task.start()
      }
    })

    console.log(`🚀 Started ${this.scheduledTasks.length} RSS cron jobs`)
  }

  /**
   * Stop all scheduled tasks
   */
  stop(): void {
    this.scheduledTasks.forEach(task => {
      if (task.getStatus()) {
        task.stop()
      }
    })

    console.log(`🛑 Stopped ${this.scheduledTasks.length} RSS cron jobs`)
  }

  /**
   * Get status of all scheduled tasks
   */
  getStatus(): { task: string; running: boolean; nextExecutions: string[] }[] {
    return this.scheduledTasks.map((task, index) => ({
      task: index === 0 ? 'Morning (6AM UK)' : 'Evening (6PM UK)',
      running: typeof task.getStatus === 'function' ? !!task.getStatus() : false,
      nextExecutions: ['(Not dynamically available)']
    }))
  }

  /**
   * Manually trigger RSS fetch (for testing)
   */
  async triggerManualFetch(): Promise<{
    success: boolean
    articlesProcessed: number
    sourcesProcessed: number
    errors: string[]
  }> {
    console.log('🔧 Manual RSS fetch triggered via cron scheduler')
    const rssScheduler = RSSScheduler.getInstance()
    return await rssScheduler.fetchRSSWithIntelligentCaching()
  }
}

export default CronScheduler

// Auto-initialize and start cron jobs when this module is imported in a server environment
/*
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  const scheduler = CronScheduler.getInstance()

  // Use a small delay to ensure everything is properly initialized
  setTimeout(() => {
    scheduler.start()
  }, 5000)

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('📤 SIGTERM received, stopping RSS cron jobs...')
    scheduler.stop()
  })

  process.on('SIGINT', () => {
    console.log('📤 SIGINT received, stopping RSS cron jobs...')
    scheduler.stop()
  })
}
*/
