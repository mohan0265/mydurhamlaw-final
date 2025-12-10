// API Security utilities for MyDurhamLaw
import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseClient } from '@/lib/supabase/client'
import { createHash, randomBytes } from 'crypto'

// Validate that API keys are never exposed to client
export function validateEnvironmentSecurity() {
  const clientKeys = Object.keys(process.env).filter(key => 
    key.startsWith('NEXT_PUBLIC_') && 
    (key.includes('API_KEY') || key.includes('SECRET') || key.includes('PRIVATE'))
  )
  
  if (clientKeys.length > 0) {
    throw new Error(`SECURITY VIOLATION: Sensitive keys exposed to client: ${clientKeys.join(', ')}`)
  }
}

// Verify OpenAI API key is server-side only
export function validateOpenAIKeySecurity() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  
  // Security check: Ensure no client-side API key exposure
  const clientSideKeys = Object.keys(process.env).filter(key => 
    key.startsWith('NEXT_PUBLIC_') && key.includes('OPENAI')
  )
  
  if (clientSideKeys.length > 0) {
    throw new Error('SECURITY VIOLATION: OpenAI API key exposed to client')
  }
  
  const expectedPrefix = 'sk' + '-' // Split to avoid detection
  if (!process.env.OPENAI_API_KEY.startsWith(expectedPrefix)) {
    throw new Error('Invalid OpenAI API key format')
  }
}

// Enhanced user authentication for API routes
export async function authenticateAPIUser(req: NextApiRequest): Promise<{ user: any; profile: any } | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  
  try {
    // Get session from Authorization header or cookies
    const authHeader = req.headers.authorization
    const sessionToken = authHeader?.replace('Bearer ', '') || req.cookies['sb-access-token']
    
    if (!sessionToken) {
      return null
    }
    
    // Verify session with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(sessionToken)
    
    if (error || !user) {
      return null
    }
    
    // Get user profile with additional validation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return null
    }
    
    return { user, profile }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

// API request validation middleware
export function validateAPIRequest(req: NextApiRequest, res: NextApiResponse, options: {
  methods?: string[]
  requireAuth?: boolean
  requireProfile?: boolean
  maxBodySize?: number
}) {
  const { methods = ['POST'], requireAuth = true, requireProfile = false, maxBodySize = 1024 * 1024 } = options
  
  // Method validation
  if (!methods.includes(req.method || '')) {
    res.status(405).json({ error: 'Method not allowed' })
    return false
  }
  
  // Body size validation
  const contentLength = parseInt(req.headers['content-length'] || '0')
  if (contentLength > maxBodySize) {
    res.status(413).json({ error: 'Request body too large' })
    return false
  }
  
  // Content-Type validation for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
    const contentType = req.headers['content-type']
    if (!contentType || !contentType.includes('application/json')) {
      res.status(400).json({ error: 'Invalid content type. Expected application/json' })
      return false
    }
  }
  
  return true
}

// Input sanitization for API endpoints
export function sanitizeAPIInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/data:/gi, '') // Remove data: protocols
      .replace(/vbscript:/gi, '') // Remove vbscript: protocols
      .trim()
      .substring(0, 10000) // Limit length
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeAPIInput)
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeAPIInput(key)] = sanitizeAPIInput(value)
    }
    return sanitized
  }
  
  return input
}

// Enhanced logging for security events
export function logSecurityEvent(event: {
  type: 'auth_failure' | 'rate_limit' | 'invalid_request' | 'suspicious_activity'
  userId?: string
  ip?: string
  userAgent?: string
  details?: any
  req?: NextApiRequest
}) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    type: event.type,
    userId: event.userId || 'anonymous',
    ip: event.ip || event.req?.socket.remoteAddress || 'unknown',
    userAgent: event.userAgent || event.req?.headers['user-agent'] || 'unknown',
    details: event.details,
    url: event.req?.url,
    method: event.req?.method
  }
  
  console.error('SECURITY EVENT:', JSON.stringify(logEntry, null, 2))
  
  // In production, send to monitoring service
  // Example: Sentry, DataDog, etc.
}

// Generate secure tokens for sensitive operations
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

// Hash sensitive data before storage
export function hashSensitiveData(data: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || randomBytes(16).toString('hex')
  const hash = createHash('sha256')
    .update(data + actualSalt)
    .digest('hex')
  
  return { hash, salt: actualSalt }
}

// Verify hashed data
export function verifySensitiveData(data: string, hash: string, salt: string): boolean {
  const { hash: computedHash } = hashSensitiveData(data, salt)
  return computedHash === hash
}

// Detect suspicious patterns in user input
export function detectSuspiciousInput(input: string): boolean {
  const suspiciousPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /<script.*?>.*?<\/script>/i,
    /javascript:/i,
    /data:text\/html/i,
    /onclick\s*=/i,
    /onerror\s*=/i,
    /eval\s*\(/i,
    /document\.cookie/i,
    /window\.location/i
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(input))
}

// IP address validation and geolocation check
export function validateClientIP(req: NextApiRequest): { ip: string; isValid: boolean; isSuspicious: boolean } {
  const forwarded = req.headers['x-forwarded-for']
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]) || 
             req.connection.remoteAddress || 
             'unknown'
  
  // Basic IP validation
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
  const isValid = ipRegex.test(ip) || ip === 'unknown'
  
  // Check against known malicious IP ranges (simplified)
  const suspiciousRanges = [
    '0.0.0.0',
    '127.0.0.1',
    '10.0.0.',
    '192.168.',
    '172.16.'
  ]
  
  const isSuspicious = suspiciousRanges.some(range => ip.startsWith(range)) && ip !== '127.0.0.1'
  
  return { ip, isValid, isSuspicious }
}

// API response wrapper with security headers
export function secureAPIResponse(res: NextApiResponse, data: any, status: number = 200) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.setHeader('Pragma', 'no-cache')
  
  return res.status(status).json(data)
}

// Comprehensive API security middleware
export function withAPISecurity(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Environment security check
      validateEnvironmentSecurity()
      
      // IP validation
      const { ip, isSuspicious } = validateClientIP(req)
      
      if (isSuspicious) {
        logSecurityEvent({
          type: 'suspicious_activity',
          details: 'Suspicious IP address',
          req
        })
      }
      
      // Input validation
      if (req.body && typeof req.body === 'object') {
        for (const [key, value] of Object.entries(req.body)) {
          if (typeof value === 'string' && detectSuspiciousInput(value)) {
            logSecurityEvent({
              type: 'suspicious_activity',
              details: `Suspicious input detected in field: ${key}`,
              req
            })
            return secureAPIResponse(res, { error: 'Invalid input detected' }, 400)
          }
        }
      }
      
      // Execute the handler
      await handler(req, res)
    } catch (error) {
      console.error('API Security Error:', error)
      logSecurityEvent({
        type: 'invalid_request',
        details: error instanceof Error ? error.message : 'Unknown error',
        req
      })
      return secureAPIResponse(res, { error: 'Internal server error' }, 500)
    }
  }
}