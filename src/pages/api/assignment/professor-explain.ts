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

  // 2) RATE LIMIT: 10 explanations / 5 minutes
  const limiter = createUserRateLimit({
    maxRequests: 10,
    windowMs: 5 * 60 * 1000,
    getUserId: () => user!.id,
  });

  await runMiddleware(req, res, limiter);
  if (res.writableEnded) return;

  const { questionText, wordLimit, moduleCode } = req.body;

  if (!questionText) {
    return res.status(400).json({ error: 'Missing question text' });
  }

  try {
    const aiProvider = process.env.ASSIGNMENT_AI_PROVIDER || 'openai';
    const explanation = await generateProfessorExplanation(
      questionText,
      wordLimit,
      moduleCode,
      aiProvider
    );

    res.status(200).json(explanation);

  } catch (error: any) {
    console.error('Professor explanation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate explanation' });
  }
}

async function generateProfessorExplanation(
  question: string,
  wordLimit: number,
  moduleCode: string,
  provider: string
): Promise<any> {
  const systemPrompt = `
You are a world-class Durham Law School professor. Explain this assignment brief as you would to a student in office hours.

Provide a comprehensive breakdown in JSON format:

{
  "mainIssue": "Brief 1-line description of the central legal question",
  "legalAreas": ["Constitutional Law", "Human Rights", etc.],
  "skillsTested": [
    "IRAC structure application",
    "Case law synthesis",
    "Legal reasoning skills",
    etc.
  ],
  "keyQuestions": [
    "What constitutional principle is at stake?",
    "How do the facts trigger the legal test?",
    etc.
  ],
  "commonPitfalls": [
    "Students often focus on description rather than application",
    "Missing the counter-argument weakens analysis",
    etc.
  ],
  "gradingCriteria": {
    "argument": 40,
    "research": 30,
    "structure": 20,
    "citation": 10
  },
  "professorAnalysis": "Multi-paragraph detailed explanation as if speaking to student. Explain:
  - What the question is really asking
  - What the examiner wants to see
  - How to approach this systematically
  - What makes a First-class answer vs 2:1
  - Specific authorities to consider (cases/statutes)",
  "suggestedStructure": {
    "introduction": "Brief description of what intro should cover",
    "body": [
      { "section": "Issue 1: ...", "wordAllocation": 400, "approach": "Start with..." },
      { "section": "Issue 2: ...", "wordAllocation": 500, "approach": "Apply..." }
    ],
    "conclusion": "What the conclusion should achieve"
  },
  "mandatoryAuthorities": [
    { "type": "case", "citation": "Smith v Jones [2020] UKSC 1", "why": "Leading authority on..." },
    { "type": "statute", "citation": "Human Rights Act 1998, s 3", "why": "Directly applicable" }
  ],
  "optionalAuthorities": [
    { "type": "article", "citation": "Author, 'Title' [Year] Journal", "why": "Excellent critical analysis" }
  ]
}

Be:
- Encouraging but honest
- Specific and actionable
- Professor-caliber (not generic AI)
- Durham Law School standards
`;

  const userMessage = `
Assignment Question:
${question}

Word Limit: ${wordLimit}
Module: ${moduleCode}

Provide professor-level breakdown.
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
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);

  } else if (provider === 'gemini') {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(`${systemPrompt}\n\n${userMessage}`);
    const text = result.response.text();
    
    const jsonMatch = text.match(/```json\n([\s\S]+)\n```/) || text.match(/\{[\s\S]+\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    
    return JSON.parse(text);
  }

  throw new Error('Invalid AI provider');
}
