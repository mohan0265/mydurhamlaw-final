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

    // 2. Fetch Grounding Context
    let groundingData = "";
    let sources = [];
    const { quiz_type, target_id, module_code, quiz_style = 'quick' } = session;

    if (quiz_type === 'lecture' && target_id) {
       const { data: transcript } = await supabase
         .from('lecture_transcripts')
         .select('transcript_text, lecture_id')
         .eq('lecture_id', target_id)
         .single();
       if (transcript) {
         groundingData = transcript.transcript_text;
         sources.push({ type: 'lecture', id: target_id, title: 'Lecture Transcript' });
       }
    } else if (quiz_type === 'assignment' && target_id) {
       const { data: assignment } = await supabase
         .from('assignments')
         .select('id, title, content')
         .eq('id', target_id)
         .single();
       if (assignment) {
         groundingData = `Assignment Title: ${assignment.title}\n\nBrief:\n${assignment.content}`;
         sources.push({ type: 'assignment', id: target_id, title: assignment.title });
       }
    } else if (quiz_type === 'module' || quiz_type === 'general') {
       const { data: content } = await supabase
         .from('durham_academic_content')
         .select('id, content, title')
         .eq('module_code', module_code || 'GEN')
         .limit(5);
       if (content && content.length > 0) {
         groundingData = content.map(c => `[${c.title}]: ${c.content}`).join('\n\n');
         content.forEach(c => sources.push({ type: 'academic_content', id: c.id, title: c.title }));
       }
    }

    // 3. Utility Question Detection (Allow basic app support questions)
    const utilityPatterns = [
      /mic|microphone|voice|audio|hear me|speak|talking|recording/i,
      /how (do|does|can|to)/i,
      /help|stuck|problem|issue|not working|broken/i,
      /navigation|button|click|where|find/i,
      /hello|hi|hey|test/i
    ];
    const isUtilityQuestion = utilityPatterns.some(p => p.test(message));

    // 4. Retrieval Threshold Check (Skip for utility questions)
    const minSources = (quiz_style === 'irac' || quiz_style === 'hypo') ? 3 : 1;
    if (!groundingData || sources.length < minSources) {
      if (!groundingData && !isUtilityQuestion) {
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answer: "I don't have enough Durham-specific material to quiz you accurately. Please select a lecture, assignment, or module outcomes with available content.",
            sources: []
          })
        };
      }
    }

    // 5. Prepare Prompt
    const utilityContext = isUtilityQuestion && !groundingData ? `
NOTE: The student is asking a UTILITY or APP SUPPORT question, not a legal question.
For utility questions:
- If about mic/voice: Confirm you can hear them and the voice feature is working. Suggest they try speaking a short legal term to test.
- If about navigation: Provide helpful guidance on how to use the Quiz Me feature.
- If a greeting/test: Respond warmly and invite them to start their legal reasoning practice.
Always be helpful and friendly for these non-academic questions.
` : '';

    const systemPrompt = `
You are Durmah, an expert law tutor for Durham University law students.
You are in "QUIZ ME" mode. Your goal is to test the student's understanding of the provided Durham-specific context.

${utilityContext}

CURRENT STYLE: ${quiz_style}
(Styles: quick = definitions/key facts, irac = Issue/Rule/App/Conclusion, hypo = complex problem solving, counter = debate/rebuttal)

GROUNDING DATA (STRICT SOURCE):
${groundingData || 'No specific grounding data loaded for this session yet.'}

INSTRUCTIONS:
1. ONLY use facts from the GROUNDING DATA for LEGAL questions. Do not hallucinate case names or statutes not present in the data.
2. For UTILITY questions (mic tests, navigation help, greetings), respond helpfully and warmly.
3. Structure every evaluation of student legal answers using this RUBRIC:
   - **What you did well**: 1-2 positive points about their logic.
   - **What to improve**: Specific areas of reasoning to tighten.
   - **Model Structure (IRAC)**: A brief bulleted breakdown of the "Ideal" answer.
   - **"Speak Law" Rewrite**: 1-2 sentences of how to say this naturally and authoritatively in a seminar.
4. Then, ask the NEXT QUESTION to keep the session active.
5. If the grounding data is insufficient for a detail asked by the student, say: "My records for this specific module detail are limited, but based on the provided brief..."
    `;

    // 5. history and call...
    const { data: history } = await supabase
      .from('quiz_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(8);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    const answer = completion.choices[0].message.content;

    // 6. Persistence
    const { data: assistantMsg } = await supabase
      .from('quiz_messages')
      .insert({ session_id: sessionId, user_id: userId, role: 'assistant', content: answer })
      .select()
      .single();

    if (assistantMsg && sources.length > 0) {
       const sourceInserts = sources.slice(0, 3).map(s => ({
         message_id: assistantMsg.id,
         source_type: s.type || 'academic_content',
         source_id: s.id || null,
         content_snippet: groundingData.substring(0, 500) // Simplified for now
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
