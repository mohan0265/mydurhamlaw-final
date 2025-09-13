
// OSCOLA reference validation and formatting API
exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { type, fields } = JSON.parse(event.body || '{}');

    if (!type || !fields) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Type and fields are required',
          formattedString: '',
          lintMessages: ['Missing required parameters'],
        }),
      };
    }

    const result = formatOSCOLA(type, fields);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('OSCOLA API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        formattedString: '',
        lintMessages: ['Server error occurred'],
      }),
    };
  }
};

// OSCOLA formatting functions
function formatOSCOLA(type, fields) {
  const lintMessages = [];
  let formattedString = '';

  switch (type) {
    case 'case':
      formattedString = formatCase(fields, lintMessages);
      break;
    case 'statute':
      formattedString = formatStatute(fields, lintMessages);
      break;
    case 'book':
      formattedString = formatBook(fields, lintMessages);
      break;
    case 'article':
      formattedString = formatArticle(fields, lintMessages);
      break;
    case 'website':
      formattedString = formatWebsite(fields, lintMessages);
      break;
    default:
      lintMessages.push(`Unknown reference type: ${type}`);
      formattedString = 'Unknown reference type';
  }

  return {
    formattedString,
    lintMessages,
    type,
    fields,
  };
}

function formatCase(fields, lintMessages) {
  const { caseName, citation, court, year, judge, paragraph } = fields;

  if (!caseName) {
    lintMessages.push('Case name is required');
  }
  if (!citation) {
    lintMessages.push('Citation is required');
  }

  // Basic case format: Case Name [Year] Citation
  let formatted = '';
  
  if (caseName) {
    // Italicize case name (using markdown-style for now)
    formatted += `*${caseName}*`;
  }
  
  if (year) {
    formatted += ` [${year}]`;
  }
  
  if (citation) {
    formatted += ` ${citation}`;
  }
  
  if (court && !citation.includes(court)) {
    formatted += ` (${court})`;
  }
  
  if (paragraph) {
    formatted += ` [${paragraph}]`;
  }
  
  if (judge) {
    formatted += ` (${judge})`;
  }

  // Validation checks
  if (citation && !citation.match(/\[?\d{4}\]?/)) {
    lintMessages.push('Citation should include a year');
  }
  
  if (caseName && caseName.toLowerCase().includes(' v ')) {
    // Good - proper vs. format
  } else if (caseName && caseName.toLowerCase().includes(' vs ')) {
    lintMessages.push('Use "v" instead of "vs" in case names');
  }

  return formatted || 'Invalid case reference';
}

function formatStatute(fields, lintMessages) {
  const { title, year, chapter, section, subsection } = fields;

  if (!title) {
    lintMessages.push('Statute title is required');
  }
  if (!year) {
    lintMessages.push('Year is required for statutes');
  }

  let formatted = '';
  
  if (title) {
    formatted += title;
  }
  
  if (year) {
    formatted += ` ${year}`;
  }
  
  if (chapter) {
    formatted += ` c ${chapter}`;
  } else if (year) {
    lintMessages.push('Chapter number usually required for statutes');
  }
  
  if (section) {
    formatted += `, s ${section}`;
  }
  
  if (subsection) {
    formatted += `(${subsection})`;
  }

  return formatted || 'Invalid statute reference';
}

function formatBook(fields, lintMessages) {
  const { author, title, edition, publisher, year, pages } = fields;

  if (!author) {
    lintMessages.push('Author is required');
  }
  if (!title) {
    lintMessages.push('Book title is required');
  }
  if (!year) {
    lintMessages.push('Publication year is required');
  }

  let formatted = '';
  
  if (author) {
    // Handle multiple authors
    const authors = Array.isArray(author) ? author : [author];
    if (authors.length === 1) {
      formatted += authors[0];
    } else if (authors.length === 2) {
      formatted += `${authors[0]} and ${authors[1]}`;
    } else {
      formatted += `${authors[0]} and others`;
    }
  }
  
  if (title) {
    formatted += `, *${title}*`;
  }
  
  if (edition && edition !== '1st') {
    formatted += ` (${edition} edn`;
    if (publisher) {
      formatted += `, ${publisher}`;
    }
    if (year) {
      formatted += ` ${year})`;
    } else {
      formatted += ')';
    }
  } else {
    if (publisher || year) {
      formatted += ' (';
      if (publisher) {
        formatted += publisher;
      }
      if (year) {
        if (publisher) {
          formatted += ` ${year}`;
        } else {
          formatted += year;
        }
      }
      formatted += ')';
    }
  }
  
  if (pages) {
    formatted += ` ${pages}`;
  }

  return formatted || 'Invalid book reference';
}

function formatArticle(fields, lintMessages) {
  const { author, title, journal, year, volume, issue, pages } = fields;

  if (!author) {
    lintMessages.push('Author is required');
  }
  if (!title) {
    lintMessages.push('Article title is required');
  }
  if (!journal) {
    lintMessages.push('Journal name is required');
  }

  let formatted = '';
  
  if (author) {
    formatted += author;
  }
  
  if (title) {
    formatted += `, '${title}'`;
  }
  
  if (year) {
    formatted += ` (${year})`;
  }
  
  if (volume) {
    formatted += ` ${volume}`;
  }
  
  if (journal) {
    formatted += ` ${journal}`;
  }
  
  if (issue) {
    formatted += `(${issue})`;
  }
  
  if (pages) {
    formatted += ` ${pages}`;
  }

  return formatted || 'Invalid article reference';
}

function formatWebsite(fields, lintMessages) {
  const { author, title, website, url, accessDate } = fields;

  if (!title) {
    lintMessages.push('Page title is required');
  }
  if (!url) {
    lintMessages.push('URL is required');
  }
  if (!accessDate) {
    lintMessages.push('Access date is recommended for websites');
  }

  let formatted = '';
  
  if (author) {
    formatted += `${author}, `;
  }
  
  if (title) {
    formatted += `'${title}'`;
  }
  
  if (website) {
    formatted += ` (${website}`;
  }
  
  if (accessDate) {
    const date = new Date(accessDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    if (website) {
      formatted += `, accessed ${date})`;
    } else {
      formatted += ` (accessed ${date})`;
    }
  } else if (website) {
    formatted += ')';
  }
  
  if (url) {
    formatted += ` <${url}>`;
  }

  // URL validation
  if (url && !url.match(/^https?:\/\//)) {
    lintMessages.push('URL should include http:// or https://');
  }

  return formatted || 'Invalid website reference';
}
