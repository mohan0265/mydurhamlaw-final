const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod === 'POST') {
    // Save mood entry
    try {
      const { score, stressors, note } = JSON.parse(event.body);
      const authHeader = event.headers.authorization;
      
      if (!authHeader) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
      }

      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          score: parseInt(score),
          stressors: stressors || [],
          note: note || ''
        })
        .select();

      if (error) throw error;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, data })
      };

    } catch (error) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  if (event.httpMethod === 'GET') {
    // Get mood trend (last 14 days)
    try {
      const authHeader = event.headers.authorization;
      
      if (!authHeader) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
      }

      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', fourteenDaysAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ trend: data })
      };

    } catch (error) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  return {
    statusCode: 405,
    body: 'Method Not Allowed'
  };
};