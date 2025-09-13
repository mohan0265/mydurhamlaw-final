import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Sample ID is required' })
  }

  // Get user from session
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' })
  }

  const token = authHeader.replace('Bearer ', '')
  
  if (!supabase) {
    console.error('Supabase client is not available.');
    return res.status(500).json({ error: 'Database connection unavailable' });
  }
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid authentication' })
  }

  switch (req.method) {
    case 'GET':
      return handleGetSample(req, res, user.id, id)
    case 'PUT':
      return handleUpdateSample(req, res, user.id, id)
    case 'DELETE':
      return handleDeleteSample(req, res, user.id, id)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGetSample(req: NextApiRequest, res: NextApiResponse, userId: string, sampleId: string) {
  try {
    if (!supabase) {
      console.error('Supabase client is not available.');
      return res.status(500).json({ error: 'Database connection unavailable' });
    }

    const { data: sample, error } = await supabase
      .from('writing_samples')
      .select(`
        id,
        content,
        title,
        context,
        word_count,
        is_ai_generated,
        confidence_score,
        created_at,
        updated_at
      `)
      .eq('id', sampleId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Writing sample not found' })
      }
      throw error
    }

    return res.status(200).json({ sample })
  } catch (error: any) {
    console.error('Error fetching writing sample:', error)
    return res.status(500).json({ error: 'Failed to fetch writing sample' })
  }
}

async function handleUpdateSample(req: NextApiRequest, res: NextApiResponse, userId: string, sampleId: string) {
  try {
    if (!supabase) {
      console.error('Supabase client is not available.');
      return res.status(500).json({ error: 'Database connection unavailable' });
    }

    const { title, context, confidenceScore } = req.body

    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (context !== undefined) updateData.context = context
    if (confidenceScore !== undefined) {
      if (typeof confidenceScore !== 'number' || confidenceScore < 0 || confidenceScore > 1) {
        return res.status(400).json({ error: 'Confidence score must be a number between 0 and 1' })
      }
      updateData.confidence_score = confidenceScore
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    const { data: sample, error } = await supabase
      .from('writing_samples')
      .update(updateData)
      .eq('id', sampleId)
      .eq('user_id', userId)
      .select(`
        id,
        content,
        title,
        context,
        word_count,
        is_ai_generated,
        confidence_score,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Writing sample not found' })
      }
      throw error
    }

    return res.status(200).json({
      sample,
      message: 'Writing sample updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating writing sample:', error)
    return res.status(500).json({ error: 'Failed to update writing sample' })
  }
}

async function handleDeleteSample(req: NextApiRequest, res: NextApiResponse, userId: string, sampleId: string) {
  try {
    if (!supabase) {
      console.error('Supabase client is not available.');
      return res.status(500).json({ error: 'Database connection unavailable' });
    }

    const { error } = await supabase
      .from('writing_samples')
      .delete()
      .eq('id', sampleId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    return res.status(200).json({ message: 'Writing sample deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting writing sample:', error)
    return res.status(500).json({ error: 'Failed to delete writing sample' })
  }
}