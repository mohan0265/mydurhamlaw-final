import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase/client'
import { generateEmbedding, preprocessTextForEmbedding, extractStyleFeatures } from '@/lib/server/embeddings'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      return handleGetSamples(req, res, user.id)
    case 'POST':
      return handleCreateSample(req, res, user.id)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGetSamples(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    if (!supabase) {
      console.error('Supabase client is not available.');
      return res.status(500).json({ error: 'Database connection unavailable' });
    }

    const { limit = '10', includeStats = 'false' } = req.query

    // Get writing samples
    const { data: samples, error: samplesError } = await supabase
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string))

    if (samplesError) {
      throw samplesError
    }

    let stats = null
    if (includeStats === 'true') {
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_user_writing_stats', { p_user_id: userId })

      if (statsError) {
        console.error('Error fetching stats:', statsError)
      } else {
        stats = statsData?.[0] || null
      }
    }

    return res.status(200).json({
      samples,
      stats,
      count: samples?.length || 0
    })
  } catch (error: any) {
    console.error('Error fetching writing samples:', error)
    return res.status(500).json({ error: 'Failed to fetch writing samples' })
  }
}

async function handleCreateSample(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    if (!supabase) {
      console.error('Supabase client is not available.');
      return res.status(500).json({ error: 'Database connection unavailable' });
    }

    const { content, title, context = {}, isAiGenerated = false, confidenceScore = 1.0 } = req.body

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required and must be a string' })
    }

    if (content.trim().length < 50) {
      return res.status(400).json({ error: 'Content must be at least 50 characters long' })
    }

    // Preprocess text and generate embedding
    const processedContent = preprocessTextForEmbedding(content)
    const embeddingResult = await generateEmbedding(processedContent)

    // Extract style features for additional metadata
    const styleFeatures = extractStyleFeatures(content)

    // Enhanced context with style features
    const enhancedContext = {
      ...context,
      styleFeatures,
      embeddingModel: embeddingResult.model,
      tokenUsage: embeddingResult.usage
    }

    // Insert sample with embedding using RPC
    const { data: sampleId, error: insertError } = await supabase
      .rpc('insert_writing_sample_with_embedding', {
        p_user_id: userId,
        p_content: content,
        p_title: title || null,
        p_context: enhancedContext,
        p_embedding: `[${embeddingResult.embedding.join(',')}]`,
        p_is_ai_generated: isAiGenerated,
        p_confidence_score: confidenceScore
      })

    if (insertError) {
      throw insertError
    }

    // Fetch the created sample to return
    const { data: newSample, error: fetchError } = await supabase
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
      .single()

    if (fetchError) {
      throw fetchError
    }

    return res.status(201).json({
      sample: newSample,
      message: 'Writing sample created successfully'
    })
  } catch (error: any) {
    console.error('Error creating writing sample:', error)
    return res.status(500).json({ 
      error: 'Failed to create writing sample',
      details: error.message 
    })
  }
}