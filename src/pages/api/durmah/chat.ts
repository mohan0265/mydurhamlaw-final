import type { NextApiRequest, NextApiResponse } from 'next';
import { buildDurmahContext } from '@/lib/durmah/contextBuilder';
import { enhanceDurmahContext } from '@/lib/durmah/contextBuilderEnhanced';

async function callOpenAI(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      stream: false,
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`OpenAI error: ${resp.status} ${txt}`);
  }
  const json = await resp.json();
  return json.choices?.[0]?.message?.content || 'I'm here if you want to continue.';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const result = await buildDurmahContext(req);
  if (!result.ok) {
    return res.status(result.status === 'unauthorized' ? 401 : 500).json({ ok: false });
  }

  const { supabase, userId, context: baseContext } = result;
  
  // NEW: Enhance context with assignments and AWY data
  const context = await enhanceDurmahContext(supabase, userId, baseContext);
  const { message, source } = (req.body || {}) as { message?: string; source?: string };
  const incoming = (message || '').trim();
  const nowIso = new Date().toISOString();

  const recentMessages = context.recentMessages || [];
  const systemSummary =
    context.lastSummary && context.lastSummary.length > 0
      ? `Previous summary: ${context.lastSummary}`
      : 'You are Durmah, a supportive legal mentor for Durham law students on a 14-day trial.';

  const logs = {
    user_id: userId,
    thread_id: context.threadId,
    onboarding_state: context.onboardingState,
    continuation: context.onboardingState !== 'new',
  };
  console.log('[durmah/chat]', JSON.stringify(logs));

  // Onboarding path
  if (context.onboardingState === 'new') {
    const welcome =
      `Welcome to MyDurhamLaw! You’re on a 14-day trial. ` +
      `I’ll keep this quick: Which year are you in (foundation/year1/year2/year3)? ` +
      `Any key modules or deadlines this month?`;

    await supabase.from('durmah_messages').insert([
      {
        thread_id: context.threadId,
        user_id: userId,
        role: 'assistant',
        content: welcome,
        source: source || 'dashboard',
      },
    ]);

    await supabase
      .from('durmah_threads')
      .update({
        onboarding_state: 'active',
        last_summary: 'Onboarded; asked for year, modules, deadlines.',
        last_message_at: nowIso,
        last_seen_at: nowIso,
      })
      .eq('id', context.threadId);

    return res.status(200).json({
      ok: true,
      reply: welcome,
      onboardingState: 'active',
    });
  }

  // Continuation path
  try {
    const history = recentMessages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const prompt = [
      { role: 'system', content: systemSummary },
      ...history,
      { role: 'user', content: incoming || 'Please continue from where we left off.' },
    ];

    const reply = await callOpenAI(prompt as any);

    await supabase.from('durmah_messages').insert([
      {
        thread_id: context.threadId,
        user_id: userId,
        role: 'user',
        content: incoming || '[no input]',
        source: source || 'dashboard',
      },
      {
        thread_id: context.threadId,
        user_id: userId,
        role: 'assistant',
        content: reply,
        source: source || 'dashboard',
      },
    ]);

    // Update summary with trimmed reply (lightweight rolling summary)
    const nextSummary =
      reply.length > 300 ? reply.slice(0, 280) + '…' : reply;

    await supabase
      .from('durmah_threads')
      .update({
        last_summary: nextSummary,
        last_message_at: nowIso,
        last_seen_at: nowIso,
      })
      .eq('id', context.threadId);

    return res.status(200).json({ ok: true, reply, onboardingState: context.onboardingState });
  } catch (err: any) {
    console.error('[durmah/chat] error', err);
    return res.status(500).json({ ok: false, error: err?.message || 'chat_failed' });
  }
}
