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

  // 1) AUTH: Try to get user, but allow anonymous for now (TEMPORARY FIX)
  const { user } = await getServerUser(req, res);
  
  if (!user) {
    console.warn('[PARSE] No user session found - allowing anonymous upload (TEMPORARY)');
  }

  // 2) RATE LIMIT: Only if we have a user
  if (user) {
    const limiter = createUserRateLimit({
      maxRequests: 5,
      windowMs: 10 * 60 * 1000,
      getUserId: () => user.id,
    });

    await runMiddleware(req, res, limiter);
    if (res.writableEnded) return;
  }

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
      const arrayBuffer = await fileResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (fileName.endsWith('.docx')) {
      const arrayBuffer = await fileResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      throw new Error('Unsupported file type');
    }

    // 3. Simple extraction (no AI - faster and more reliable)
    const parsedData = extractBasicInfo(extractedText);

    // 4. Save to database (optional)
    const supabase = getSupabaseClient();
    if (supabase && assignmentId && user) {
      await supabase.from('assignment_briefs').insert({
        assignment_id: assignmentId,
        user_id: user.id,
        original_filename: fileName,
        file_url: fileUrl,
        parsed_text: extractedText,
        parsed_data: parsedData,
      });
    }

    return res.status(200).json({
      success: true,
      parsedData,
      extractedText: extractedText.substring(0, 500),
    });

  } catch (error: any) {
    console.error('Parse error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to parse document' 
    });
  }
}

// Simple extraction using regex (fast, no AI needed)
function extractBasicInfo(text: string) {
  // Extract module code (e.g., LAW1011, LAW 1011)
  const moduleMatch = text.match(/LAW\s*\d{4}/i);
  const moduleCode = moduleMatch ? moduleMatch[0].replace(/\s/g, '') : null;

  // Extract due date (various formats)
  const dateMatch = text.match(/(?:due|deadline|submit(?:ting)?.*?by)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i);
  const dueDate = dateMatch ? dateMatch[1] : null;

  // Extract word limit
  const wordMatch = text.match(/(\d{1,5})\s*words?/i);
  const wordLimit = wordMatch ? wordMatch[1] : null;

  // Use first paragraph or title as title
  const lines = text.split('\n').filter(l => l.trim());
  const title = lines[0]?.substring(0, 100) || 'Untitled Assignment';

  return {
    title,
    moduleCode,
    moduleName: null,
    type: 'Essay',
    dueDate,
    wordLimit,
    fullText: text.substring(0, 2000), // First 2000 chars
  };
}
