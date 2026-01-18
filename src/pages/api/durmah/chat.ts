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
  const { message, source, mode, article } = (req.body || {}) as { message?: string; source?: string; mode?: string; article?: any };
  let incoming = (message || '').trim();
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
    // ------------------------------------------------------------------
    // PART C: Denmark Fix (server-side normalization)
    // ------------------------------------------------------------------
    if (/^(hi|hello|hey|yo|ok|thanks)\s+denmark\b/i.test(incoming) || /^denmark([,.!? ]|$)/i.test(incoming)) {
       console.log('[durmah/chat] Normalizing "Denmark" -> "Durmah" in greeting/address');
       incoming = incoming.replace(/\bdenmark\b/i, "Durmah");
    }

    // ------------------------------------------------------------------
    // NEW: Strict News Analysis Mode
    // ------------------------------------------------------------------
    const { mode, article } = (req.body || {}) as { mode?: string, article?: any };

    if (mode === 'NEWS_STRICT' && article) {
      console.log('[durmah/chat] Entering NEWS_STRICT mode for:', article.title);

      const strictPrompt = `
STRICT GROUNDING RULES:
1) Allowed facts are ONLY the exact text provided below in Title, Source, URL, and Summary.
2) Do NOT add any new factual statements about:
   - operations, capacity, prisoner types, sentences, rehab programs, security level
   - community impact, policy changes, overcrowding, inmate rights, etc
   unless those details are explicitly present in the provided summary.
3) Summary section must be paraphrases of the provided summary/title only.
4) "Legal concepts" and "essay angles" must be conditional + generic:
   - use phrases like "may raise issues around...", "could be used to discuss..."
   - avoid statements that assert real-world conditions (e.g., "overcrowding is an issue")
   - NEVER invent facts (e.g., "managed by Serco", "accommodates sex offenders") if not in source.
5) If input is thin, say so explicitly: "Based on the limited info provided..."
6) Output must follow the requested numbered structure (1-4). include Section 4: "Cite safely".
7) "Cite safely" reminder must reference only the given source + url.

PROVIDED INFORMATION:
Title: ${article.title}
Source: ${article.source}
URL: ${article.url}
Summary: ${article.summary || "No summary provided."}
${article.studentNotes ? `\nUSER NOTES / EXCERPTS:\n"${article.studentNotes}"\n(Treat these notes as part of the provided text to analyze)` : ''}
`;

      const prompt = [
        { role: 'system', content: strictPrompt },
        { role: 'user', content: incoming || "Please analyze this news item." }
      ];

      // Call Model
      let reply = await callOpenAI(prompt as any);

      // ------------------------------------------------------------------
      // SERVER-SIDE DRIFT GUARD (Hard Enforcement)
      // ------------------------------------------------------------------
      const allowedText = (article.title + " " + article.source + " " + article.url + " " + (article.summary || "")).toLowerCase();
      const lowerReply = reply.toLowerCase();

      const highRiskKeywords = ["rehabilitation", "overcrowding", "inmates", "sentences", "capacity", "security", "rights", "offenders", "punishment", "community impact", "economic", "conditions"];
      const driftPhrases = ["reflects the broader", "accommodates", "managed by"]; // "managed by" is risky if source is Gov but doesn't say who manages precise facility

      let driftDetected = false;

      // Check keywords
      for (const kw of highRiskKeywords) {
        if (lowerReply.includes(kw) && !allowedText.includes(kw)) {
          console.warn(`[durmah/chat] DRIFT DETECTED: Keyword '${kw}' found in reply but not in source.`);
          driftDetected = true;
          break;
        }
      }

      // Check phrases if not already caught
      if (!driftDetected) {
        for (const phrase of driftPhrases) {
          if (lowerReply.includes(phrase) && !allowedText.includes(phrase)) {
            console.warn(`[durmah/chat] DRIFT DETECTED: Phrase '${phrase}' found in reply but not in source.`);
            driftDetected = true;
            break;
          }
        }
      }

      // Fallback if drift detected
      if (driftDetected) {
        console.warn('[durmah/chat] Applying FALLBACK response due to drift.');
        reply = `Based only on the limited information you provided:

1. **Summary**: ${article.title} (${article.source}). The provided text mentions: ${article.summary ? article.summary.substring(0, 100) + "..." : "No specific details available."}

2. **Key Legal Concepts**:
   - Depending on the context, this topic may relate to *Public Law* (powers of the state).
   - It might also involve *Administrative Law* (procedural fairness).
   - (Note: Specific legal concepts cannot be determined from the limited text provided).

3. **Essay Angles**:
   - You could potentially discuss how such events illustrate statutory duties.
   - You might explore the role of the stated source (${article.source}) in the legal system.
   - *With limited info, avoid making specific claims.*

4. **Cite Safely**:
   - Source: ${article.source}
   - URL: ${article.url}
   - Reminder: Do not add facts (like overcrowding or rehabilitation) unless they are in your source text.`;
      } else {
        // Add transparency header if valid
        reply = `Based only on the limited information you provided...\n\n${reply}`;
      }

      // Save to history (optional, but good for UX continuity)
      await supabase.from('durmah_messages').insert([
        { thread_id: context.threadId, user_id: userId, role: 'user', content: incoming, source: source || 'news_analysis' },
        { thread_id: context.threadId, user_id: userId, role: 'assistant', content: reply, source: source || 'news_analysis' }
      ]);
      
      // Update summary for continuity
      await supabase.from('durmah_threads').update({
        last_message_at: nowIso,
        last_seen_at: nowIso,
        last_summary: `Analyzed news: ${article.title}`
      }).eq('id', context.threadId);

      return res.status(200).json({ ok: true, reply, onboardingState: context.onboardingState });
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
