// Data encryption utilities for sensitive user inputs
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const TAG_LENGTH = 16

// Generate a key from environment variable or create a secure random key
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY
  if (envKey) {
    return Buffer.from(envKey, 'hex')
  }
  
  // In production, this should be stored securely in environment variables
  // For development, we'll generate a consistent key based on a secret
  const secret = process.env.NEXT_PUBLIC_SUPABASE_URL || 'default-dev-secret'
  return crypto.scryptSync(secret, 'salt', KEY_LENGTH)
}

export interface EncryptedData {
  encrypted: string
  iv: string
  tag: string
}

/**
 * Encrypt sensitive text data before storing in database
 */
export function encryptText(text: string): EncryptedData {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty')
  }

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipher(ALGORITHM, key)
  cipher.setAAD(Buffer.from('durhamlaw-user-data'))

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const tag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  }
}

/**
 * Decrypt sensitive text data when retrieving from database
 */
export function decryptText(encryptedData: EncryptedData): string {
  if (!encryptedData.encrypted || !encryptedData.iv || !encryptedData.tag) {
    throw new Error('Invalid encrypted data format')
  }

  const key = getEncryptionKey()
  const iv = Buffer.from(encryptedData.iv, 'hex')
  const tag = Buffer.from(encryptedData.tag, 'hex')
  
  const decipher = crypto.createDecipher(ALGORITHM, key)
  decipher.setAAD(Buffer.from('durhamlaw-user-data'))
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Hash sensitive data for storage when encryption is not needed
 */
export function hashText(text: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(text, actualSalt, 64).toString('hex')
  return `${actualSalt}:${hash}`
}

/**
 * Verify hashed text
 */
export function verifyHash(text: string, hashedText: string): boolean {
  const [salt, hash] = hashedText.split(':')
  if (!salt || !hash) return false
  const expectedHash = crypto.scryptSync(text, salt, 64).toString('hex')
  return hash === expectedHash
}

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/data:/gi, '') // Remove data: protocols
    .replace(/vbscript:/gi, '') // Remove vbscript: protocols
    .trim()
    .substring(0, 10000) // Limit length to prevent DoS
}

/**
 * Check if text contains sensitive information patterns
 */
export function containsSensitiveInfo(text: string): boolean {
  const sensitivePatterns = [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card numbers
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i
  ]
  
  return sensitivePatterns.some(pattern => pattern.test(text))
}

/**
 * Secure wrapper for storing user memory/journal entries
 */
export async function secureStoreUserText(userId: string, text: string, type: 'memory' | 'journal' | 'chat'): Promise<EncryptedData> {
  // Sanitize input
  const sanitized = sanitizeInput(text)
  
  // Check for sensitive info and warn
  if (containsSensitiveInfo(sanitized)) {
    console.warn(`Sensitive information detected in user ${userId} ${type} entry`)
  }
  
  // Encrypt the sanitized text
  return encryptText(sanitized)
}

/**
 * Secure wrapper for retrieving user memory/journal entries
 */
export function secureRetrieveUserText(encryptedData: EncryptedData): string {
  try {
    return decryptText(encryptedData)
  } catch (error) {
    console.error('Failed to decrypt user text:', error)
    return '[Error: Could not decrypt data]'
  }
}