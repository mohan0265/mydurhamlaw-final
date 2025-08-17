// netlify/functions/generate-pre-podcast.ts
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

// Scheduled function to generate morning podcasts
// Runs daily at 22:30 UTC (06:30 SGT)
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log('🌅 Starting morning podcast generation job...')
  
  try {
    // Initialize Supabase with service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all active users (simplified - you may want to filter by recent activity)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, user_type, created_at')
      .not('id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100) // Process in batches

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    if (!users || users.length === 0) {
      console.log('ℹ️ No users found for podcast generation')
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No users to process', processed: 0 })
      }
    }

    console.log(`📋 Processing ${users.length} users for morning podcasts...`)

    // Process users in smaller batches to avoid timeouts
    const BATCH_SIZE = 10
    const results = {
      success: 0,
      errors: 0,
      skipped: 0
    }

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE)
      
      console.log(`⚡ Processing batch ${Math.floor(i/BATCH_SIZE) + 1} (users ${i + 1}-${Math.min(i + BATCH_SIZE, users.length)})`)

      // Process batch in parallel
      const batchPromises = batch.map(async (user) => {
        try {
          // Check if user already has today's pre-podcast
          const today = new Date().toISOString().split('T')[0]
          const { data: existing } = await supabase
            .from('podcasts')
            .select('id')
            .eq('user_id', user.id)
            .eq('date', today)
            .eq('slot', 'pre')
            .single()

          if (existing) {
            console.log(`⏭️ Skipping user ${user.id} - pre-podcast already exists`)
            results.skipped++
            return
          }

          // Generate podcast via internal API call
          const apiResponse = await fetch(`${process.env.URL || 'http://localhost:3000'}/api/podcast/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}` // Service role for internal calls
            },
            body: JSON.stringify({
              slot: 'pre',
              userId: user.id, // Pass user ID directly for server-side generation
              date: today
            })
          })

          if (!apiResponse.ok) {
            throw new Error(`API call failed: ${apiResponse.status} ${apiResponse.statusText}`)
          }

          const result = await apiResponse.json()
          
          if (result.success) {
            console.log(`✅ Generated pre-podcast for user ${user.id}`)
            results.success++
          } else {
            throw new Error(result.error || 'Unknown API error')
          }

        } catch (error) {
          console.error(`❌ Error processing user ${user.id}:`, error)
          results.errors++
        }
      })

      // Wait for batch to complete
      await Promise.allSettled(batchPromises)

      // Add small delay between batches to be respectful to APIs
      if (i + BATCH_SIZE < users.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
      }
    }

    console.log('🎉 Morning podcast generation completed:', results)

    // Log to Supabase for monitoring
    try {
      await supabase
        .from('system_logs')
        .insert({
          event_type: 'scheduled_podcast_generation',
          event_data: {
            slot: 'pre',
            results,
            timestamp: new Date().toISOString()
          }
        })
    } catch (logError) {
      console.warn('Failed to log to database:', logError)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Morning podcast generation completed',
        ...results,
        total: users.length
      })
    }

  } catch (error) {
    console.error('🚨 Morning podcast generation failed:', error)
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Morning podcast generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}