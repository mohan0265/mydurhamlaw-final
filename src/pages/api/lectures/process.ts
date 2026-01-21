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
  exam_signals: Array<{
    topic_title: string;
    signal_strength: number; // 1-5
    confidence_label: string;
    evidence_quotes: string[];
    why_it_matters: string;
    what_to_master: string[];
    common_traps: string[];
    practice_prompts: Array<{ type: string; prompt: string }>;
    tags: string[];
    source_spans?: Array<{ start_char: number; end_char: number }>;
  }>;
}> {
  const prompt = `You are Durmah, an academic study companion for Durham Law students.
Your job is to extract "Lecturer Emphasis & Exam Signals" from a lecture transcript.

CRITICAL ACADEMIC INTEGRITY RULES:
- No exam prediction language.
- Only identify lecturer emphasis cues based on transcript evidence.
- Evidence quotes: max 25 words, verbatim.

TASK:
From the provided lecture transcript (and optional metadata), produce a JSON object that contains an array called "exam_signals".
Each item should represent a concept the lecturer emphasized as important, assessment-relevant, commonly misunderstood, or frequently revisited.
Also generate standard lecture notes (summary, key_points, discussion_topics, exam_prompts, glossary, engagement_hooks) as per usual requirements, consolidated in the same JSON.

HOW TO SCORE SIGNAL STRENGTH (1–5):
5 = explicit exam/assessment mention OR repeated strong emphasis plus warnings about traps/mistakes
4 = strong emphasis and repeated / sustained explanation
3 = moderate emphasis OR one strong mention
2 = light emphasis
1 = weak inference only (use sparingly; prefer omitting)

OUTPUT REQUIREMENTS:
- Output MUST be valid JSON ONLY. No markdown, no commentary.
- Evidence quotes must be short (max ~25 words each) and verbatim from the transcript.
- If you cannot find any meaningful signals, output an empty array.

OUTPUT JSON KEYS (MUST MATCH):
summary, key_points, discussion_topics, exam_prompts, glossary, engagement_hooks, exam_signals[], teaching_style, lecturer_name_detected

JSON SCHEMA (MUST MATCH EXACTLY):
{
  "lecturer_name_detected": "string | null",
  "summary": "string",
  "key_points": ["string"],
  "discussion_topics": ["string"],
  "exam_prompts": ["string"],
  "glossary": [{"term": "string", "definition": "string"}],
  "engagement_hooks": ["string"],
  "exam_signals": [
    {
      "topic_title": "string",
      "signal_strength": 1,
      "confidence_label": "Low|Medium|High",
      "evidence_quotes": ["string", "string"],
      "why_it_matters": "string",
      "what_to_master": ["string", "string", "string"],
      "common_traps": ["string"],
      "practice_prompts": [
        { "type": "Explain|Apply|Distinguish|Critique", "prompt": "string" }
      ],
      "tags": ["definition|elements|distinction|case-law|policy|problem-question|essay|warning"],
      "source_spans": [
        { "start_char": 0, "end_char": 0 }
      ]
    }
  ],
  "teaching_style": {
     "pace_level": "Slow|Medium|Fast", 
     "structure_level": "Low|Medium|High",
     "exam_orientation_level": "Low|Medium|High",
     "emphasis_score": 50,
     "recommended_study_tactics": ["string", "string", "string"],
     "common_pitfalls": ["string", "string"]
  }
}

TRANSCRIPT:
${transcript.substring(0, 15000)} ${transcript.length > 15000 ? '... [truncated]' : ''}

LECTURE: ${lectureTitle}
MODULE: ${moduleName || 'Law'}

Extract:
1. Lecturer name (if explicitly introduced).
2. "teaching_style":
   - Pace: Infer from word density/repetition (Slow/Medium/Fast).
   - Structure: usage of signposting/headings (High/Medium/Low).
   - Exam Orientation: frequency of assessment mentions (High/Medium/Low).
   - Emphasis Score: 0-100 based on intensity of cues.
   - Tactics/Pitfalls: specific to this lecturer's style inferred from transcript.`;

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
       exam_signals: [],
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
        exam_signals: notes.exam_signals || [],
      });

    // --- LECTURER INSIGHTS PIPELINE ---
    const detectedName = (notes as any).lecturer_name_detected;
    if (detectedName && typeof detectedName === 'string' && detectedName.length > 2) {
      // 1. Upsert Lecturer
      const { data: lecturerData, error: lecturerError } = await supabase
        .from('lecturers')
        .upsert({ name_normalized: detectedName.trim().toLowerCase(), name: detectedName.trim() }, { onConflict: 'name_normalized' })
        .select()
        .single();
      
      if (lecturerData && !lecturerError) {
        // 2. Update Actions
        const style = (notes as any).teaching_style || {};
        
        const { error: insightError } = await supabase
          .from('lecturer_insights')
          .upsert({ 
             lecturer_id: lecturerData.id,
             // We merge or overwrite the insights JSON. 
             // Ideally we aggregate, but for now we take the latest lecture's style analysis as the "current" snapshot,
             // or mix it. For MVP, overwriting with latest specific style data is acceptable or we should merge.
             // Let's store the raw style object.
             insights_json: style,
             updated_at: new Date().toISOString()
          }, { onConflict: 'lecturer_id' }); // Remove ignoreDuplicates to allow updating
          
          if(insightError) console.error('Insight update error', insightError);

          // Optional: Link lecture to lecturer (if column exists, or we use name matching)
          // For now, we update the lecture's lecturer_name text field if it was empty
          if (!lecture.lecturer_name) {
             await supabase.from('lectures').update({ lecturer_name: detectedName }).eq('id', lectureId);
          }
      }
    }
    // ----------------------------------

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
