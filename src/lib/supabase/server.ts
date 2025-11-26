import { NextApiRequest, NextApiResponse } from 'next'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Get a server-side Supabase client with service role key
 * This bypasses RLS and should only be used in secure server contexts
 */
export function getSupabaseServerClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * Get a server-side Supabase client that uses the user's session from cookies
 * This ensures RLS policies are properly enforced based on the authenticated user
 */
export function getServerSupabase(
  req: NextApiRequest,
  res: NextApiResponse
): SupabaseClient {
  // Get the auth token from cookies
  const token = req.cookies['mdl-auth'] || req.cookies['sb-access-token'] || req.cookies['supabase-auth-token']
  
  // Create client with user's auth token if available
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : {}
      }
    }
  )
  
  return supabase
}

/**
 * Get the current authenticated user from the server-side Supabase client
 * Returns null if no user is authenticated
 */
export async function getServerUser(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getServerSupabase(req, res)
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      // Try alternative auth methods
      const authHeader = req.headers.authorization
      const token = authHeader?.replace('Bearer ', '') || 
                   req.cookies['mdl-auth'] ||
                   req.cookies['sb-access-token'] || 
                   req.cookies['supabase-auth-token']
      
      if (token) {
        // Create a client with the explicit token
        const tokenClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          }
        )
        
        const { data: { user: tokenUser }, error: tokenError } = await tokenClient.auth.getUser()
        if (!tokenError && tokenUser) {
          return tokenUser
        }
      }
      
      return null
    }
    
    return user
  } catch (error) {
    console.error('Failed to get user:', error)
    return null
  }
}