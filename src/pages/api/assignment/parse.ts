import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerUser } from '@/lib/api/serverAuth';
import { createUserRateLimit } from '@/lib/middleware/rateLimiter';
import { getSupabaseClient } from '@/lib/supabase/client';

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
    // Simple extraction - just return the filename and basic info
    // Skip actual PDF/DOCX parsing to avoid dependency issues
    const parsedData = extractBasicInfo(fileName);

    // Save to database (optional)
    const supabase = getSupabaseClient();
    if (supabase && assignmentId && user) {
      await supabase.from('assignment_briefs').insert({
        assignment_id: assignmentId,
        user_id: user.id,
        original_filename: fileName,
        file_url: fileUrl,
        parsed_text: '',
        parsed_data: parsedData,
      });
    }

    return res.status(200).json({
      success: true,
      parsedData,
      extractedText: '',
    });

  } catch (error: any) {
    console.error('Parse error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to parse document' 
    });
  }
}

// Simple extraction based on filename
function extractBasicInfo(fileName: string) {
  // Extract module code from filename (e.g., LAW1011)
  const moduleMatch = fileName.match(/LAW\s*\d{4}/i);
  const moduleCode = moduleMatch ? moduleMatch[0].replace(/\s/g, '') : null;

  // Use filename as title (remove extension)
  const title = fileName.replace(/\.(pdf|docx?)$/i, '').substring(0, 100);

  return {
    title,
    moduleCode,
    moduleName: null,
    type: 'Essay',
    dueDate: null,
    wordLimit: null,
    fullText: 'File uploaded. Manual entry required for details.',
  };
}
