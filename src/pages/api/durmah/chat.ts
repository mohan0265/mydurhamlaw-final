import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { enhanceDurmahContext } from '@/lib/durmah/contextBuilderEnhanced';
import { DEFAULT_TZ, formatNowPacket, getDaysLeft } from '@/lib/durmah/timezone';
import { buildDurmahSystemPrompt, buildDurmahContextBlock } from '@/lib/durmah/systemPrompt';

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

    // 5. Construct Chat History for LLM
    // enhancedContext.recentMemories contains the merged history from retrieval.
    const historyMessages = (enhancedContext.recentMemories || []).map((m: any) => ({
        role: m.role as 'user'|'assistant',
        content: m.content
    }));
    
    const messagesForLLM = [
        { role: 'system' as const, content: systemPromptText },
        ...historyMessages,
        { role: 'user' as const, content: message }
    ];

    // 6. Persist USER Message
    console.log('[chat] Saving user message...');
    const { data: userMsgData, error: insertError } = await supabase.from('durmah_messages').insert({
        user_id: userId,
        role: 'user',
        content: message,
        conversation_id: finalConversationId, // UNIFIED
        source,
        scope,
        visibility,
        context: context, // Store raw context JSON
        modality,
    }).select('id').single();

    if (insertError) {
        console.error('Failed to save user message', insertError);
        // We continue anyway, though history might be desynced
    }

    // 7. Get AI Response
    console.log('[chat] Calling OpenAI...');
    const reply = await callOpenAI(messagesForLLM);

    // 8. Persist ASSISTANT Message
    console.log('[chat] Saving assistant response...');
    const { data: assistantMsgData, error: assistantInsertError } = await supabase.from('durmah_messages').insert({
         user_id: userId,
         role: 'assistant',
         content: reply,
         conversation_id: finalConversationId,
         source,
         scope,
         scope_id: context.lectureId || context.assignmentId || undefined, // Store ID if available for easier filtering later
         visibility: 'ephemeral', // Assistant replies ephemeral by default
         context: context,
         modality: 'text'
    }).select('id').single();

    if (assistantInsertError) {
        console.error('Failed to save assistant message', assistantInsertError);
    }

    return res.status(200).json({ 
        ok: true, 
        reply, 
        userMsgId: userMsgData?.id, 
        assistantMsgId: assistantMsgData?.id 
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
