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