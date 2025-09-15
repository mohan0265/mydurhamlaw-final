// Enhanced mood tracking API - using existing 'moods' table
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mood analysis and recommendations
function analyzeMoodTrend(entries) {
  if (!entries || entries.length === 0) {
    return {
      trend: 'insufficient_data',
      average: 0,
      recommendation: 'Start tracking your mood daily to see patterns and trends.'
    };
  }

  const scores = entries.map(e => e.score);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const recent = scores.slice(-3);
  const recentAverage = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : average;
  
  let trend = 'stable';
  if (recent.length >= 2) {
    if (recentAverage > average + 0.5) trend = 'improving';
    if (recentAverage < average - 0.5) trend = 'declining';
  }

  let recommendation = '';
  if (average < 2.5) {
    recommendation = 'Your mood has been low recently. Consider speaking to a counselor or trusted friend. Durham University offers mental health support services.';
  } else if (average < 3.5) {
    recommendation = 'Your mood is moderate. Try incorporating stress-reduction activities like exercise, meditation, or regular sleep schedule.';
  } else {
    recommendation = 'Your mood is generally positive! Keep up the good habits that are working for you.';
  }

  const recentLowScores = recent.filter(score => score <= 2).length;
  const needsSupport = recentLowScores >= 2 || (scores.length > 0 && scores[scores.length - 1] === 1);

  return {
    trend,
    average: Math.round(average * 10) / 10,
    recentAverage: Math.round(recentAverage * 10) / 10,
    recommendation,
    needsSupport,
    totalEntries: entries.length
  };
}

// Enhanced user authentication
async function getUserFromAuth(event) {
  const authHeader = event.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) return user;
    } catch (e) {
      console.warn('Auth token validation failed:', e);
    }
  }
  
  const userId = event.headers['x-user-id'] || authHeader?.replace('Bearer ', '');
  return userId ? { id: userId } : null;
}

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const user = await getUserFromAuth(event);
    const userId = user?.id;
    
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'User authentication required' }),
      };
    }

    if (event.httpMethod === 'POST') {
      const { score, stressors = [], note } = JSON.parse(event.body || '{}');

      if (!score || score < 1 || score > 5) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Score must be between 1 and 5' }),
        };
      }

      // Check for existing entry today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingEntry } = await supabase
        .from('moods')  // Keep using your existing table
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .maybeSingle();

      let result, statusCode, message;

      if (existingEntry) {
        const { data, error } = await supabase
          .from('moods')
          .update({
            score,
            stressors: Array.isArray(stressors) ? stressors : [],
            note: note || null,
          })
          .eq('id', existingEntry.id)
          .select()
          .single();

        if (error) {
          console.error('Supabase mood update error:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to update mood entry' }),
          };
        }

        result = data;
        statusCode = 200;
        message = 'Mood entry updated for today';
      } else {
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

        result = data;
        statusCode = 201;
        message = 'Mood entry saved successfully';
      }

      return {
        statusCode,
        headers,
        body: JSON.stringify({ mood: result, success: true, message }),
      };
    }

    if (event.httpMethod === 'GET') {
      const { days = '14' } = event.queryStringParameters || {};
      const daysNum = Math.min(parseInt(days), 30);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      const { data: moods, error: moodsError } = await supabase
        .from('moods')  // Keep using your existing table
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

      // Keep all your existing aggregation logic
      const moodsByDate = moods.reduce((acc, mood) => {
        const date = new Date(mood.created_at).toISOString().split('T')[0];
        
        if (!acc[date]) {
          acc[date] = { scores: [], stressors: new Set(), entries: 0 };
        }
        
        acc[date].scores.push(mood.score);
        mood.stressors?.forEach(stressor => acc[date].stressors.add(stressor));
        acc[date].entries++;
        
        return acc;
      }, {});

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

      const analysis = analyzeMoodTrend(moods);
      const todayKey = new Date().toISOString().split('T')[0];
      const todaysEntry = trendData.find(entry => entry.date === todayKey);

      const supportResources = analysis.needsSupport ? {
        crisis: {
          uk: '116 123',
          durham: 'https://www.dur.ac.uk/counselling/',
          text: 'Text SHOUT to 85258'
        },
        message: 'If you\'re struggling, please reach out for support. You\'re not alone.'
      } : null;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          trend: trendData,
          stats,
          analysis,
          todaysEntry,
          supportResources,
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
