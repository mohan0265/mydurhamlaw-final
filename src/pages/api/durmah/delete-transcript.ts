// src/pages/api/durmah/delete-transcript.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase/client'
import { createClient } from '@supabase/supabase-js'

interface DeleteTranscriptRequest {
  transcriptId?: string
  conversationId?: string // For deleting current session
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
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
    const { transcriptId, conversationId }: DeleteTranscriptRequest = req.body

    if (!transcriptId && !conversationId) {
      return res.status(400).json({ 
        error: 'Either transcriptId or conversationId is required' 
      })
    }

    console.log('🗑️ Deleting Durmah transcript:', { 
      userId: user.id, 
      transcriptId,
      conversationId
    })

    if (!supabase) {
      return res.status(500).json({ error: 'Database connection not available' })
    }

    let deleteQuery = supabase
      .from('durmah_transcripts')
      .delete()
      .eq('user_id', user.id) // Security: ensure user owns the transcript

    if (transcriptId) {
      deleteQuery = deleteQuery.eq('id', transcriptId)
    }

    // Note: conversationId deletion would require additional logic
    // For now, we focus on transcriptId deletion

    const { data: deletedTranscripts, error: deleteError } = await deleteQuery
      .select()

    if (deleteError) {
      throw new Error(`Database error: ${deleteError.message}`)
    }

    if (!deletedTranscripts || deletedTranscripts.length === 0) {
      return res.status(404).json({ 
        error: 'Transcript not found or already deleted' 
      })
    }

    console.log('✅ Transcript deleted successfully:', transcriptId)

    return res.status(200).json({
      success: true,
      message: 'Transcript deleted successfully',
      deletedCount: deletedTranscripts.length
    })

  } catch (error) {
    console.error('🚨 Delete transcript error:', error)
    
    return res.status(500).json({
      error: 'Failed to delete transcript',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}