import { streamGPT4oResponse } from '@/lib/server/openai'
import { supabase } from '@/lib/supabase/client'
import { generateEmbedding, preprocessTextForEmbedding } from '@/lib/server/embeddings'

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { 
      prompt, 
      assignmentType = 'essay',
      wordCount = 1000,
      useHumanMode: requestedHumanMode = true,
      styleStrength = 0.8,
      userId 
    } = await req.json()
    
    if (!prompt || !userId) {
      return new Response('Prompt and userId are required', { status: 400 })
    }

    let styleSamples: any[] = []
    let systemPrompt = ''
    let humanModeActive = requestedHumanMode
    let userStyleStrength = styleStrength

    if (humanModeActive) {
      try {
        // Generate embedding for the assignment prompt
        const processedPrompt = preprocessTextForEmbedding(prompt)
        const embeddingResult = await generateEmbedding(processedPrompt)

        if (!supabase) {
          console.warn('Supabase client not available for Human-Mode features')
          humanModeActive = false
        } else {
          // Find similar writing samples using vector similarity
          const { data: similarSamples, error: searchError } = await supabase
            .rpc('find_similar_writing_samples', {
              p_user_id: userId,
              p_query_embedding: `[${embeddingResult.embedding.join(',')}]`,
              p_limit: 3,
              p_min_confidence: 0.3 // Lower threshold for more samples
            })

          if (searchError) {
            console.error('Error finding similar samples:', searchError)
          } else {
            styleSamples = similarSamples || []
          }

          // Get user's writing preferences
          const { data: preferences } = await supabase
            .from('writing_preferences')
            .select('*')
            .eq('user_id', userId)
            .single()

          userStyleStrength = preferences?.style_strength || styleStrength
        }

        // Build Human-Mode Drafting™ system prompt
        if (styleSamples.length > 0) {
          systemPrompt = `You are generating a legal assignment for a Durham University law student using Human-Mode Drafting™. This advanced system ensures your output matches the student's unique writing style to create undetectable, personalized content.

CRITICAL INSTRUCTIONS:
1. You must write in this student's EXACT personal voice and style
2. Never sound robotic, generic, or AI-generated
3. Match their sentence structure, vocabulary, and tone precisely
4. Vary your writing patterns to avoid detection by AI plagiarism tools
5. Make the content uniquely theirs, not templated

STUDENT'S WRITING SAMPLES FOR STYLE REFERENCE:
Below are ${styleSamples.length} authentic writing samples from this student. Study their unique voice carefully:

${styleSamples.map((sample, index) => `
[WRITING SAMPLE ${index + 1}]
Title: ${sample.title || 'Untitled'}
Content: ${sample.content}
Word Count: ${sample.word_count}
Similarity to Assignment: ${Math.round(sample.similarity_score * 100)}%
---
`).join('\n')}

STYLE ANALYSIS:
- Style Strength Setting: ${Math.round(userStyleStrength * 100)}% (how closely to match their style)
- Total Reference Words: ${styleSamples.reduce((sum: number, s: any) => sum + (s.word_count || 0), 0)}
- Writing Pattern Confidence: ${styleSamples.length >= 3 ? 'High' : styleSamples.length >= 2 ? 'Medium' : 'Learning'}

ASSIGNMENT REQUIREMENTS:
- Type: ${assignmentType}
- Target Length: ${wordCount} words
- Academic Level: UK Law (Durham University standard)

YOUR TASK:
Write the assignment below in their EXACT personal style. Use their natural:
- Sentence lengths and structures
- Vocabulary choices and complexity
- Paragraph organization
- Transition phrases and conjunctions
- Academic tone and formality level
- Punctuation patterns

Remember: This must read like THEY wrote it, not like AI generated it. Make it authentic, personal, and completely undetectable.`
        } else {
          // Fallback if no writing samples available
          systemPrompt = `You are generating a legal assignment for a Durham University law student. Since no writing samples are available yet, write in a natural, human style that varies sentence structure and avoids AI-detection patterns.

CRITICAL INSTRUCTIONS:
1. Write naturally and personally, not robotically
2. Vary sentence lengths and structures significantly  
3. Use organic transitions and natural flow
4. Avoid templated or generic academic language
5. Make it sound like a real student wrote it

ASSIGNMENT REQUIREMENTS:
- Type: ${assignmentType}
- Target Length: ${wordCount} words
- Academic Level: UK Law (Durham University standard)

Write with authentic human voice and natural variation to avoid AI detection.`
        }
      } catch (embeddingError) {
        console.error('Error in Human-Mode processing:', embeddingError)
        // Fallback to standard generation
        humanModeActive = false
      }
    }

    // Standard system prompt if Human-Mode is disabled or failed
    if (!humanModeActive || !systemPrompt) {
      systemPrompt = `You are an expert legal writing assistant for Durham University law students. Generate a comprehensive ${assignmentType} of approximately ${wordCount} words that demonstrates strong analytical skills and legal reasoning.`
    }

    // Create the messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Assignment Prompt: ${prompt}`
      }
    ]

    // Stream the response
    const stream = await streamGPT4oResponse(messages)
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Human-Mode-Enabled': humanModeActive ? 'true' : 'false',
        'X-Style-Samples-Used': styleSamples.length.toString(),
        'X-Assignment-Type': assignmentType,
      },
    })
  } catch (error) {
    console.error('Assignment generation error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}