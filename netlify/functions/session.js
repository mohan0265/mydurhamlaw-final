
// Study session logging and aggregation API
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const userId = event.headers['x-user-id'] || event.headers['authorization']?.replace('Bearer ', '');
    
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'User authentication required' }),
      };
    }

    if (event.httpMethod === 'POST') {
      // Create new session log
      const {
        topic,
        duration_min,
        started_at,
        ended_at,
        difficulty,
        notes,
        tags = [],
      } = JSON.parse(event.body || '{}');

      if (!duration_min || duration_min <= 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Valid duration_min is required' }),
        };
      }

      const { data, error } = await supabase
        .from('session_logs')
        .insert([{
          user_id: userId,
          topic: topic || null,
          duration_min,
          started_at: started_at || new Date().toISOString(),
          ended_at: ended_at || new Date().toISOString(),
          difficulty,
          notes,
          tags,
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to save session log' }),
        };
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ session: data, success: true }),
      };
    }

    if (event.httpMethod === 'GET') {
      // Get session logs and aggregates
      const { period = '7d', limit = '10' } = event.queryStringParameters || {};
      
      let startDate;
      switch (period) {
        case '1d':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get recent sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('session_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: false })
        .limit(parseInt(limit));

      if (sessionsError) {
        console.error('Sessions query error:', sessionsError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch sessions' }),
        };
      }

      // Calculate aggregates
      const totalMinutes = sessions.reduce((sum, session) => sum + (session.duration_min || 0), 0);
      const sessionCount = sessions.length;
      const avgSessionLength = sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0;
      
      // Calculate streak (consecutive days with study sessions)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let streak = 0;
      let currentDate = new Date(today);
      
      const sessionsByDate = sessions.reduce((acc, session) => {
        const date = new Date(session.started_at);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(session);
        return acc;
      }, {});

      // Count consecutive days with sessions
      while (true) {
        const dateKey = currentDate.toISOString().split('T')[0];
        if (sessionsByDate[dateKey] && sessionsByDate[dateKey].length > 0) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      const aggregates = {
        total_minutes: totalMinutes,
        session_count: sessionCount,
        avg_session_length: avgSessionLength,
        current_streak: streak,
        period,
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          sessions,
          aggregates,
          success: true,
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Session API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
