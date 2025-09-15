// Spaced repetition card review system with SuperMemo 2 algorithm
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// SuperMemo 2 algorithm for spaced repetition
function calculateNextReview(ef, interval, quality) {
  // quality: 0-5 (0=total blackout, 5=perfect response)
  let newEf = ef;
  let newInterval = interval;
  
  if (quality >= 3) {
    // Correct response
    if (interval === 1) {
      newInterval = 6;
    } else if (interval === 6) {
      newInterval = 16;
    } else {
      newInterval = Math.round(interval * ef);
    }
    
    // Update ease factor
    newEf = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    // Incorrect response - restart
    newInterval = 1;
  }
  
  // Minimum ease factor is 1.3
  if (newEf < 1.3) newEf = 1.3;
  
  return { 
    ef: Math.round(newEf * 100) / 100, 
    interval: newInterval 
  };
}

// Get user from auth token
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
  // Handle CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get authenticated user
    const user = await getUserFromAuth(event);
    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // POST: Review a card (submit answer quality)
    if (event.httpMethod === 'POST') {
      const { cardId, quality } = JSON.parse(event.body || '{}');
      
      if (!cardId || quality === undefined) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'cardId and quality are required' })
        };
      }

      // Get current card
      const { data: card, error: fetchError } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !card) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Card not found' })
        };
      }

      // Calculate next review using SuperMemo 2
      const { ef, interval } = calculateNextReview(card.ef, card.interval, parseInt(quality));
      const dueAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

      // Update card
      const { data: updatedCard, error: updateError } = await supabase
        .from('cards')
        .update({
          ef,
          interval,
          due_at: dueAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update card' })
        };
      }

      // Get next due card
      const { data: nextCard } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .lte('due_at', new Date().toISOString())
        .order('due_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          updated: updatedCard,
          nextDue: nextCard || null,
          stats: {
            nextReviewIn: interval,
            easeFactor: ef,
            quality: parseInt(quality)
          }
        })
      };
    }

    // GET: Get due cards for review
    if (event.httpMethod === 'GET') {
      const limit = parseInt(event.queryStringParameters?.limit || '10');
      
      const { data: dueCards, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .lte('due_at', new Date().toISOString())
        .order('due_at', { ascending: true })
        .limit(limit);

      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch cards' })
        };
      }

      // Get stats
      const { data: allCards } = await supabase
        .from('cards')
        .select('due_at')
        .eq('user_id', user.id);

      const now = new Date();
      const stats = {
        totalCards: allCards?.length || 0,
        dueToday: dueCards?.length || 0,
        dueTomorrow: allCards?.filter(c => 
          new Date(c.due_at) <= new Date(now.getTime() + 24 * 60 * 60 * 1000) &&
          new Date(c.due_at) > now
        ).length || 0
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          cards: dueCards || [],
          stats
        })
      };
    }

    // PUT: Create or update a card
    if (event.httpMethod === 'PUT') {
      const { topic, prompt, answer, module = 'general' } = JSON.parse(event.body || '{}');
      
      if (!topic || !prompt || !answer) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'topic, prompt, and answer are required' })
        };
      }

      const { data: newCard, error } = await supabase
        .from('cards')
        .insert({
          user_id: user.id,
          topic,
          prompt,
          answer,
          module,
          ef: 2.5,      // Default ease factor
          interval: 1,   // First review tomorrow
          due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to create card' })
        };
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ card: newCard })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Card review API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};