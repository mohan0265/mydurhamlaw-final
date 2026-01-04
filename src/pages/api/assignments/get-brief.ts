import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

type Response = {
  file?: {
    bucket: string;
    path: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { assignmentId } = req.query;

    if (!assignmentId || typeof assignmentId !== 'string') {
      return res.status(400).json({ error: 'Missing assignmentId' });
    }

    const admin = getSupabaseAdmin();

    // Query assignment_files for this assignment
    const { data, error } = await admin
      .from('assignment_files')
      .select('bucket, path, original_name, mime_type, size_bytes')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No file found is not an error, just return empty
      if (error.code === 'PGRST116') {
        return res.status(200).json({});
      }
      throw error;
    }

    return res.status(200).json({
      file: {
        bucket: data.bucket,
        path: data.path,
        originalName: data.original_name || 'assignment-brief.pdf',
        mimeType: data.mime_type || 'application/pdf',
        sizeBytes: data.size_bytes || 0,
      },
    });
  } catch (e: any) {
    console.error('Error fetching assignment brief:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
