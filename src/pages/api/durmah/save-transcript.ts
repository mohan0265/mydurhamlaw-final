// src/pages/api/durmah/save-transcript.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase/client'

interface SaveTranscriptRequest {
  conversationId?: string
  title?: string
  turns: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  startedAt: string
  endedAt?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 1. Get auth header (simplified for now - in production you'd want proper JWT validation)
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' })
    }

    // For now, we'll use a basic approach - in production, validate the JWT properly
    const user = { id: 'user-from-jwt' } // This would be extracted from JWT

    // 2. Parse request
    const { 
      conversationId, 
      title, 
      turns, 
      startedAt, 
      endedAt 
    }: SaveTranscriptRequest = req.body

    if (!turns || turns.length === 0) {
      return res.status(400).json({ error: 'No conversation turns to save' })
    }

    if (!startedAt) {
      return res.status(400).json({ error: 'Started timestamp is required' })
    }

    console.log('💾 Saving Durmah transcript:', { 
      userId: user.id, 
      conversationId,
      turnCount: turns.length 
    })

    // 3. Generate title if not provided
    const generatedTitle = title || generateConversationTitle(turns)

    if (!supabase) {
      return res.status(500).json({ error: 'Database connection not available' })
    }

    // 4. Save to database
    const { data: savedTranscript, error: saveError } = await supabase
      .from('durmah_transcripts')
      .insert({
        user_id: user.id,
        started_at: startedAt,
        ended_at: endedAt || new Date().toISOString(),
        turns: JSON.stringify(turns),
        title: generatedTitle
      })
      .select()
      .single()

    if (saveError) {
      throw new Error(`Database error: ${saveError.message}`)
    }

    console.log('✅ Transcript saved successfully:', savedTranscript.id)

    return res.status(200).json({
      success: true,
      transcript: {
        id: savedTranscript.id,
        title: savedTranscript.title,
        turnCount: turns.length,
        startedAt: savedTranscript.started_at,
        endedAt: savedTranscript.ended_at
      }
    })

  } catch (error) {
    console.error('🚨 Save transcript error:', error)
    
    return res.status(500).json({
      error: 'Failed to save transcript',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function generateConversationTitle(turns: Array<{ role: string; content: string }>): string {
  if (turns.length === 0) {
    return 'Empty Conversation'
  }

  // Get the first user message as basis for title
  const firstUserMessage = turns.find(turn => turn.role === 'user')?.content || ''
  
  if (!firstUserMessage) {
    return 'Durmah Conversation'
  }

  // Extract key topics/subjects from the first message
  const legalKeywords = [
    'contract', 'tort', 'criminal', 'constitutional', 'property', 'equity',
    'human rights', 'company law', 'employment', 'family law', 'evidence',
    'jurisprudence', 'administrative', 'eu law', 'land law', 'trusts'
  ]

  const studyKeywords = [
    'essay', 'exam', 'revision', 'assignment', 'deadline', 'study', 'research',
    'notes', 'lecture', 'seminar', 'tutorial', 'reading', 'module', 'coursework'
  ]

  const message = firstUserMessage.toLowerCase()
  let foundKeywords: string[] = []

  // Check for legal topics
  legalKeywords.forEach(keyword => {
    if (message.includes(keyword)) {
      foundKeywords.push(keyword)
    }
  })

  // Check for study-related topics
  studyKeywords.forEach(keyword => {
    if (message.includes(keyword)) {
      foundKeywords.push(keyword)
    }
  })

  // Generate title based on found keywords or fallback to first words
  if (foundKeywords.length > 0 && foundKeywords[0]) {
    const primaryTopic = foundKeywords[0].charAt(0).toUpperCase() + foundKeywords[0].slice(1)
    return `${primaryTopic} Discussion`
  }

  // Fallback: use first 4-6 words
  const words = firstUserMessage.split(' ').slice(0, 6)
  let title = words.join(' ')
  
  if (title.length > 50) {
    title = title.substring(0, 47) + '...'
  }

  return title || 'Durmah Conversation'
}