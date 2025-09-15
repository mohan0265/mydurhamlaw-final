// AI Chat endpoint with OpenAI integration, rate limiting, and guardrails
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js'); // ADD THIS

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ADD SUPABASE CLIENT
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rate limiting store (in-memory for demo, use Redis in production)
const rateLimitStore = new Map();

// Clean up rate limit store every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 24 * 60 * 60 * 1000) { // 24 hours
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

// ENHANCED: Check rate limit with Supabase backup
async function checkRateLimit(userId) {
  const now = Date.now();
  const key = `chat_${userId}`;
  const limit = 15; // 15 requests per day
  
  // Try Supabase first for persistent rate limiting
  try {
    const { data, error } = await supabase
      .from('ai_history')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (!error && data) {
      return data.length < limit;
    }
  } catch (e) {
    console.warn('Supabase rate limit check failed, using memory store:', e);
  }
  
  // Fallback to your existing memory-based system
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, {
      count: 0,
      resetTime: now,
    });
  }
  
  const data = rateLimitStore.get(key);
  
  // Reset if more than 24 hours have passed
  if (now - data.resetTime > 24 * 60 * 60 * 1000) {
    data.count = 0;
    data.resetTime = now;
  }
  
  if (data.count >= limit) {
    return false;
  }
  
  data.count++;
  return true;
}

// Content safety filters (KEEP YOUR EXISTING FUNCTION)
function containsInappropriateContent(text) {
  const flaggedTerms = [
    'plagiarism', 'cheat', 'do my homework', 'write my essay', 
    'complete assignment for me', 'solve this for me'
  ];
  
  const lowerText = text.toLowerCase();
  return flaggedTerms.some(term => lowerText.includes(term));
}

// Academic integrity system prompt (KEEP YOUR EXISTING)
const systemPrompt = `You are Durmah, an AI study assistant for Durham University law students. You provide educational guidance, explain legal concepts, and help with understanding case law and statutes.

STRICT GUIDELINES:
1. NEVER complete assignments or provide ready-made answers
2. Always encourage critical thinking and provide guidance, not solutions
3. Cite relevant cases, statutes, and legal principles when appropriate
4. Maintain academic integrity - help students learn, not cheat
5. If asked to write essays or complete assignments, politely decline and offer to explain concepts instead
6. Always provide sources when discussing legal principles
7. Acknowledge when topics require further research or legal advice

Remember: You're here to enhance learning, not replace it.`;

// ENHANCED: Get user from auth token
async function getUserFromAuth(event) {
  const authHeader = event.headers.authorization;
  if (!authHeader) return null;
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    return error ? null : user;
  } catch (e) {
    console.warn('Auth check failed:', e);
    return null;
  }
}

exports.handler = async (event, context) => {
  // Only allow POST requests (KEEP YOUR EXISTING CORS LOGIC)
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Handle CORS preflight (KEEP YOUR EXISTING)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    const { messages = [], mode = 'default', module = 'general', userId } = JSON.parse(event.body || '{}');

    if (!messages || messages.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Messages array is required',
        }),
      };
    }

    // ENHANCED: Try to get user from auth, fallback to userId from body
    const user = await getUserFromAuth(event);
    const userIdentifier = user?.id || userId || event.headers['x-user-id'] || 'anonymous';

    // Rate limiting check (ENHANCED)
    const rateLimitPassed = await checkRateLimit(userIdentifier);
    if (!rateLimitPassed) {
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Daily rate limit exceeded (15 requests per day)',
          resetTime: Date.now() + (24 * 60 * 60 * 1000),
        }),
      };
    }

    // Content safety check (KEEP YOUR EXISTING)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && containsInappropriateContent(lastMessage.content)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Content violates academic integrity guidelines',
          answer: 'I can\'t help with that request as it may violate academic integrity policies. Instead, I can explain concepts, provide study guidance, or help you understand legal principles. How can I help you learn?',
          sources: [],
        }),
      };
    }

    // Prepare messages for OpenAI (KEEP YOUR EXISTING)
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role || 'user',
        content: msg.content,
      })),
    ];

    // Call OpenAI API (KEEP YOUR EXISTING)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: aiMessages,
      max_tokens: 1500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const answer = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

    // Generate mock sources (KEEP YOUR EXISTING FUNCTION)
    const sources = generateSources(lastMessage?.content || '', module);

    // ADD: Log to database if user is authenticated
    if (user?.id) {
      try {
        await supabase
          .from('ai_history')
          .insert({
            user_id: user.id,
            question: lastMessage?.content || '',
            answer,
            mode,
            module,
            token_count: completion.usage?.total_tokens || 0
          });
      } catch (logError) {
        console.warn('Failed to log chat history:', logError);
        // Don't fail the request if logging fails
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        answer,
        sources,
        mode,
        module,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Chat API error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        answer: 'I apologize, but I encountered an error. Please try again in a moment.',
        sources: [],
      }),
    };
  }
};

// Generate relevant sources based on content and module (KEEP YOUR EXISTING)
function generateSources(content, module) {
  const sources = [];
  
  // Basic source generation logic (mock implementation)
  if (content.toLowerCase().includes('contract')) {
    sources.push({
      title: 'Carlill v Carbolic Smoke Ball Co',
      type: 'case',
      citation: '[1893] 1 QB 256',
      url: 'https://www.bailii.org/uk/cases/UKHL/1892/1.html',
    });
  }
  
  if (content.toLowerCase().includes('tort')) {
    sources.push({
      title: 'Donoghue v Stevenson',
      type: 'case',
      citation: '[1932] UKHL 100',
      url: 'https://www.bailii.org/uk/cases/UKHL/1932/100.html',
    });
  }
  
  if (content.toLowerCase().includes('constitution')) {
    sources.push({
      title: 'Constitutional Reform Act 2005',
      type: 'statute',
      citation: '2005 c. 4',
      url: 'https://www.legislation.gov.uk/ukpga/2005/4',
    });
  }
  
  return sources;
}
