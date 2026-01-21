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

  // 1) AUTH: require a logged-in user
  const { user } = await getServerUser(req, res);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized - please sign in' });
  }

  // 2) RATE LIMIT: 12 requests / 5 minutes per user
  const limiter = createUserRateLimit({
    maxRequests: 12,
    windowMs: 5 * 60 * 1000,
    getUserId: () => user!.id,
  });

  await runMiddleware(req, res, limiter);

  // If limiter blocked, it already responded (429)
  if (res.writableEnded) return;

  const { assignmentId, stage, userMessage, context } = req.body;

  if (!stage || !userMessage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const aiProvider = process.env.ASSIGNMENT_AI_PROVIDER || 'openai';
    console.log('[Durmah-Stage] Provider:', aiProvider);
    console.log('[Durmah-Stage] Stage:', stage);
    console.log('[Durmah-Stage] Has API key:', aiProvider === 'openai' ? !!process.env.OPENAI_API_KEY : !!process.env.GEMINI_API_KEY);
    
    const systemPrompt = getStageSystemPrompt(stage, context);
    
    const response = await getAIResponse(systemPrompt, userMessage, aiProvider);

    res.status(200).json({
      success: true,
      response,
      stage,
    });

  } catch (error: any) {
    console.error('[Durmah-Stage] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      provider: process.env.ASSIGNMENT_AI_PROVIDER || 'openai'
    });
    res.status(500).json({ error: error.message || 'Failed to get response' });
  }
}

function getStageSystemPrompt(stage: number, context: any): string {
  const basePrompt = `
You are Durmah, an AI tutor helping Durham Law students with their assignments.

CRITICAL RULES:
- Follow Durham's "Selective Use" AI policy
- NEVER write full paragraphs for students
- Provide guidance, questions, and feedback - NOT answers
- Encourage critical thinking and original work
- Track what assistance you provide (for transparency)
`;

  const stagePrompts = {
    1: `${basePrompt}

STAGE 1: UNDERSTANDING THE ASSIGNMENT

Assignment Brief: ${context?.questionText || 'Not provided'}

Your goals:
1. Explain the assignment in simple, clear terms
2. Identify the main legal issues
3. Break down what the question is asking
4. Quiz the student to ensure they understand
5. Only allow progression when they demonstrate understanding

Ask probing questions like:
- "What do you think the key legal issue is here?"
- "Can you identify the parties and their potential claims?"
- "What area of law does this relate to?"

Be patient, encouraging, and adaptive to the student's level.`,

    2: `${basePrompt}

STAGE 2: RESEARCH GUIDANCE

Assignment: ${context?.questionText || 'Not provided'}
Legal Issues Identified: ${context?.legalIssues?.join(', ') || 'Not yet identified'}

Your goals:
1. Suggest key cases to read (with proper citations)
2. Recommend relevant statutes
3. Point to useful secondary sources
4. Help student take effective research notes
5. DO NOT conduct research FOR them - guide them to do it

Provide OSCOLA citations for any sources you mention.
Ask: "Have you read [Case Name]? What principle did you identify?"`,

    3: `${basePrompt}

STAGE 3: STRUCTURING THE ESSAY

Assignment: ${context?.questionText || 'Not provided'}

Your goals:
1. Guide student through IRAC/ILAC structure
2. Help map arguments to logical sections
3. Suggest paragraph topics (NOT content)
4. Review their outline and provide feedback

IRAC Structure:
- Issue: What's the legal question?
- Rule: What's the relevant law?
- Application: How does the law apply to facts?
- Conclusion: What's the outcome?

Ask: "What should your introduction cover?"
"How will you organize your rule section?"`,

    4: `${basePrompt}

STAGE 4: DRAFTING SUPPORT

Assignment: ${context?.questionText || 'Not provided'}
Current Word Count: ${context?.wordCount || 0} / ${context?.wordLimit || 'unknown'}

Your goals:
1. Provide section-by-section guidance (NOT text)
2. Give feedback on argument clarity
3. Remind about citation requirements
4. Warn if drifting off-topic
5. Track AI assistance for transparency

CRITICAL: 
- Ask guiding questions: "What's your main point here?"
- Provide feedback: "This argument needs more case support"
- NEVER write paragraphs for them
- Remind: "Make sure to cite [Case] when you mention this principle"

Academic Integrity Reminder: This is for understanding and guidance only.`,

    5: `${basePrompt}

STAGE 5: FORMATTING & CITATIONS

Your goals:
1. Help format citations to OSCOLA standard
2. Generate bibliography entries
3. Check Durham Law School style compliance
4. Validate word count calculations

OSCOLA Quick Reference:
- Cases: Party v Party [Year] Citation, page
- Books: Author, Title (Edition, Publisher Year) page
- Articles: Author, 'Title' [Year] Journal Vol, page

Provide specific formatting corrections.`,

    6: `${basePrompt}

STAGE 6: FINAL REVIEW

Your goals:
1. Final proofreading suggestions
2. Submission checklist review
3. AI usage declaration generation
4. Plagiarism awareness reminder

Remind student:
- Run through university plagiarism checker
- Include AI assistance declaration in footnote
- Check file format and deadline
- Review tutor name requirement`
  };

  return stagePrompts[stage as keyof typeof stagePrompts] || basePrompt;
}

async function getAIResponse(systemPrompt: string, userMessage: string, provider: string): Promise<string> {
  console.log('[getAIResponse] Called with provider:', provider);
  
  if (provider === 'openai') {
    // Validate API key exists
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    console.log('[getAIResponse] OpenAI API key exists, length:', process.env.OPENAI_API_KEY.length);
    
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      console.log('[getAIResponse] OpenAI client created, calling API...');
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      console.log('[getAIResponse] OpenAI API responded successfully');
      
      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('OpenAI returned empty response');
      }
      
      return response.choices[0].message.content;
    } catch (error: any) {
      console.error('[getAIResponse] OpenAI Error:', {
        message: error.message,
        type: error.type,
        code: error.code,
        status: error.status
      });
      throw new Error(`OpenAI API Error: ${error.message}`);
    }

  } else if (provider === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: 'Understood. I will follow these guidelines.' }],
          },
        ],
      });

      const result = await chat.sendMessage(userMessage);
      return result.response.text();
    } catch (error: any) {
      console.error('[getAIResponse] Gemini Error:', error);
      throw new Error(`Gemini API Error: ${error.message}`);
    }
  }

  throw new Error(`Invalid AI provider: ${provider}`);
}
