// POST /api/lectures/process
// Transcribes audio using Whisper and generates AI notes
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
  maxDuration: 300, // 5 minutes for long audio
};

async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const formData = new FormData();
  
  // Determine file extension from mime type
  const extMap: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/x-m4a': 'm4a',
  };
  const ext = extMap[mimeType] || 'mp3';
  
  const blob = new Blob([audioBuffer], { type: mimeType });
  formData.append('file', blob, `audio.${ext}`);
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');
  formData.append('response_format', 'text');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper API error: ${response.status} ${error}`);
  }

  return response.text();
}

async function generateNotes(transcript: string, lectureTitle: string, moduleName: string): Promise<{
  summary: string;
  key_points: string[];
  discussion_topics: string[];
  exam_prompts: string[];
  glossary: Array<{ term: string; definition: string }>;
  engagement_hooks: string[];
}> {
  const prompt = `You are an expert law lecturer assistant AND engaging mentor. Analyze this lecture transcript and generate study notes that SPARK INTEREST and make learning exciting!

LECTURE: ${lectureTitle}
MODULE: ${moduleName || 'Law'}

TRANSCRIPT:
${transcript.substring(0, 15000)} ${transcript.length > 15000 ? '... [truncated]' : ''}

Generate the following in JSON format:
{
  "summary": "2-3 paragraphs summarizing the main themes and arguments. Make it accessible and interesting!",
  "key_points": ["8-12 bullet point key takeaways - phrase them in memorable, student-friendly language"],
  "discussion_topics": ["5 thought-provoking questions that CHALLENGE assumptions and spark debate. Use the Socratic method - 'What if...?' style questions"],
  "exam_prompts": ["5 potential exam question prompts - frame as 'Professors LOVE asking...' to motivate study"],
  "glossary": [{"term": "Legal Term", "definition": "Brief 1-line explanation using analogies where helpful"}],
  "engagement_hooks": ["5-8 FASCINATING facts, real case connections, or 'mind-blowing' insights that make this lecture INTERESTING. Examples: 'This exact scenario happened in the famous X case...', 'Fun fact: This doctrine was invented because...', 'If you think about it like [everyday analogy]...', 'This is the law that stopped [interesting real event]...'. Make students WANT to learn more!"]
}

CRITICAL: Make notes that a tired, bored student would actually want to read. Use relatable language, real-world connections, and spark curiosity. This student has Durmah available 24/7 to discuss - give them reasons to engage!`;


  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a law education expert. Always respond with valid JSON only, no markdown.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GPT API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  
  try {
    // Parse JSON, handling potential markdown code blocks
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    // Return defaults if parsing fails
    return {
      summary: content,
      key_points: [],
      discussion_topics: [],
      exam_prompts: [],
      glossary: [],
      engagement_hooks: [],
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lectureId, force } = req.body;
  if (!lectureId) {
    return res.status(400).json({ error: 'lectureId is required' });
  }

  try {
    // Auth check
    const supabase = createPagesServerClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get lecture and verify ownership
    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select('*')
      .eq('id', lectureId)
      .eq('user_id', user.id)
      .single();

    if (lectureError || !lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    // IDEMPOTENCY: Skip if already processed (unless force=true)
    if (lecture.status === 'ready' && !force) {
      return res.status(200).json({ message: 'Already processed', lecture });
    }

    // Clear any previous error and mark processing start
    await supabase
      .from('lectures')
      .update({ 
        error_message: null,
        last_processed_at: new Date().toISOString(),
      })
      .eq('id', lectureId);

    // Use service role for storage access
    const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY!);

    // Update status to transcribing
    await supabase
      .from('lectures')
      .update({ status: 'transcribing' })
      .eq('id', lectureId);

    console.log(`[lectures/process] Starting transcription for ${lectureId}`);

    // Download audio from storage
    const { data: audioData, error: downloadError } = await serviceSupabase
      .storage
      .from('lecture_audio')
      .download(lecture.audio_path);

    if (downloadError || !audioData) {
      console.error('[lectures/process] Download error:', downloadError);
      await supabase
        .from('lectures')
        .update({ status: 'error', error_message: 'Failed to download audio' })
        .eq('id', lectureId);
      return res.status(500).json({ error: 'Failed to download audio file' });
    }

    // Convert to buffer
    const audioBuffer = Buffer.from(await audioData.arrayBuffer());
    console.log(`[lectures/process] Downloaded ${audioBuffer.length} bytes`);

    // Transcribe using Whisper
    let transcript: string;
    try {
      transcript = await transcribeAudio(audioBuffer, lecture.audio_mime || 'audio/mpeg');
      console.log(`[lectures/process] Transcription complete: ${transcript.length} chars`);
    } catch (error: any) {
      console.error('[lectures/process] Transcription error:', error);
      await supabase
        .from('lectures')
        .update({ status: 'error', error_message: `Transcription failed: ${error.message}` })
        .eq('id', lectureId);
      return res.status(500).json({ error: 'Transcription failed' });
    }

    // Save transcript
    const { error: transcriptError } = await supabase
      .from('lecture_transcripts')
      .upsert({
        lecture_id: lectureId,
        transcript_text: transcript,
        word_count: transcript.split(/\s+/).length,
      });

    if (transcriptError) {
      console.error('[lectures/process] Transcript save error:', transcriptError);
    }

    // Update status to summarizing
    await supabase
      .from('lectures')
      .update({ status: 'summarizing' })
      .eq('id', lectureId);

    console.log(`[lectures/process] Starting summarization for ${lectureId}`);

    // Generate notes using GPT
    let notes;
    try {
      notes = await generateNotes(transcript, lecture.title, lecture.module_name);
      console.log(`[lectures/process] Notes generated: ${notes.key_points?.length || 0} key points`);
    } catch (error: any) {
      console.error('[lectures/process] Summarization error:', error);
      await supabase
        .from('lectures')
        .update({ status: 'error', error_message: `Summarization failed: ${error.message}` })
        .eq('id', lectureId);
      return res.status(500).json({ error: 'Summarization failed' });
    }

    // Save notes
    const { error: notesError } = await supabase
      .from('lecture_notes')
      .upsert({
        lecture_id: lectureId,
        summary: notes.summary,
        key_points: notes.key_points,
        discussion_topics: notes.discussion_topics,
        exam_prompts: notes.exam_prompts,
        glossary: notes.glossary,
        engagement_hooks: notes.engagement_hooks || [],
      });

    if (notesError) {
      console.error('[lectures/process] Notes save error:', notesError);
    }

    // Update status to ready
    await supabase
      .from('lectures')
      .update({ status: 'ready' })
      .eq('id', lectureId);

    console.log(`[lectures/process] ✅ Complete for ${lectureId}`);

    return res.status(200).json({
      success: true,
      lectureId,
      transcript_length: transcript.length,
      notes_generated: true,
    });

  } catch (error: any) {
    console.error('[lectures/process] Error:', error);
    
    // Save error to database for visibility
    try {
      const supabase = createPagesServerClient({ req, res });
      await supabase
        .from('lectures')
        .update({ 
          status: 'error',
          error_message: error.message || 'Unknown processing error',
        })
        .eq('id', req.body.lectureId);
    } catch (dbError) {
      console.error('[lectures/process] Failed to save error to DB:', dbError);
    }
    
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
