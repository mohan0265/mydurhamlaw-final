import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { buildModuleContext } from '@/lib/durmah/context';

// Placeholder for actual LLM call - replace with your existing AI service wrapper
async function generateArtifactContent(type: string, context: any): Promise<string> {
    // In production, this calls OpenAI/Gemini with the context
    return `**Generated ${type}**\n\nBased on your lectures: ${context.lectures.map((l:any) => l.title).join(', ')}.\n\n*(AI Content Would Go Here)*`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { module_id, workspace_id, type, title } = req.body;

  if (!module_id || !workspace_id || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
      // 1. Build Grounded Context
      const context = await buildModuleContext(supabase, session.user.id, module_id);

      // 2. Generate Content via AI (Mocked here, integrate with your lib/ai/...)
      const content_md = await generateArtifactContent(type, context);

      // 3. Save Artifact
      const { data, error } = await supabase
          .from('exam_artifacts')
          .insert({
              user_id: session.user.id,
              module_id,
              workspace_id,
              type,
              title: title || `Generated ${type}`,
              content_md,
              source_refs: context.lectures.map(l => ({ kind: 'lecture', id: l.id, title: l.title }))
          })
          .select()
          .single();

      if (error) throw error;

      return res.status(200).json(data);

  } catch (err: any) {
      console.error('Artifact generation failed:', err);
      return res.status(500).json({ error: err.message });
  }
}
