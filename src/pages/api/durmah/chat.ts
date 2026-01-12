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
  return json.choices?.[0]?.message?.content || 'I am here if you want to continue.';
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
      `Welcome to MyDurhamLaw! You're on a 14-day trial. ` +
      `I'll keep this quick: Which year are you in (foundation/year1/year2/year3)? ` +
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
    
    // KNOWLEDGE FIX: Use full system prompt with student context
    // Import at top: buildDurmahSystemPrompt, buildDurmahContextBlock
    const { buildDurmahSystemPrompt, buildDurmahContextBlock } = await import('@/lib/durmah/systemPrompt');
    
    // Build context block if we have student data
    let fullSystemPrompt = buildDurmahSystemPrompt();
    
    // Context has assignments and schedule data from enhanceDurmahContext
    // Cast to any since enhanceDurmahContext adds extra properties
    const ctx = context as any;
    if (ctx.assignments || ctx.profile) {
      // Map enhanced context assignments to system prompt format
      // enhanceDurmahContext uses: active, overdue, recentlyCompleted
      // buildDurmahContextBlock expects: upcoming, overdue, recentlyCreated
      const activeAssignments = ctx.assignments?.active || [];
      const overdueAssignments = ctx.assignments?.overdue || [];
      const recentlyCompleted = ctx.assignments?.recentlyCompleted || [];
      
      // Transform active assignments to upcoming format with daysLeft
      const now = new Date();
      const upcomingFormatted = activeAssignments
        .filter((a: any) => a.dueDate)
        .map((a: any) => ({
          title: a.title,
          module: a.module,
          daysLeft: Math.max(0, Math.floor((new Date(a.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
        }));
      
      const studentContext = {
        student: {
          displayName: ctx.profile?.displayName || 'Student',
          yearGroup: ctx.profile?.yearGroup || 'Unknown',
          term: ctx.academic?.term || 'Unknown',
          weekOfTerm: ctx.academic?.weekOfTerm || 0,
          localTimeISO: new Date().toISOString(),
        },
        assignments: {
          upcoming: upcomingFormatted,
          overdue: overdueAssignments,
          recentlyCreated: recentlyCompleted.map((a: any) => ({ title: a.title, module: a.module })),
          total: ctx.assignments?.total || 0,
        },
        schedule: {
          todaysClasses: ctx.schedule?.todaysClasses || [],
        },
        yaag: ctx.yaag,
      };
      const contextBlock = buildDurmahContextBlock(studentContext as any);
      fullSystemPrompt = `${fullSystemPrompt}\n\n${contextBlock}`;
    }
    
    // Add conversation history context
    if (systemSummary && !systemSummary.includes('Durmah')) {
      fullSystemPrompt += `\n\nPrevious conversation: ${systemSummary}`;
    }
    
    const prompt = [
      { role: 'system', content: fullSystemPrompt },
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
