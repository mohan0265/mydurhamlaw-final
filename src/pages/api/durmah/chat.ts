import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { enhanceDurmahContext } from '@/lib/durmah/contextBuilderEnhanced';
import { DEFAULT_TZ, formatNowPacket, getDaysLeft } from '@/lib/durmah/timezone';

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

  try {
    // Auth
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[durmah/chat] Auth error:', authError?.message || 'No user');
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const userId = user.id;

    // Get or create thread
    const { data: thread } = await supabase
      .from('durmah_threads')
      .select('id, onboarding_state, last_summary, last_message_at')
      .eq('user_id', userId)
      .maybeSingle();

    const threadId = thread?.id || (await supabase
      .from('durmah_threads')
      .upsert({
        user_id: userId,
        onboarding_state: 'new',
        last_seen_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select('id')
      .single()).data?.id;

    // Get recent messages
    const { data: recentMessages } = await supabase
      .from('durmah_messages')
      .select('role, content, source, created_at')
      .eq('user_id', userId)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(12);

    const baseContext = {
      userId,
      threadId,
      onboardingState: thread?.onboarding_state || 'active',
      lastSummary: thread?.last_summary,
      recentMessages: recentMessages || [],
    };
    
    // Enhance context with assignments and AWY data
    const context = await enhanceDurmahContext(supabase, userId, baseContext as any);
    
    // Parse request body
    const { message, source, sessionId } = (req.body || {}) as { 
      message?: string; 
      source?: string; 
      sessionId?: string;
    };
    const incoming = (message || '').trim();
    const nowIso = new Date().toISOString();

    // Build conversation history
    const history = (recentMessages || []).slice(-10).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));
    
    // Build system prompt
    const { buildDurmahSystemPrompt, buildDurmahContextBlock } = await import('@/lib/durmah/systemPrompt');
    let fullSystemPrompt = buildDurmahSystemPrompt();
    
    const ctx = context as any;
    if (ctx.assignments || ctx.profile) {
      const timeZone = DEFAULT_TZ;
      const nowPacket = formatNowPacket(new Date(), timeZone);
      const todayKey = nowPacket.dayKey;
      
      const activeAssignments = ctx.assignments?.active || [];
      const overdueAssignments = ctx.assignments?.overdue || [];
      const recentlyCompleted = ctx.assignments?.recentlyCompleted || [];
      
      const upcomingFormatted = activeAssignments
        .filter((a: any) => a.dueDate)
        .map((a: any) => ({
          title: a.title,
          module: a.module,
          daysLeft: getDaysLeft(todayKey, a.dueDate, timeZone),
        }));
      
      const studentContext = {
        student: {
          displayName: ctx.profile?.displayName || 'Student',
          yearGroup: ctx.profile?.yearGroup || 'Unknown',
          term: ctx.academic?.term || 'Unknown',
          weekOfTerm: ctx.academic?.weekOfTerm || 0,
          localTimeISO: nowPacket.isoUTC,
          timezone: timeZone,
        },
        academic: {
          timezone: timeZone,
          now: nowPacket,
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
        lectures: {
          recent: (ctx.lectures?.recent || []).map((l: any) => ({
            id: l.id,
            title: l.title,
            module_code: l.module_code,
            module_name: l.module_name,
            lecture_date: l.lecture_date,
            status: l.status,
          })),
        },
      };
      const contextBlock = buildDurmahContextBlock(studentContext as any);
      fullSystemPrompt = `${fullSystemPrompt}\n\n${contextBlock}`;
    }
    
    // Add conversation history context
    const systemSummary = thread?.last_summary;
    if (systemSummary && !systemSummary.includes('Durmah')) {
      fullSystemPrompt += `\n\nPrevious conversation: ${systemSummary}`;
    }
    
    const prompt = [
      { role: 'system', content: fullSystemPrompt },
      ...history,
      { role: 'user', content: incoming || 'Please continue from where we left off.' },
    ];

    const reply = await callOpenAI(prompt as any);

    // Save messages with session ID
    const { data: insertedMessages } = await supabase.from('durmah_messages').insert([
      {
        thread_id: context.threadId,
        user_id: userId,
        role: 'user',
        content: incoming || '[no input]',
        source: source || 'dashboard',
        session_id: sessionId,
        saved_at: null 
      },
      {
        thread_id: context.threadId,
        user_id: userId,
        role: 'assistant',
        content: reply,
        source: source || 'dashboard',
        session_id: sessionId,
        saved_at: null 
      },
    ]).select('id, role');

    const userMsgId = insertedMessages?.find(m => m.role === 'user')?.id;
    const assistantMsgId = insertedMessages?.find(m => m.role === 'assistant')?.id;

    // Update summary
    const nextSummary = reply.length > 300 ? reply.slice(0, 280) + '…' : reply;

    await supabase
      .from('durmah_threads')
      .update({
        last_summary: nextSummary,
        last_message_at: nowIso,
        last_seen_at: nowIso,
      })
      .eq('id', context.threadId);

    return res.status(200).json({ ok: true, reply, onboardingState: context.onboardingState, userMsgId, assistantMsgId });
  } catch (err: any) {
    console.error('[durmah/chat] error', err);
    return res.status(500).json({ ok: false, error: err?.message || 'chat_failed' });
  }
}
