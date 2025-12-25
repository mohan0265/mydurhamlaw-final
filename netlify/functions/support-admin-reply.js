const { supabaseAdmin } = require('./_lib/supabase')
const { isAdmin, COOKIE_NAME } = require('./_lib/adminAuth')
const { parse } = require('cookie')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) }
  }
  const token = parse(event.headers.cookie || '')[COOKIE_NAME]
  if (!isAdmin(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'unauthorized' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'invalid_json' }) }
  }

  const { ticket_id, content } = body
  if (!ticket_id || !content) return { statusCode: 400, body: JSON.stringify({ error: 'ticket_id_and_content_required' }) }

  const { error } = await supabaseAdmin
    .from('support_messages')
    .insert({
      ticket_id,
      role: 'admin',
      content,
      meta: { from: 'admin_console' }
    })

  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
