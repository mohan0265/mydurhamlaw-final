// RSS System Initialization - Auto-start cron scheduler on server startup
import CronScheduler from './cronScheduler'
import RSSLogger from './logger'

let isInitialized = false

/**
 * Initialize the RSS system with cron scheduling
 * This should be called once when the server starts
 */
export function initializeRSSSystem(): void {
  if (isInitialized) {
    console.log('⚠️ RSS system already initialized, skipping...')
    return
  }

  if (typeof window !== 'undefined') {
    console.log('⚠️ RSS system initialization skipped - running in browser environment')
    return
  }

  try {
    const logger = RSSLogger.getInstance()
    const scheduler = CronScheduler.getInstance()

    console.log('🚀 Initializing RSS system...')
    logger.info('system', 'RSS system initialization started')

    // Initialize and start the cron scheduler
    scheduler.initialize()
    scheduler.start()

    // Log successful initialization
    logger.info('system', 'RSS system initialized with twice-daily scheduling', {
      schedules: ['6:00 AM UK time', '6:00 PM UK time'],
      timezone: 'Europe/London',
      autoStart: true
    })

    isInitialized = true
    console.log('✅ RSS system initialized successfully')

  } catch (error) {
    console.error('🚨 Failed to initialize RSS system:', error)
    
    // Try to log the error if logger is available
    try {
      const logger = RSSLogger.getInstance()
      logger.error('system', 'RSS system initialization failed', {
        error: error instanceof Error ? error.message : String(error)
      })
    } catch (logError) {
      console.error('🚨 Also failed to log initialization error:', logError)
    }
  }
}

/**
 * Check if RSS system is initialized
 */
export function isRSSSystemInitialized(): boolean {
  return isInitialized
}

/**
 * Force restart RSS system (for debugging/maintenance)
 */
export function restartRSSSystem(): void {
  try {
    const logger = RSSLogger.getInstance()
    const scheduler = CronScheduler.getInstance()

    logger.warn('system', 'RSS system restart requested')
    
    // Stop current scheduler
    scheduler.stop()
    
    // Reset initialization flag
    isInitialized = false
    
    // Re-initialize
    initializeRSSSystem()
    
    logger.info('system', 'RSS system restarted successfully')
    
  } catch (error) {
    console.error('🚨 Failed to restart RSS system:', error)
  }
}

// Do NOT auto-initialize during build or when imported by Next.js
// This prevents RSS cron from starting during `next build` on Netlify
if (
  typeof window === 'undefined' && 
  process.env.NODE_ENV !== 'test' && 
  process.env.NODE_ENV === 'production' &&
  !process.env.NETLIFY &&
  process.env.RUNTIME_PHASE !== 'build'
) {
  // Only initialize in actual production runtime, not during build
  setTimeout(() => {
    initializeRSSSystem()
  }, 2000)
}