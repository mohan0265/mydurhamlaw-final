import type { NextApiRequest, NextApiResponse } from 'next';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

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

// Simple deterministic parser (no AI)
function parseFields(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const title = (lines[0] || 'Untitled Assignment').slice(0, 180);

  // Find module
  const moduleLine = lines.find(l => /module|course|paper/i.test(l));
  const module = moduleLine ? moduleLine.slice(0, 120) : null;

  // Find word limit
  const wlMatch = text.match(/word\s*limit\s*[:\s]*([0-9]{3,5})/i);
  const word_limit = wlMatch ? parseInt(wlMatch[1], 10) : null;

  const description = text.slice(0, 2000); // Store excerpt

  return { 
    title, 
    module, 
    due_date: null as string | null,
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

    // Insert assignment (matches YOUR schema exactly)
    const ins = await admin
      .from('assignments')
      .insert({
        user_id: userId,
        title: fields.title,
        module_code: fields.module,
        module_name: fields.module,
        description: fields.description,
        due_date: fields.due_date,
        status: 'not_started',
        estimated_effort_hours: fields.word_limit ? Math.ceil(fields.word_limit / 500) : null,
        assignment_type: 'Essay', // Default
        question_text: text.slice(0, 1000),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (ins.error) throw ins.error;

    // Save file reference in assignment_files table
    const fileIns = await admin.from('assignment_files').insert({
      assignment_id: ins.data.id,
      user_id: userId,
      bucket: body.bucket,
      path: body.path,
      original_name: body.originalName || null,
      mime_type: body.mimeType || null,
      size_bytes: body.sizeBytes ?? null,
    });

    if (fileIns.error) {
      console.error('Failed to save file reference:', fileIns.error);
      // Don't fail the whole request
    }

    return res.status(200).json({
      assignment: ins.data,
      extractedPreview: text.slice(0, 1200),
    });
  } catch (e: any) {
    console.error('Ingest error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
