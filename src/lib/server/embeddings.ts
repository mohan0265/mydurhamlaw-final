// src/lib/server/embeddings.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export function preprocessTextForEmbedding(text: string): string {
  // Clean and normalize text for embedding generation
  return text
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 8000) // Limit to reasonable length for embeddings
}

export async function generateEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    
    if (!response.data[0]) {
      throw new Error('No embedding data returned')
    }
    
    return {
      embedding: response.data[0].embedding,
      usage: response.usage,
      model: 'text-embedding-3-small'
    }
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

export function extractStyleFeatures(text: string) {
  // Basic style feature extraction
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  
  return {
    avgSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
    avgWordsPerParagraph: paragraphs.length > 0 ? words.length / paragraphs.length : 0,
    totalSentences: sentences.length,
    totalWords: words.length,
    totalParagraphs: paragraphs.length,
    avgWordLength: words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0,
    complexWordRatio: words.filter(w => w.length > 6).length / Math.max(words.length, 1),
    punctuationDensity: (text.match(/[.,;:!?]/g) || []).length / Math.max(text.length, 1)
  }
}