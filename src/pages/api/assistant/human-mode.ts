import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { withRateLimit } from '@/lib/middleware/rateLimiter';
import { sanitizeInput } from '@/lib/security/encryption';
import { guardrailsPrompt, type HelpLevel } from '@/lib/integrity/humanMode';
import { logProvenance } from '@/lib/integrity/provenance';
import { getSupabaseClient } from '@/lib/supabase/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function humanModeHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, assistanceLevel, userId, assignmentId, sources = [] } = req.body;

  // Validate required fields
  if (!query || !assistanceLevel || !userId) {
    return res.status(400).json({ 
      error: 'Missing required fields: query, assistanceLevel, userId' 
    });
  }

  // Sanitize user input
  const sanitizedQuery = sanitizeInput(query);
  if (!sanitizedQuery) {
    return res.status(400).json({ error: 'Invalid or empty query' });
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Get user profile to check integrity acknowledgment
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('integrity_acknowledged')
      .eq('id', userId)
      .single();

    if (profileError) {
      return res.status(400).json({ error: 'Invalid user' });
    }

    const userPledge = profile?.integrity_acknowledged || false;

    // Check for submission-ready requests and refuse
    const submissionKeywords = [
      'write this for me',
      'complete this assignment',
      'give me the answer',
      'write my essay',
      'do my homework',
      'final version',
      'submission ready',
      'copy and paste'
    ];

    const isSubmissionRequest = submissionKeywords.some(keyword => 
      sanitizedQuery.toLowerCase().includes(keyword)
    );

    if (isSubmissionRequest) {
      return res.status(200).json({
        reply: "I can't produce text intended for submission. I can outline, explain reasoning, and help you cite correctly so you can write it in your own words.\n\nInstead, try asking:\n• 'How should I structure my argument about...?'\n• 'What cases might be relevant to...?'\n• 'Can you explain the reasoning behind...?'\n• 'How do I cite this properly using OSCOLA?'",
        requiresAttribution: false,
        sources: [],
        tokensUsed: { input: 0, output: 0 }
      });
    }

    // Build the prompt with guardrails
    const systemPrompt = guardrailsPrompt(assistanceLevel as HelpLevel, userPledge);
    
    // Customize response depth based on assistance level
    const levelInstructions = {
      'L1_SELF': 'Provide minimal hints through Socratic questions. Guide the student to discover answers themselves.',
      'L2_GUIDED': 'Provide structured outlines and reasoning frameworks. Show the approach but let them do the writing.',
      'L3_COACH': 'Provide detailed explanations and worked examples, but always require the student to paraphrase in their own words.'
    };

    const fullPrompt = `${systemPrompt}

${levelInstructions[assistanceLevel as HelpLevel]}

Student Query: ${sanitizedQuery}

Remember:
- Never provide submission-ready text
- Always include OSCOLA citation guidance when relevant
- Encourage original analysis, not just summarizing
- End with a question that prompts the student to think further`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: fullPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const reply = completion.choices[0]?.message?.content?.trim() || '';
    const tokensUsed = {
      input: completion.usage?.prompt_tokens || 0,
      output: completion.usage?.completion_tokens || 0
    };

    // Extract any sources mentioned in the response (basic implementation)
    const extractedSources: Array<{title?: string; url?: string; cite?: string}> = [];
    
    // Look for case names, statutes, or citations in the response
    const caseMatches = reply.match(/([A-Z][a-z]+ v [A-Z][a-z]+)/g);
    if (caseMatches) {
      caseMatches.forEach(caseName => {
        extractedSources.push({ cite: caseName, title: caseName });
      });
    }

    // Log provenance
    await logProvenance({
      userId,
      assignmentId: assignmentId || undefined,
      assistanceLevel: assistanceLevel as HelpLevel,
      sources: [...sources, ...extractedSources],
      modelUsed: 'gpt-4o',
      tokensIn: tokensUsed.input,
      tokensOut: tokensUsed.output,
      aiDisclosureRequired: true,
      notes: `Human Mode query: ${sanitizedQuery.substring(0, 100)}...`
    });

    return res.status(200).json({
      reply,
      requiresAttribution: true,
      sources: extractedSources,
      tokensUsed,
      assistanceLevel
    });

  } catch (error: any) {
    console.error('Human Mode API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Export with rate limiting - more restrictive for AI assistance
export default withRateLimit(humanModeHandler, {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute per IP
  message: 'Too many AI assistance requests. Please wait before asking for more guidance.'
});