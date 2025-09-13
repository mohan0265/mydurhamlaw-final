// netlify/functions/generate-post-podcast.ts
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

// Scheduled function to generate evening podcasts
// Runs daily at 10:00 UTC (18:00 SGT)
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log('🌆 Starting evening podcast generation job...')
  
  try {
    // Initialize Supabase with service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get active users who have morning podcasts (indicating active engagement)
    const today = new Date().toISOString().split('T')[0]
    
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id, 
        full_name, 
        user_type, 
        created_at,
        podcasts!inner(id)
      `)
      .eq('podcasts.date', today)
      .eq('podcasts.slot', 'pre')
      .order('created_at', { ascending: false })
      .limit(100) // Process in batches

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    if (!users || users.length === 0) {
      console.log('ℹ️ No users with morning podcasts found for evening generation')
      
      // Fallback: get recent active users
      const { data: fallbackUsers } = await supabase
        .from('profiles')
        .select('id, full_name, user_type, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false })
        .limit(50)

      if (!fallbackUsers || fallbackUsers.length === 0) {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'No active users to process', processed: 0 })
        }
      }
    }

    const targetUsers = users || []
    console.log(`📋 Processing ${targetUsers.length} users for evening podcasts...`)

    // Process users in smaller batches
    const BATCH_SIZE = 10
    const results = {
      success: 0,
      errors: 0,
      skipped: 0
    }

    for (let i = 0; i < targetUsers.length; i += BATCH_SIZE) {
      const batch = targetUsers.slice(i, i + BATCH_SIZE)
      
      console.log(`⚡ Processing batch ${Math.floor(i/BATCH_SIZE) + 1} (users ${i + 1}-${Math.min(i + BATCH_SIZE, targetUsers.length)})`)

      // Process batch in parallel
      const batchPromises = batch.map(async (user) => {
        try {
          // Check if user already has today's post-podcast
          const { data: existing } = await supabase
            .from('podcasts')
            .select('id')
            .eq('user_id', user.id)
            .eq('date', today)
            .eq('slot', 'post')
            .single()

          if (existing) {
            console.log(`⏭️ Skipping user ${user.id} - post-podcast already exists`)
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
              slot: 'post',
              userId: user.id, // Pass user ID directly for server-side generation
              date: today
            })
          })

          if (!apiResponse.ok) {
            throw new Error(`API call failed: ${apiResponse.status} ${apiResponse.statusText}`)
          }

          const result = await apiResponse.json()
          
          if (result.success) {
            console.log(`✅ Generated post-podcast for user ${user.id}`)
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

      // Add delay between batches
      if (i + BATCH_SIZE < targetUsers.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
      }
    }

    console.log('🎉 Evening podcast generation completed:', results)

    // Log to Supabase for monitoring
    try {
      await supabase
        .from('system_logs')
        .insert({
          event_type: 'scheduled_podcast_generation',
          event_data: {
            slot: 'post',
            results,
            timestamp: new Date().toISOString()
          }
        })
    } catch (logError) {
      console.warn('Failed to log to database:', logError)
    }

    // Cleanup old podcasts (once daily, during evening run)
    try {
      console.log('🧹 Running podcast cleanup...')
      await supabase.rpc('cleanup_old_podcasts')
      console.log('✅ Podcast cleanup completed')
    } catch (cleanupError) {
      console.warn('Podcast cleanup failed:', cleanupError)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Evening podcast generation completed',
        ...results,
        total: targetUsers.length
      })
    }

  } catch (error) {
    console.error('🚨 Evening podcast generation failed:', error)
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Evening podcast generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}