// API route for intelligent legal news analysis
import { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const LEGAL_MODULES = [
  'Constitutional Law',
  'Criminal Law', 
  'Contract Law',
  'Tort Law',
  'Human Rights Law',
  'European Union Law',
  'Administrative Law',
  'Property Law',
  'Family Law',
  'Employment Law',
  'Commercial Law',
  'International Law',
  'Legal Ethics',
  'Legal Skills & Research',
  'Jurisprudence',
  'Evidence Law',
  'Civil Procedure',
  'Criminal Procedure'
]

const LEGAL_ALERT_TAGS = [
  'Human Rights',
  'Constitutional',
  'Criminal Law',
  'Civil Rights', 
  'Judicial Reform',
  'Brexit Impact',
  'Legal Tech',
  'Data Protection',
  'Privacy Rights',
  'Court Reform',
  'Legal Aid',
  'Access to Justice',
  'Regulatory Change',
  'Supreme Court',
  'Legal Precedent'
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { title, summary, content, source, url } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    console.log('🧠 Analyzing legal news:', title.substring(0, 50) + '...')

    const analysisPrompt = `You are a brilliant legal education AI assistant helping Durham Law students understand current legal news.

Analyze this legal news article and provide structured insights:

ARTICLE DETAILS:
Title: ${title}
Source: ${source}
Summary: ${summary}
Content: ${content || summary}

Please provide a JSON response with:

1. "summary": A concise, student-friendly summary (2-3 sentences) explaining the legal significance
2. "modules": Array of relevant law modules from this list: ${LEGAL_MODULES.join(', ')}
3. "discussionPrompts": Array of 2-3 thought-provoking questions for law students to debate
4. "alertTags": Array of relevant alert tags from: ${LEGAL_ALERT_TAGS.join(', ')}
5. "relevance": Study relevance level ("high", "medium", or "low") for law students
6. "essayAngles": Array of 2-3 potential essay questions or research angles this news could inspire

Focus on:
- UK legal context and implications
- How this connects to legal principles students are learning
- Critical thinking and analysis opportunities
- Real-world application of legal theory

Respond ONLY with valid JSON. No explanation text outside the JSON.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert legal education assistant. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })

    const responseContent = completion.choices[0]?.message?.content
    
    if (!responseContent) {
      throw new Error('No response from AI analysis')
    }

    try {
      const analysis = JSON.parse(responseContent)
      
      // Validate the response structure
      const validatedAnalysis = {
        summary: analysis.summary || 'Analysis not available',
        modules: Array.isArray(analysis.modules) ? analysis.modules.slice(0, 5) : [],
        discussionPrompts: Array.isArray(analysis.discussionPrompts) ? analysis.discussionPrompts.slice(0, 3) : [],
        alertTags: Array.isArray(analysis.alertTags) ? analysis.alertTags.slice(0, 4) : [],
        relevance: ['high', 'medium', 'low'].includes(analysis.relevance) ? analysis.relevance : 'medium',
        essayAngles: Array.isArray(analysis.essayAngles) ? analysis.essayAngles.slice(0, 3) : []
      }

      console.log('✅ Legal news analysis complete:', {
        modules: validatedAnalysis.modules.length,
        prompts: validatedAnalysis.discussionPrompts.length,
        relevance: validatedAnalysis.relevance
      })

      res.status(200).json(validatedAnalysis)

    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError)
      console.error('Raw response:', responseContent)
      
      // Fallback response
      res.status(200).json({
        summary: 'This legal news article discusses important developments in UK law that may be relevant to your studies.',
        modules: ['Constitutional Law'],
        discussionPrompts: ['How might this development affect legal practice?'],
        alertTags: ['Legal Development'],
        relevance: 'medium',
        essayAngles: ['Analyze the legal implications of this development']
      })
    }

  } catch (error: any) {
    console.error('❌ Legal news analysis error:', error)
    
    res.status(500).json({ 
      error: 'Analysis failed', 
      details: error.message 
    })
  }
}