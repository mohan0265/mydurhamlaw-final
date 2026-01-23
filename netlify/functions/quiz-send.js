const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiKey });

exports.handler = async (event, context) => {
  // CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: '' };
  }

  try {
    const { sessionId, userId, message, mode = 'quiz' } = JSON.parse(event.body);

    if (!sessionId || !userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing session or user ID' }) };
    }

    // 1. Fetch Session and Context
    const { data: session } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (!session) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Session not found' }) };
    }

    // 2. Fetch Grounding Context (Academic Content / Lecture / Assignment)
    let groundingData = "";
    let sources = [];

    if (session.quiz_type === 'lecture' && session.target_id) {
       const { data: transcript } = await supabase
         .from('lecture_transcripts')
         .select('transcript_text')
         .eq('lecture_id', session.target_id)
         .single();
       if (transcript) {
         groundingData = transcript.transcript_text;
         sources.push({ type: 'lecture', id: session.target_id, title: 'Lecture Transcript' });
       }
    } else if (session.quiz_type === 'module') {
       const { data: content } = await supabase
         .from('durham_academic_content')
         .select('content, title')
         .eq('module_code', session.module_code)
         .limit(5);
       if (content && content.length > 0) {
         groundingData = content.map(c => `[${c.title}]: ${c.content}`).join('\n\n');
         content.forEach(c => sources.push({ type: 'academic_content', title: c.title }));
       }
    }

    // 3. Prepare Prompt
    const systemPrompt = `
You are Durmah, an expert law tutor for Durham University law students.
You are in "QUIZ ME" mode. Your goal is to test the student's understanding of the provided context.

GROUNDING DATA:
${groundingData || "NO SPECIFIC CONTEXT PROVIDED. REFUSE TO QUIZ."}

INSTRUCTIONS:
1. ONLY use the grounding data for Durham-specific facts.
2. If the user asks something outside the data, clearly state: "My academic records for this topic don't cover that specific detail, but generally speaking..."
3. Use "Professor-style" feedback: rigorous, structured, and encouraging. Use the IRAC (Issue, Rule, Application, Conclusion) framework when evaluating their reasoning. Praise logical consistency and gently correct misapplications of principle.
4. Keep questions focused on high-level application and reasoning (problem-solving), not just memorisation of facts.
5. NEVER invent module requirements or Durham-specific rules. If the grounding data is missing a detail, acknowledge it.
    `;

    // 4. Get Conversation History
    const { data: history } = await supabase
      .from('quiz_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    // 5. Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.7,
    });

    const answer = completion.choices[0].message.content;

    // 6. Persistence: Save Messages & Sources
    const { data: userMsg } = await supabase
      .from('quiz_messages')
      .insert({ session_id: sessionId, user_id: userId, role: 'user', content: message })
      .select()
      .single();

    const { data: assistantMsg } = await supabase
      .from('quiz_messages')
      .insert({ session_id: sessionId, user_id: userId, role: 'assistant', content: answer })
      .select()
      .single();

    if (assistantMsg && sources.length > 0) {
       const sourceInserts = sources.map(s => ({
         message_id: assistantMsg.id,
         source_type: s.type || 'academic_content',
         source_id: s.id || null,
         content_snippet: groundingData.substring(0, 500),
         relevance_score: 0.95
       }));
       await supabase.from('quiz_message_sources').insert(sourceInserts);
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer,
        sources: sources.map(s => s.title)
      })
    };

  } catch (error) {
    console.error('Quiz Me Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
};
