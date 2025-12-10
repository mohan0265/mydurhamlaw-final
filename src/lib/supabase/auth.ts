
import { getSupabaseClient } from './client'

const supabase = getSupabaseClient()
import { getAuthRedirect } from '@/lib/authRedirect'

export interface AuthError {
  message: string
  code?: string
}

export interface AuthResponse {
  data?: any
  error?: AuthError
}

export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirect(),
        data: {
          created_at: new Date().toISOString(),
        }
      },
    })

    if (error) throw error

    return { data }
  } catch (error: any) {
    return { 
      error: { 
        message: error.message || 'Failed to create account',
        code: error.code 
      } 
    }
  }
}

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return { data }
  } catch (error: any) {
    return { 
      error: { 
        message: error.message || 'Failed to sign in',
        code: error.code 
      } 
    }
  }
}

export const signOut = async (): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return {}
  } catch (error: any) {
    return { 
      error: { 
        message: error.message || 'Failed to sign out',
        code: error.code 
      } 
    }
  }
}

export const getUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

// ✅ NEW: Enhanced OAuth session management
export const handleOAuthCallback = async (url: string) => {
  try {
    console.log('🔄 Processing OAuth callback URL:', url)
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(url)
    
    if (error) {
      console.error('🚨 OAuth callback error:', error)
      throw error
    }
    
    console.log('✅ OAuth session established:', data.session?.user?.id)
    return { data, error: null }
  } catch (error: any) {
    console.error('🚨 OAuth callback processing failed:', error)
    return { 
      data: null, 
      error: { 
        message: error.message || 'OAuth callback failed',
        code: error.code 
      } 
    }
  }
}

// ✅ NEW: Session validation utility
export const validateSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('🚨 Session validation error:', error)
      return { isValid: false, session: null, error }
    }
    
    if (!session || !session.user) {
      console.log('❌ No valid session found')
      return { isValid: false, session: null, error: null }
    }
    
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      console.log('⏰ Session expired')
      return { isValid: false, session: null, error: { message: 'Session expired' } }
    }
    
    console.log('✅ Session is valid:', session.user.id)
    return { isValid: true, session, error: null }
  } catch (error: any) {
    console.error('🚨 Session validation failed:', error)
    return { 
      isValid: false, 
      session: null, 
      error: { message: error.message || 'Session validation failed' } 
    }
  }
}
