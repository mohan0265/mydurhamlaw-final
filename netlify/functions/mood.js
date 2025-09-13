
// Mood tracking API for wellbeing features
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
      // Save mood entry
      const {
        score,
        stressors = [],
        note,
      } = JSON.parse(event.body || '{}');

      if (!score || score < 1 || score > 5) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Score must be between 1 and 5' }),
        };
      }

      const { data, error } = await supabase
        .from('moods')
        .insert([{
          user_id: userId,
          score,
          stressors: Array.isArray(stressors) ? stressors : [],
          note: note || null,
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase mood insert error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to save mood entry' }),
        };
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ mood: data, success: true }),
      };
    }

    if (event.httpMethod === 'GET') {
      // Get mood trend for last 14 days
      const { days = '14' } = event.queryStringParameters || {};
      const daysNum = Math.min(parseInt(days), 30); // Max 30 days
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      // Get mood entries for the period
      const { data: moods, error: moodsError } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (moodsError) {
        console.error('Moods query error:', moodsError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch mood data' }),
        };
      }

      // Process mood data into daily aggregates
      const moodsByDate = moods.reduce((acc, mood) => {
        const date = new Date(mood.created_at).toISOString().split('T')[0];
        
        if (!acc[date]) {
          acc[date] = {
            scores: [],
            stressors: new Set(),
            entries: 0,
          };
        }
        
        acc[date].scores.push(mood.score);
        mood.stressors?.forEach(stressor => acc[date].stressors.add(stressor));
        acc[date].entries++;
        
        return acc;
      }, {});

      // Generate trend data for all days in period
      const trendData = [];
      const currentDate = new Date(startDate);
      const today = new Date();

      while (currentDate <= today) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const dayData = moodsByDate[dateKey];
        
        if (dayData && dayData.scores.length > 0) {
          const avgScore = dayData.scores.reduce((sum, score) => sum + score, 0) / dayData.scores.length;
          trendData.push({
            date: dateKey,
            avg_score: Number(avgScore.toFixed(2)),
            entry_count: dayData.entries,
            stressors: Array.from(dayData.stressors),
          });
        } else {
          trendData.push({
            date: dateKey,
            avg_score: null,
            entry_count: 0,
            stressors: [],
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Calculate overall statistics
      const allScores = moods.map(mood => mood.score);
      const avgMood = allScores.length > 0 
        ? Number((allScores.reduce((sum, score) => sum + score, 0) / allScores.length).toFixed(2))
        : null;

      const allStressors = moods.reduce((acc, mood) => {
        mood.stressors?.forEach(stressor => acc.add(stressor));
        return acc;
      }, new Set());

      const commonStressors = Array.from(allStressors).map(stressor => {
        const count = moods.filter(mood => mood.stressors?.includes(stressor)).length;
        return { stressor, count };
      }).sort((a, b) => b.count - a.count).slice(0, 5);

      const stats = {
        total_entries: moods.length,
        avg_mood: avgMood,
        period_days: daysNum,
        common_stressors: commonStressors,
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          trend: trendData,
          stats,
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
    console.error('Mood API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
