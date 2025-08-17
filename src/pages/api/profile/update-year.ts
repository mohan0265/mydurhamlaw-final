import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSupabase, getServerUser } from '@/lib/supabase/server'

const DEBUG = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG === 'true'

const VALID_YEAR_GROUPS = ['foundation', 'year1', 'year2', 'year3'] as const
type YearGroup = typeof VALID_YEAR_GROUPS[number]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validate request body
    const { year_group } = req.body
    
    if (!year_group || typeof year_group !== 'string') {
      return res.status(400).json({ error: 'year_group is required' })
    }

    if (!VALID_YEAR_GROUPS.includes(year_group as YearGroup)) {
      return res.status(400).json({ 
        error: 'Invalid year_group',
        valid_options: VALID_YEAR_GROUPS 
      })
    }

    // Get authenticated user
    const user = await getServerUser(req, res)
    
    if (!user) {
      if (DEBUG) console.debug('🚫 Update year: No authenticated user')
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (DEBUG) console.debug('👤 Update year: User authenticated', { 
      userId: user.id,
      yearGroup: year_group 
    })

    // Get server Supabase client (respects RLS)
    const supabase = getServerSupabase(req, res)

    // Update the user's year group
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        year_group: year_group as YearGroup,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('🚨 Update year: Database error', {
        error: error.message,
        code: error.code,
        userId: user.id,
        yearGroup: year_group
      })
      return res.status(500).json({ 
        error: 'Failed to update year group',
        details: DEBUG ? error.message : undefined 
      })
    }

    if (DEBUG) console.debug('✅ Update year: Success', { 
      userId: user.id,
      yearGroup: year_group,
      updated: !!data 
    })

    return res.status(200).json({ 
      ok: true,
      profile: data
    })

  } catch (error) {
    console.error('🚨 Update year: Unexpected error', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: DEBUG && error instanceof Error ? error.message : undefined
    })
  }
}