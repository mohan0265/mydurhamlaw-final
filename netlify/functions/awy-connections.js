const { createClient } = require('@supabase/supabase-js');

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

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get user from auth
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    if (event.httpMethod === 'GET') {
      // Get loved ones from database
      const { data: connections, error } = await supabase
        .from('awy_connections')
        .select('*')
        .eq('student_id', user.id);

      if (error) {
        console.error('Database error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Database error' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ connections: connections || [] })
      };
    }

    if (event.httpMethod === 'POST') {
      const { loved_email, relationship, display_name } = JSON.parse(event.body || '{}');
      
      if (!loved_email || !relationship) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Email and relationship are required' })
        };
      }

      // Add new loved one
      const { data: newConnection, error } = await supabase
        .from('awy_connections')
        .insert({
          student_id: user.id,
          loved_email,
          relationship,
          display_name: display_name || relationship
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to add loved one' })
        };
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ connection: newConnection })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
