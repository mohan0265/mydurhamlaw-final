// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

type Body = {
  bucket: string;
  path: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
};

function getBearerToken(req: NextApiRequest) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

function extFromName(name: string) {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

async function extractText(buf: Buffer, ext: string) {
  if (ext === 'pdf') {
    const out = await pdfParse(buf);
    return (out.text || '').trim();
  }
  if (ext === 'docx') {
    const out = await mammoth.extractRawText({ buffer: buf });
    return (out.value || '').trim();
  }
  if (ext === 'doc') {
    throw new Error('DOC format not supported. Please re-save as DOCX and upload again.');
  }
  throw new Error(`Unsupported file type: ${ext}`);
}

// Improved parser for Durham Law assignment briefs
function parseFields(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Extract module code (e.g., "LAW 1081", "LAW1081", "LAW 2035")
  const moduleCodeMatch = text.match(/LAW\s*\d{4}/i);
  const module_code = moduleCodeMatch ? moduleCodeMatch[0].replace(/\s+/g, ' ') : null;
  
  // Extract module name - usually follows module code on same line or next line
  let module_name = null;
  if (module_code) {
    // Try to find the line with module code and extract what follows
    const moduleLineMatch = text.match(new RegExp(`${module_code}\\s+(.+?)(?:Formative|Summative|Assignment|\\n)`, 'i'));
    if (moduleLineMatch) {
      module_name = moduleLineMatch[1].trim();
    }
  }
  
  // Extract deadline (various formats)
  const deadlinePatterns = [
    /Deadline:\s*(.+?)(?:\n|at\s+\d)/i,
    /Due(?:\s+date)?:\s*(.+?)(?:\n|at\s+\d)/i,
    /Submit(?:.*?)by:?\s*(.+?)(?:\n|at\s+\d)/i
  ];
  
  let due_date = null;
  for (const pattern of deadlinePatterns) {
    const match = text.match(pattern);
    if (match) {
      const dateStr = match[1].trim();
      // Try to parse into ISO format
      try {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          due_date = parsed.toISOString();
          break;
        }
      } catch {
        // Keep as string if can't parse
        due_date = dateStr;
        break;
      }
    }
  }
  
  // Extract word limit
  const wlMatch = text.match(/word\s*limit[:\s]*([0-9]{1,3}(?:,\d{3})*)/i);
  const word_limit = wlMatch ? parseInt(wlMatch[1].replace(/,/g, ''), 10) : null;
  
  // Title - try to get assignment title, fallback to module name + "Assignment"
  let title = 'Untitled Assignment';
  const titleMatch = text.match(/(?:LAW\s*\d{4}\s+)(.+?)(?:Formative|Summative|Assignment)/i);
  if (titleMatch) {
    title = titleMatch[1].trim() + ' Assignment';
  } else if (module_name) {
    title = `${module_name} Assignment`;
  } else if (lines[0]) {
    title = lines[0].slice(0, 180);
  }
  
  const description = text.slice(0, 2000); // Store excerpt
  
  return { 
    title, 
    module_code,
    module_name,
    due_date,
    word_limit, 
    description, 
    submission_requirements: null 
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Bearer token
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization Bearer token' });
    }

    const body = req.body as Body;
    if (!body?.bucket || !body?.path) {
      return res.status(400).json({ error: 'Missing bucket/path' });
    }

    const admin = getSupabaseAdmin();
    
    if (!admin) {
        throw new Error('Supabase Admin not initialized');
    }

    // Verify user from token (CRITICAL: needed because assignments.user_id is NOT NULL)
    const userResp = await admin.auth.getUser(token);
    const userId = userResp.data?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Download file from storage
    const dl = await admin.storage.from(body.bucket).download(body.path);
    if (dl.error) throw dl.error;

    const arr = await dl.data.arrayBuffer();
    const buf = Buffer.from(arr);

    // Extract text
    const ext = extFromName(body.path) || extFromName(body.originalName || '');
    const text = await extractText(buf, ext);

    if (!text || text.length < 40) {
      return res.status(422).json({ error: 'Could not extract readable text from file.' });
    }

    // Parse fields
    const fields = parseFields(text);

    // DON'T create assignment here - the form will do it!
    // Just return extracted data for form auto-fill
    return res.status(200).json({
      extractedData: {
        title: fields.title,
        module_code: fields.module_code,
        module_name: fields.module_name,
        due_date: fields.due_date,
        word_limit: fields.word_limit,
        description: fields.description,
      },
      extractedPreview: text.slice(0, 1200),
      // Store upload path so form can link it later
      uploadedFile: {
        bucket: body.bucket,
        path: body.path,
        originalName: body.originalName,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
      },
    });
  } catch (e: any) {
    console.error('Ingest error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
