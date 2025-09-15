// OSCOLA citation formatting and validation
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// OSCOLA formatting rules
const OSCOLA_PATTERNS = {
  case: {
    pattern: /^(.+?)\s+v\s+(.+?)\s*\[(\d{4})\]\s*(.+)$/i,
    format: (match) => `${match[1]} v ${match[2]} [${match[3]}] ${match[4]}`
  },
  statute: {
    pattern: /^(.+?)\s+(\d{4})$/,
    format: (match) => `${match[1]} ${match[2]}`
  },
  book: {
    pattern: /^(.+?),\s*(.+?)\s*\((.+?)\s+(\d{4})\)$/,
    format: (match) => `${match[1]}, ${match[2]} (${match[3]} ${match[4]})`
  },
  article: {
    pattern: /^(.+?),\s*'(.+?)'\s*\((\d{4})\)\s*(.+?)$/,
    format: (match) => `${match[1]}, '${match[2]}' (${match[3]}) ${match[4]}`
  }
};

// Citation validation and formatting
function formatOSCOLA(citation, type = 'auto') {
  if (!citation || typeof citation !== 'string') {
    return { error: 'Invalid citation text' };
  }

  const trimmed = citation.trim();
  
  if (type === 'auto') {
    // Auto-detect citation type
    for (const [citationType, config] of Object.entries(OSCOLA_PATTERNS)) {
      const match = trimmed.match(config.pattern);
      if (match) {
        return {
          formatted: config.format(match),
          type: citationType,
          original: trimmed,
          valid: true
        };
      }
    }
    
    // If no pattern matches, return as-is with warning
    return {
      formatted: trimmed,
      type: 'unknown',
      original: trimmed,
      valid: false,
      warning: 'Citation format not recognized. Please check OSCOLA guidelines.'
    };
  }
  
  // Specific type formatting
  if (OSCOLA_PATTERNS[type]) {
    const match = trimmed.match(OSCOLA_PATTERNS[type].pattern);
    if (match) {
      return {
        formatted: OSCOLA_PATTERNS[type].format(match),
        type,
        original: trimmed,
        valid: true
      };
    } else {
      return {
        error: `Citation doesn't match ${type} format`,
        expected: getExpectedFormat(type),
        original: trimmed
      };
    }
  }
  
  return { error: 'Unknown citation type' };
}

// Get expected format examples
function getExpectedFormat(type) {
  const examples = {
    case: 'Case Name v Other Party [Year] Citation',
    statute: 'Act Name Year',
    book: 'Author Name, Book Title (Publisher Year)',
    article: 'Author Name, \'Article Title\' (Year) Journal Details'
  };
  return examples[type] || 'Unknown format';
}

// Validate bibliography format
function validateBibliography(citations) {
  if (!Array.isArray(citations)) {
    return { error: 'Citations must be an array' };
  }

  const results = citations.map((citation, index) => {
    const result = formatOSCOLA(citation);
    return {
      index,
      ...result
    };
  });

  const valid = results.filter(r => r.valid).length;
  const invalid = results.length - valid;

  return {
    results,
    summary: {
      total: results.length,
      valid,
      invalid,
      validPercentage: results.length > 0 ? Math.round((valid / results.length) * 100) : 0
    }
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get authenticated user (optional for this service)
    const user = await getUserFromAuth(event);
    
    const { citation, citations, type = 'auto', action = 'format' } = JSON.parse(event.body || '{}');

    // Single citation formatting
    if (action === 'format' && citation) {
      const result = formatOSCOLA(citation, type);
      
      // Log usage if user is authenticated
      if (user) {
        try {
          await supabase
            .from('ai_history')
            .insert({
              user_id: user.id,
              question: `OSCOLA format: ${citation}`,
              answer: result.formatted || 'Format failed',
              mode: 'oscola',
              module: 'citation'
            });
        } catch (logError) {
          console.warn('Failed to log OSCOLA usage:', logError);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    // Bibliography validation
    if (action === 'validate' && citations) {
      const result = validateBibliography(citations);
      
      // Log usage if user is authenticated
      if (user) {
        try {
          await supabase
            .from('ai_history')
            .insert({
              user_id: user.id,
              question: `OSCOLA validate ${citations.length} citations`,
              answer: `${result.summary.valid}/${result.summary.total} valid`,
              mode: 'oscola',
              module: 'bibliography'
            });
        } catch (logError) {
          console.warn('Failed to log OSCOLA usage:', logError);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    // Get format examples and guidelines
    if (action === 'examples') {
      const examples = {
        case: {
          correct: "Carlill v Carbolic Smoke Ball Co [1893] 1 QB 256",
          incorrect: "Carlill vs Carbolic Smoke Ball Co (1893) 1 QB 256",
          explanation: "Use 'v' not 'vs', square brackets for year, proper citation format"
        },
        statute: {
          correct: "Human Rights Act 1998",
          incorrect: "Human Rights Act, 1998",
          explanation: "No comma before year, capitalize Act"
        },
        book: {
          correct: "F H Lawson, Introduction to the Law of Property (Oxford University Press 1958)",
          incorrect: "F.H. Lawson, Introduction to the Law of Property, Oxford University Press, 1958",
          explanation: "No periods in initials, parentheses around publisher and year"
        },
        article: {
          correct: "Tony Weir, 'The Staggering March of Negligence' (1980) 23 MLR 233",
          incorrect: "Tony Weir, The Staggering March of Negligence, (1980) 23 MLR 233",
          explanation: "Article title in single quotes, no comma before year"
        }
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          examples,
          guidelines: [
            "Cases: Name v Name [Year] Citation",
            "Statutes: Full Name Year",
            "Books: Author, Title (Publisher Year)",
            "Articles: Author, 'Title' (Year) Citation",
            "Use single quotes for article/chapter titles",
            "Use square brackets for neutral citations",
            "No full stops in author initials",
            "Italicize case names in final documents"
          ]
        })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Invalid request', 
        usage: 'Send { citation, type } for formatting or { citations } for validation' 
      })
    };

  } catch (error) {
    console.error('OSCOLA API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
