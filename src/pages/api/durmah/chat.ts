import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { buildDurmahContext } from '@/lib/durmah/contextBuilder';
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

  // FIXED: Use standard Supabase auth helper (same as other endpoints)
  // This properly handles cookies unlike the custom getApiAuth function
  const supabase = createServerSupabaseClient({ req, res });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('[durmah/chat] Auth error:', authError?.message || 'No user');
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const userId = user.id;

  // Build minimal base context directly instead of calling buildDurmahContext
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
  const { data: messages } = await supabase
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
    recentMessages: messages || [],
  };
  
  // NEW: Enhance context with assignments and AWY data
  const context = await enhanceDurmahContext(supabase, userId, baseContext as any);
    const { message, source, mode, article, sessionId } = (req.body || {}) as { message?: string; source?: string; mode?: string; article?: any, sessionId?: string };
    let incoming = (message || '').trim();
    const nowIso = new Date().toISOString();
    
    // Ensure session ID if expected, though we can Default to a new one if missing?
    // We'll let database default handle it if missing (gen_random_uuid), or use provided.
    // Ideally we use the one providing by client for continuity.
    const activeSessionId = sessionId; // If undefined, DB default applies? No, DB default is robust but if we want to group user session we need it.
    // If client provides it, use it. If not, we can't really group "This session" effectively across backend calls unless we generate there.
    // Check insert spread.

    // ... (logic)

    // Save to history (optional, but good for UX continuity)
      const { data: inserted } = await supabase.from('durmah_messages').insert([
        { 
          thread_id: context.threadId, 
          user_id: userId, 
          role: 'user', 
          content: incoming, 
          source: source || 'news_analysis',
          session_id: activeSessionId,
          saved_at: null 
        },
        { 
          thread_id: context.threadId, 
          user_id: userId, 
          role: 'assistant', 
          content: reply, 
          source: source || 'news_analysis',
          session_id: activeSessionId,
          saved_at: null 
        }
      ]).select('id, role');

      const userMsgId = inserted?.find(m => m.role === 'user')?.id;
      const assistantMsgId = inserted?.find(m => m.role === 'assistant')?.id;
      
      // Update summary for continuity
      await supabase.from('durmah_threads').update({
        last_message_at: nowIso,
        last_seen_at: nowIso,
        last_summary: `Analyzed news: ${article.title}`
      }).eq('id', context.threadId);

      return res.status(200).json({ ok: true, reply, onboardingState: context.onboardingState, userMsgId, assistantMsgId });
    }
    
    // ------------------------------------------------------------------
    // END Strict News Logic -> Fallthrough to Standard Chat
    // ------------------------------------------------------------------

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
      // TIMEZONE TRUTH: Build NOW packet server-side
      const timeZone = DEFAULT_TZ;
      const nowPacket = formatNowPacket(new Date(), timeZone);
      const todayKey = nowPacket.dayKey;
      
      console.log(`[durmah/chat] NOW: ${nowPacket.nowText}`);
      
      // Map enhanced context assignments to system prompt format
      // enhanceDurmahContext uses: active, overdue, recentlyCompleted
      // buildDurmahContextBlock expects: upcoming, overdue, recentlyCreated
      const activeAssignments = ctx.assignments?.active || [];
      const overdueAssignments = ctx.assignments?.overdue || [];
      const recentlyCompleted = ctx.assignments?.recentlyCompleted || [];
      
      // Transform active assignments to upcoming format with TIMEZONE-AWARE daysLeft
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
        // TIMEZONE TRUTH: Include academic.now for system prompt
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
        // Lectures metadata only - content fetched on-demand via tool
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
    if (systemSummary && !systemSummary.includes('Durmah')) {
      fullSystemPrompt += `\n\nPrevious conversation: ${systemSummary}`;
    }
    
    const prompt = [
      { role: 'system', content: fullSystemPrompt },
      ...history,
      { role: 'user', content: incoming || 'Please continue from where we left off.' },
    ];

    const reply = await callOpenAI(prompt as any);

    const { data: insertedStandard } = await supabase.from('durmah_messages').insert([
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

    const userMsgId = insertedStandard?.find(m => m.role === 'user')?.id;
    const assistantMsgId = insertedStandard?.find(m => m.role === 'assistant')?.id;

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

    return res.status(200).json({ ok: true, reply, onboardingState: context.onboardingState, userMsgId, assistantMsgId });
  } catch (err: any) {
    console.error('[durmah/chat] error', err);
    return res.status(500).json({ ok: false, error: err?.message || 'chat_failed' });
  }
}
