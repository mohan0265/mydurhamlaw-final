import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { assignmentId, stage, userMessage, context } = req.body;

  if (!stage || !userMessage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const aiProvider = process.env.ASSIGNMENT_AI_PROVIDER || 'openai';
    const systemPrompt = getStageSystemPrompt(stage, context);
    
    const response = await getAIResponse(systemPrompt, userMessage, aiProvider);

    res.status(200).json({
      success: true,
      response,
      stage,
    });

  } catch (error: any) {
    console.error('Durmah stage error:', error);
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
  if (provider === 'openai') {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content;

  } else if (provider === 'gemini') {
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
  }

  throw new Error('Invalid AI provider');
}
