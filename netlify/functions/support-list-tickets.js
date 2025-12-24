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
  const token = parse(event.headers.cookie || '')[COOKIE_NAME]
  const exp = expectedToken()
  if (!token || !exp || token !== exp) {
    return { statusCode: 401, body: JSON.stringify({ error: 'unauthorized' }) }
  }

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .select('id, created_at, updated_at, status, priority, subject, user_id, visitor_email, visitor_name, is_visitor, last_message_at, tags')
    .order('updated_at', { ascending: false })
    .limit(200)

  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) }

  return { statusCode: 200, body: JSON.stringify({ ok: true, tickets: data }) }
}
