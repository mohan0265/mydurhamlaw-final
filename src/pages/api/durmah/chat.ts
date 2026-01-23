import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { enhanceDurmahContext } from '@/lib/durmah/contextBuilderEnhanced';
import { DEFAULT_TZ, formatNowPacket, getDaysLeft } from '@/lib/durmah/timezone';
import { buildDurmahSystemPrompt, buildDurmahContextBlock } from '@/lib/durmah/systemPrompt';
import type { PostgrestError } from '@supabase/supabase-js';

// Helper: Call OpenAI
async function callOpenAI(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]) {
  if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
  
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
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
    // 1. Auth
    const supabase = createPagesServerClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const userId = user.id;
    
    // 2. Parse Body
    const { 
      message = '', 
      conversationId, 
      source = 'widget', 
      scope = 'global', 
      visibility = 'ephemeral',
      context = {},
      modality = 'text'
    } = req.body;

    if (!message.trim()) {
       return res.status(400).json({ ok: false, error: 'empty_message' });
    }
    
    const finalConversationId = conversationId || crypto.randomUUID();

    // Normalize scope_id (lecture/assignment UUID if present)
    const scopeId =
      (context?.lectureId && typeof context.lectureId === 'string' && context.lectureId.length === 36)
        ? context.lectureId
        : (context?.assignmentId && typeof context.assignmentId === 'string' && context.assignmentId.length === 36)
          ? context.assignmentId
          : null;

    // Insert helper: retries without scope_id if column missing in DB
    async function insertDurmahMessage(payload: any): Promise<{ data: any; error: PostgrestError | null; usedScopeId: boolean }> {
      
      // New Logic: Check if Assignment Scope -> Redirect to new tables
      if (scope === 'assignment' && context?.assignmentId) {
          const sessionId = payload.conversation_id;
          const assignmentId = context.assignmentId;
          
          // 1. Ensure Session
          await supabase.from('assignment_sessions').upsert({
              id: sessionId,
              assignment_id: assignmentId,
              user_id: userId,
              title: 'Assignment Chat' // Could be better but efficient
          }, { onConflict: 'id' });

          // 1.5 Deduplication Check (Dedupe window: 3s)
          const threshold = new Date(Date.now() - 3000).toISOString();
          const { data: existing, error: checkError } = await supabase
              .from('assignment_session_messages')
              .select('id')
              .eq('session_id', sessionId)
              .eq('user_id', userId)
              .eq('role', payload.role)
              .eq('content', payload.content)
              .gt('created_at', threshold)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

          if (!checkError && existing) {
              console.log('[chat] Skipping duplicate insert for:', payload.role);
              return { data: existing, error: null, usedScopeId: true };
          }

          // 2. Insert Message
          const { data, error } = await supabase.from('assignment_session_messages').insert({
              session_id: sessionId,
              user_id: userId,
              role: payload.role,
              content: payload.content,
              // sentiment/tokens can be added later
          }).select('id').single();

          return { data, error, usedScopeId: true };
      }

      // Legacy Logic
      const attempt = async (p: any) => {
        return await supabase
          .from('durmah_messages')
          .insert(p)
          .select('id')
          .single();
      };

      const { data, error } = await attempt(payload);
      if (!error) return { data, error: null, usedScopeId: 'scope_id' in payload };

      const msg = (error as any)?.message || '';
      const details = (error as any)?.details || '';
      const combined = `${msg} ${details}`.toLowerCase();

      // Common Supabase/Postgres phrasing: "column \"scope_id\" of relation \"durmah_messages\" does not exist"
      if (combined.includes('scope_id') && combined.includes('does not exist')) {
        console.warn('[chat] scope_id column missing, retrying insert without it');
        const fallback = { ...payload };
        delete fallback.scope_id;
        const retry = await attempt(fallback);
        return { data: retry.data, error: retry.error, usedScopeId: false };
      }

      return { data: null, error, usedScopeId: 'scope_id' in payload };
    }

    // 3. Build Durmah Context (Two-Stage Retrieval)
    // We pass finalConversationId so the builder can fetch Local History + Global Tail
    const baseCtx = { 
        student: { displayName: '', yearGroup: '', term: '', weekOfTerm: 0, localTimeISO: new Date().toISOString() },
        assignments: { upcoming: [], overdue: [], recentlyCreated: [], total: 0 },
        schedule: { todaysClasses: [] }
    };

    let enhancedContext = baseCtx as any;
    try {
        console.log('[chat] Building context for:', userId);
        // PASS context.lectureId (if any) as activeLectureId
        // The centralized builder will fetch notes OR transcript fallback
        enhancedContext = await enhanceDurmahContext(supabase, userId, baseCtx as any, finalConversationId, context.lectureId);
    } catch (ctxErr) {
        console.error('[chat] Context enhancement failed, proceeding with base context:', ctxErr);
        // Fallback to base context is better than crashing
    }
    
    // 4. Construct System Prompt
    let systemPromptText = buildDurmahSystemPrompt(true);
    
    // Inject enhanced context block
    console.log('[chat] Building context block with keys:', Object.keys(enhancedContext));
    if (enhancedContext.lectures) console.log('[chat] Context Lectures:', enhancedContext.lectures?.recent?.length, 'Current:', !!enhancedContext.lectures?.current);
    if (enhancedContext.assignments) console.log('[chat] Context Assignments:', enhancedContext.assignments?.total);

    const contextBlock = buildDurmahContextBlock(enhancedContext);
    console.log('[chat] Context block built, length:', contextBlock.length);
    systemPromptText += `\n\n${contextBlock}`;

    // Note: Manual lecture fetching logic REMOVED - handled by enhanceDurmahContext + systemPrompt now.
    
    // ANTI-REPETITION OVERRIDE
    systemPromptText += `\n\n[CRITICAL INSTRUCTION: DO NOT REPEAT YOURSELF]\n- If the user asks why you are repeating yourself, apologize and CHANGE your phrasing significantly.\n- Do NOT use the same "I aim to provide..." template twice in a row.\n- If the user discusses "testing", acknowledge it briefly but do not loop into the same explanation unless asked.`;

    // 5. Construct Chat History for LLM
    // enhancedContext.recentMessages contains the merged history from retrieval.
    const historyMessages = (enhancedContext.recentMessages || []).map((m: any) => ({
        role: m.role as 'user'|'assistant',
        content: m.content
    }));
    
    const messagesForLLM = [
        { role: 'system' as const, content: systemPromptText },
        ...historyMessages,
        { role: 'user' as const, content: message }
    ];

    // 6. Persist USER Message (schema-safe)
    console.log('[chat] Saving user message...');
    const { data: userMsgData, error: insertError, usedScopeId: usedScopeIdUser } = await insertDurmahMessage({
        user_id: userId,
        role: 'user',
        content: message,
        conversation_id: finalConversationId,
        source,
        scope,
        scope_id: scopeId,
        visibility,
        context: context,
        modality,
    });

    if (insertError) {
        console.error('[chat] Failed to save user message:', insertError);
        // We continue anyway, though history might be desynced
    } else {
        console.log('[chat] User message saved:', userMsgData?.id, 'usedScopeId:', usedScopeIdUser);
    }

    // 7. Get AI Response
    console.log('[chat] Calling OpenAI...');
    const reply = await callOpenAI(messagesForLLM);

    // 8. Persist ASSISTANT Message (schema-safe)
    console.log('[chat] Saving assistant response...');
    const { data: assistantMsgData, error: assistantInsertError, usedScopeId: usedScopeIdAssistant } = await insertDurmahMessage({
         user_id: userId,
         role: 'assistant',
         content: reply,
         conversation_id: finalConversationId,
         source,
         scope,
         scope_id: scopeId,
         visibility: 'ephemeral', // Assistant replies ephemeral by default
         context: context,
         modality: 'text'
    });

    if (assistantInsertError) {
        console.error('[chat] Failed to save assistant message:', assistantInsertError);
    } else {
        console.log('[chat] Assistant message saved:', assistantMsgData?.id, 'usedScopeId:', usedScopeIdAssistant);
    }

    return res.status(200).json({ 
        ok: true, 
        reply, 
        userMsgId: userMsgData?.id, 
        assistantMsgId: assistantMsgData?.id,
        // Dev diagnostics for debugging persistence
        persistence: {
          userUsedScopeId: usedScopeIdUser,
          assistantUsedScopeId: usedScopeIdAssistant,
          userSaved: !!userMsgData?.id,
          assistantSaved: !!assistantMsgData?.id,
          assistantSaveError: process.env.NODE_ENV === 'development' ? (assistantInsertError as any)?.message : undefined
        }
    });

  } catch (err: any) {
    console.error('[durmah/chat] Critical error:', err);
    // Return actual error message for debugging (in dev/beta this is fine)
    return res.status(500).json({ 
        ok: false, 
        error: err?.message || 'chat_failed',
        stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
    });
  }
}
