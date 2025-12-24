const { supabaseAdmin } = require('./_lib/supabase')
const { parse } = require('cookie')
const { createHmac } = require('crypto')

const COOKIE_NAME = 'admin_session'
function expectedToken() {
  const user = process.env.ADMIN_USERNAME
  const pass = process.env.ADMIN_PASSWORD
  if (!user || !pass) return null
  return createHmac('sha256', pass).update(user).digest('hex')
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) }
  }
  const token = parse(event.headers.cookie || '')[COOKIE_NAME]
  const exp = expectedToken()
  if (!token || !exp || token !== exp) {
    return { statusCode: 401, body: JSON.stringify({ error: 'unauthorized' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'invalid_json' }) }
  }

  const query = (body.query || '').toLowerCase()
  const { data, error } = await supabaseAdmin
    .from('support_kb_articles')
    .select('id, title, slug, body, tags, is_published')
    .ilike('body', `%${query}%`)
    .limit(20)

  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  return { statusCode: 200, body: JSON.stringify({ ok: true, results: data || [] }) }
}
