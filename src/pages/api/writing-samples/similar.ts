import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSupabaseClient } from '@/lib/supabase/serverClient'
import { generateEmbedding, preprocessTextForEmbedding } from '@/lib/server/embeddings'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get user from session
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = getServerSupabaseClient()
  if (!supabase) {
    console.error('Supabase client is not available.');
    return res.status(500).json({ error: 'Database connection unavailable' });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid authentication' })
  }

  try {
    const { 
      queryText, 
      limit = 3, 
      minConfidence = 0.5,
      includeContent = true 
    } = req.body

    if (!queryText || typeof queryText !== 'string') {
      return res.status(400).json({ error: 'Query text is required' })
    }

    if (queryText.trim().length < 10) {
      return res.status(400).json({ error: 'Query text must be at least 10 characters long' })
    }

    // Generate embedding for the query text
    const processedQuery = preprocessTextForEmbedding(queryText)
    const embeddingResult = await generateEmbedding(processedQuery)

    // Find similar writing samples using the RPC function
    const { data: similarSamples, error: searchError } = await supabase
      .rpc('find_similar_writing_samples', {
        p_user_id: user.id,
        p_query_embedding: `[${embeddingResult.embedding.join(',')}]`,
        p_limit: Math.min(limit, 10), // Cap at 10 for performance
        p_min_confidence: Math.max(0, Math.min(1, minConfidence)) // Ensure 0-1 range
      })

    if (searchError) {
      throw searchError
    }

    // Format the response
    const formattedSamples = (similarSamples || []).map((sample: any) => ({
      id: sample.sample_id,
      title: sample.title,
      context: sample.context,
      similarity_score: parseFloat(sample.similarity_score),
      word_count: sample.word_count,
      created_at: sample.created_at,
      ...(includeContent && { content: sample.content })
    }))

    // Get user's writing preferences to provide additional context
    const { data: preferences } = await supabase
      .from('writing_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return res.status(200).json({
      query: {
        text: queryText,
        processed: processedQuery,
        embedding_model: embeddingResult.model
      },
      samples: formattedSamples,
      preferences: preferences || null,
      search_params: {
        limit,
        min_confidence: minConfidence,
        results_count: formattedSamples.length
      }
    })
  } catch (error: any) {
    console.error('Error finding similar writing samples:', error)
    return res.status(500).json({ 
      error: 'Failed to find similar writing samples',
      details: error.message 
    })
  }
}