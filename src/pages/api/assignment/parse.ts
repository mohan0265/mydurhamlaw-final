import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { getServerUser } from '@/lib/api/serverAuth';
import { createUserRateLimit } from '@/lib/middleware/rateLimiter';
import { getSupabaseClient } from '@/lib/supabase/client';

// Disable bodyParser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

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

  // 1) AUTH: require logged-in user
  const { user } = await getServerUser(req, res);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized - please sign in' });
  }

  // 2) RATE LIMIT: 5 uploads per 10 minutes (prevent abuse)
  const limiter = createUserRateLimit({
    maxRequests: 5,
    windowMs: 10 * 60 * 1000,
    getUserId: async () => user.id,
  });

  await runMiddleware(req, res, limiter);
  if (res.writableEnded) return;

  const { fileUrl, fileName, assignmentId } = req.body;

  if (!fileUrl || !fileName) {
    return res.status(400).json({ error: 'Missing fileUrl or fileName' });
  }

  try {
    // 1. Download the file
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error('Failed to download file');
    }

    // 2. Extract text based on file type
    let extractedText = '';
    
    if (fileName.endsWith('.pdf')) {
      // For PDF, we'll use pdf-parse on backend
      const arrayBuffer = await fileResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Use pdf-parse library (needs to be installed)
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (fileName.endsWith('.docx')) {
      // For Word docs, use mammoth
      const arrayBuffer = await fileResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      throw new Error('Unsupported file type');
    }

    // 3. Use AI to parse the document
    const aiProvider = process.env.ASSIGNMENT_AI_PROVIDER || 'openai'; // 'openai' or 'gemini'
    const parsedData = await parseWithAI(extractedText, aiProvider);

    // 4. Save to database
    const supabase = getSupabaseClient();
    if (supabase && assignmentId) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase.from('assignment_briefs').insert({
          assignment_id: assignmentId,
          user_id: userData.user.id,
          original_filename: fileName,
          file_url: fileUrl,
          parsed_text: extractedText,
          parsed_data: parsedData,
        });
      }
    }

    res.status(200).json({
      success: true,
      parsedData,
      extractedText: extractedText.substring(0, 500), // First 500 chars for preview
    });

  } catch (error: any) {
    console.error('Parse error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse document' });
  }
}

async function parseWithAI(text: string, provider: string) {
  const prompt = `
You are an AI assistant helping to parse a university law assignment brief.

Extract the following information from this text:

TEXT:
${text}

Return a JSON object with these fields:
{
  "deadline": "YYYY-MM-DD HH:mm format or null",
  "wordLimit": number or null,
  "moduleCode": "e.g., LAW1081" or null,
  "moduleName": "e.g., The Individual and the State" or null,
  "questionText": "The full assignment question/problem scenario",
  "requirements": ["list", "of", "requirements"],
  "citationStyle": "e.g., OSCOLA" or null,
  "specialInstructions": "Any special notes about AI use, formatting, etc.",
  "assessmentType": "essay" or "problem question" or "other"
}

Be precise. If information is not found, use null. Extract exact dates and numbers.
`;

  if (provider === 'openai') {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a precise document parser. Always return valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    return JSON.parse(response.choices[0].message.content);

  } else if (provider === 'gemini') {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from response (Gemini might wrap it in markdown)
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    
    return JSON.parse(responseText);
  }

  throw new Error('Invalid AI provider');
}
