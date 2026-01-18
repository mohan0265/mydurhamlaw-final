import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Reuse the chat completion logic or call OpenAI directly
// Ideally we reuse the centralized logic, but for this specific feature a dedicated handler is cleaner
// to enforce the structured JSON output.

const openAiKey = process.env.OPENAI_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { full_text, metadata } = req.body;

  if (!full_text) {
    return res.status(400).json({ error: 'Full text is required for deep analysis.' });
  }

  try {
    // 1. Construct Strict Prompt
    const systemPrompt = `You are Durmah, an expert legal tutor for Durham University law students.
Your task is to analyze the provided news article text and extract structured learning points.

STRICT RULES:
1. Analyze ONLY the text provided by the user. Do not invent facts.
2. Output valid JSON in the specified format.
3. Be academic but accessible.

REQUIRED JSON OUTPUT FORMAT:
{
  "summary": "A concise 3-4 sentence summary of the facts.",
  "legal_concepts": ["concept1", "concept2"], // Key legal terms found
  "module_relevance": [
    { "module": "Public Law", "relevance": "Explanation of change to constitution..." }
  ],
  "discussion_questions": [
    "Question 1?", "Question 2?"
  ],
  "essay_angles": [
    "Essay angle 1...", "Essay angle 2..."
  ]
}`;

    const userMessage = `Here is the article text to analyze:
    
Title: ${metadata?.title || 'Unknown'}
Source: ${metadata?.source || 'Unknown'}

TEXT:
${full_text.substring(0, 15000)} -- Limit length to avoid token limits
`;

    // 2. Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use high quality model for analysis
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" } 
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI Analysis Error:', err);
      throw new Error('Failed to analyze text with AI.');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const jsonAnalysis = JSON.parse(content);

    return res.status(200).json({ success: true, analysis: jsonAnalysis });

  } catch (error: any) {
    console.error('News Analysis Endpoint Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
