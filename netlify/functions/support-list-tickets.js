const { supabaseAdmin } = require('./_lib/supabase')
const { isAdmin, COOKIE_NAME } = require('./_lib/adminAuth')

exports.handler = async (event) => {
  const token = parse(event.headers.cookie || '')[COOKIE_NAME]
  if (!isAdmin(event)) {
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
