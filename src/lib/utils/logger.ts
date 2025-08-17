
// Enhanced logging utility for debugging OAuth issues

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel

  constructor() {
    this.level = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (level < this.level) return

    const timestamp = new Date().toISOString()
    const levelStr = LogLevel[level]
    const prefix = `[${timestamp}] ${levelStr}:`

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, data || '')
        break
      case LogLevel.INFO:
        console.info(prefix, message, data || '')
        break
      case LogLevel.WARN:
        console.warn(prefix, message, data || '')
        break
      case LogLevel.ERROR:
        console.error(prefix, message, data || '')
        break
    }
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data)
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data)
  }

  error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data)
  }

  // OAuth-specific logging methods
  oauthStart(provider: string, metadata: any) {
    this.info(`🔄 OAuth ${provider} initiated`, metadata)
  }

  oauthCallback(success: boolean, error?: any) {
    if (success) {
      this.info('✅ OAuth callback successful')
    } else {
      this.error('🚨 OAuth callback failed', error)
    }
  }

  sessionState(hasSession: boolean, userId?: string) {
    if (hasSession) {
      this.info(`✅ Session active for user: ${userId}`)
    } else {
      this.warn('❌ No active session found')
    }
  }

  profileOperation(operation: string, success: boolean, data?: any) {
    if (success) {
      this.info(`✅ Profile ${operation} successful`, data)
    } else {
      this.error(`🚨 Profile ${operation} failed`, data)
    }
  }
}

export const logger = new Logger()
export default logger
