// src/pages/api/podcast/generate.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase/client'
import { buildPodcastPrompt, generatePodcastTitle, validatePodcastScript } from '@/lib/podcast/prompt'
import { elevenLabsClient } from '@/lib/elevenlabs'
import { uploadPodcastAudio } from '@/lib/supabase/storage'
import OpenAI from 'openai'

interface GeneratePodcastRequest {
  slot: 'pre' | 'post'
  date?: string // Optional, defaults to today
  voice?: string // Optional voice preference
}

interface GeneratePodcastResponse {
  success: boolean
  podcast?: {
    id: string
    title: string
    script: string
    audioUrl: string
    slot: string
    date: string
    duration: number
  }
  error?: string
  debug?: {
    promptLength: number
    scriptValidation: any
    audioSize: string
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeneratePodcastResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    // 1. Get auth header (simplified for now - in production you'd want proper JWT validation)
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Authorization header required' })
    }

    // For now, we'll use a basic approach - in production, validate the JWT properly
    const user = { id: 'user-from-jwt' } // This would be extracted from JWT

    // 2. Parse request body
    const { slot, date, voice = 'rachel' }: GeneratePodcastRequest = req.body

    if (!slot || !['pre', 'post'].includes(slot)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid slot parameter. Must be "pre" or "post"' 
      })
    }

    const targetDate = date ?? new Date().toISOString().split('T')[0]
    console.log('🎙️ Generating podcast:', { userId: user.id, slot, targetDate })

    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Database connection not available' })
    }

    // 3. Check if podcast already exists for this date/slot
    const { data: existingPodcast } = await supabase
      .from('podcasts')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', targetDate)
      .eq('slot', slot)
      .single()

    if (existingPodcast) {
      return res.status(200).json({
        success: true,
        podcast: {
          id: existingPodcast.id,
          title: existingPodcast.title,
          script: existingPodcast.script,
          audioUrl: existingPodcast.audio_url,
          slot: existingPodcast.slot,
          date: existingPodcast.date,
          duration: Math.round(existingPodcast.script.split(' ').length / 150 * 60)
        }
      })
    }

    // 4. Get user profile and context data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get user's current year/modules (simplified for now)
    const currentYear = profile?.user_type || 'Year 1'
    
    // Mock context data - in production, fetch from actual tables
    const safeTargetDate = targetDate ?? new Date().toISOString().split('T')[0]
    const userContext = {
      profile,
      currentYear,
      todayDate: new Date(safeTargetDate as string).toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      modules: getModulesForYear(currentYear),
      assignments: await getUpcomingAssignments(user.id, supabase),
      upcomingEvents: await getUpcomingEvents(safeTargetDate as string)
    }

    // 5. Generate podcast script using GPT-4
    const prompt = buildPodcastPrompt(slot, userContext)
    console.log('📝 Generating script with GPT-4...')

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating engaging, personalized educational podcasts for law students. Generate warm, conversational scripts that are exactly 90-120 seconds when spoken aloud.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    })

    const script = completion.choices[0]?.message?.content?.trim()
    if (!script) {
      throw new Error('Failed to generate podcast script')
    }

    // 6. Validate script
    const validation = validatePodcastScript(script)
    console.log('✅ Script validation:', validation)

    // 7. Generate audio using ElevenLabs
    console.log('🎵 Generating audio with ElevenLabs...')
    const audioBuffer = await elevenLabsClient.generatePodcastAudio(script, voice as any)

    // 8. Upload audio to Supabase Storage
    console.log('📤 Uploading audio to Supabase Storage...')
    const uploadResult = await uploadPodcastAudio(
      user.id,
      targetDate as string,
      slot,
      audioBuffer
    )

    if (!uploadResult.success || !uploadResult.publicUrl) {
      throw new Error(`Failed to upload audio: ${uploadResult.error}`)
    }

    // 9. Save podcast metadata to database
    const title = generatePodcastTitle(slot, profile?.full_name?.split(' ')[0] || 'Student', targetDate as string)
    
    const { data: podcastRecord, error: dbError } = await supabase
      .from('podcasts')
      .insert({
        user_id: user.id,
        date: targetDate as string,
        slot,
        title,
        script,
        audio_url: uploadResult.publicUrl
      })
      .select()
      .single()

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    // 10. Return success response
    console.log('🎉 Podcast generated successfully:', podcastRecord.id)

    return res.status(200).json({
      success: true,
      podcast: {
        id: podcastRecord.id,
        title: podcastRecord.title,
        script: podcastRecord.script,
        audioUrl: podcastRecord.audio_url,
        slot: podcastRecord.slot,
        date: podcastRecord.date,
        duration: validation.estimatedDuration
      },
      debug: {
        promptLength: prompt.length,
        scriptValidation: validation,
        audioSize: `${(audioBuffer.byteLength / 1024).toFixed(1)}KB`
      }
    })

  } catch (error) {
    console.error('🚨 Podcast generation error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return res.status(500).json({
      success: false,
      error: `Podcast generation failed: ${errorMessage}`
    })
  }
}

// Helper functions
function getModulesForYear(year: string): string[] {
  const moduleMap: Record<string, string[]> = {
    'Foundation': ['Legal Skills', 'Introduction to Law', 'Constitutional Law Basics'],
    'Year 1': ['Contract Law', 'Criminal Law', 'Constitutional Law', 'Tort Law'],
    'Year 2': ['Land Law', 'EU Law', 'Equity & Trusts', 'Administrative Law'],
    'Year 3': ['Company Law', 'Dissertation', 'Human Rights', 'Jurisprudence']
  }
  
  return moduleMap[year] ?? moduleMap['Year 1']!
}

async function getUpcomingAssignments(userId: string, supabase: any) {
  // Mock implementation - replace with actual assignment fetching
  const mockAssignments = [
    {
      title: 'Contract Law Essay',
      dueDate: 'Next Friday',
      subject: 'Contract Law'
    },
    {
      title: 'Case Study Analysis',
      dueDate: 'Next Tuesday',
      subject: 'Criminal Law'
    }
  ]
  
  return mockAssignments.slice(0, 2) // Limit to 2 assignments
}

async function getUpcomingEvents(date: string) {
  // Mock implementation - replace with actual Durham events API
  const mockEvents = [
    {
      title: 'Law Society Career Fair',
      date: 'Next Wednesday',
      type: 'Career'
    },
    {
      title: 'Legal Research Workshop',
      date: 'Friday',
      type: 'Academic'
    }
  ]
  
  return mockEvents.slice(0, 2) // Limit to 2 events
}