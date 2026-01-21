import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerUser } from '@/lib/api/serverAuth';
import { createUserRateLimit } from '@/lib/middleware/rateLimiter';

// Rate limiter middleware runner
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise<void>((resolve) => {
    fn(req, res, (result: any) => resolve(result));
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1) AUTH
  const { user } = await getServerUser(req, res);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized - please sign in' });
  }

  // 2) RATE LIMIT: 3 rubric requests / 10 minutes
  const limiter = createUserRateLimit({
    maxRequests: 3,
    windowMs: 10 * 60 * 1000,
    getUserId: () => user!.id,
  });

  await runMiddleware(req, res, limiter);
  if (res.writableEnded) return;

  const { assignmentBrief, studentDraft, wordLimit, moduleCode } = req.body;

  if (!assignmentBrief) {
    return res.status(400).json({ error: 'Missing assignment brief' });
  }

  try {
    const aiProvider = process.env.ASSIGNMENT_AI_PROVIDER || 'openai';
    const rubric = await generateDurhamRubric(
      assignmentBrief,
      studentDraft,
      wordLimit,
      moduleCode,
      aiProvider
    );

    res.status(200).json(rubric);

  } catch (error: any) {
    console.error('Rubric generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate rubric' });
  }
}

async function generateDurhamRubric(
  brief: string,
  draft: string | undefined,
  wordLimit: number,
  moduleCode: string,
  provider: string
): Promise<any> {
  const systemPrompt = `
You are a Durham Law School marking assistant. Analyze the assignment brief and student draft (if provided) to estimate a marking band.

Durham UG Law Marking Bands:
- First (70+): Sophisticated argument, excellent authority, confident critical evaluation
- 2:1 (60-69): Clear well-supported argument, good application, some critical engagement
- 2:2 (50-59): Competent but descriptive, authorities used but not fully leveraged
- Third (40-49): Limited structure/authority, thin analysis, frequent errors
- Fail (<40): Serious deficiencies

Assess these criteria (Durham Law School standards):
1. Legal Knowledge & Authority (20%)
2. Analysis & Argument (30%)
3. Application to Facts (25%)
4. Structure & Clarity (15%)
5. OSCOLA & Referencing (10%)

Return JSON in this EXACT format:
{
  "meta": {
    "version": "durham-law-ug-v1",
    "moduleCode": "${moduleCode}",
    "wordCount": estimated or actual,
    "targetWordLimit": ${wordLimit},
    "oscola": { "style": "OSCOLA4", "confidence": 0.0-1.0 }
  },
  "overall": {
    "band": "First | 2:1 | 2:2 | Third",
    "bandRange": "70-100 | 60-69 | 50-59 | 40-49",
    "markerEstimate": numeric estimate,
    "confidence": 0.0-1.0,
    "oneLineVerdict": "One sentence summary"
  },
  "criteria": [
    {
      "key": "knowledge",
      "label": "Legal Knowledge & Authority",
      "weight": 0.20,
      "score": 0.0-1.0,
      "band": "First | 2:1 | 2:2 | Third",
      "feedback": "detailed feedback",
      "evidence": ["point 1", "point 2"],
      "fixes": ["action 1", "action 2"]
    },
    ... (5 criteria total)
  ],
  "priorityFixes": [
    { "title": "Fix description", "impact": "High|Medium|Low", "time": "X-Y min" }
  ],
  "bandDescriptors": {
    "First": ["trait 1", "trait 2"],
    "2:1": ["trait 1", "trait 2"],
    "2:2": ["trait 1", "trait 2"],
    "Third": ["trait 1", "trait 2"]
  },
  "nextActions": {
    "askDurmahPrompts": ["prompt 1", "prompt 2", "prompt 3"]
  }
}

CRITICAL:
- If NO draft provided, base on brief analysis only (lower confidence)
- Be honest about band estimates
- Provide actionable, specific feedback
- Reference OSCOLA where relevant
`;

  const userMessage = `
Assignment Brief:
${brief}

${draft ? `Student Draft (${draft.length} chars):\n${draft.substring(0, 3000)}` : 'No draft provided - estimate based on brief only'}

Word Limit: ${wordLimit}
Module: ${moduleCode}

Analyze and return rubric JSON.
`;

  if (provider === 'openai') {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3, // Lower for consistency
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);

  } else if (provider === 'gemini') {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(`${systemPrompt}\n\n${userMessage}`);
    const text = result.response.text();
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\n([\s\S]+)\n```/) || text.match(/\{[\s\S]+\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    
    return JSON.parse(text);
  }

  throw new Error('Invalid AI provider');
}
