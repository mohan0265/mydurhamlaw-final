const { supabaseAdmin } = require('./_lib/supabase')
const { sanitizeString } = require('./_lib/validate')
const { rateLimit } = require('./_lib/rateLimit')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) }
  }

  const ip = event.headers['x-forwarded-for'] || event.ip || 'unknown'
  if (!rateLimit(`get:${ip}`)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'rate_limited' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'invalid_json' }) }
  }

  const ticket_id = sanitizeString(body.ticket_id, 64)
  const visitor_token = sanitizeString(body.visitor_token, 128)
  const user_id = body.user_id || null

  if (!ticket_id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'ticket_id_required' }) }
  }

  // Fetch ticket
  const { data: ticket, error } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .eq('id', ticket_id)
    .single()

  if (error || !ticket) {
    return { statusCode: 404, body: JSON.stringify({ error: 'not_found' }) }
  }

  // Auth check: visitor token or user ownership
  if (ticket.is_visitor) {
    const tokenInTicket = ticket.client_meta?.visitor_token
    if (!visitor_token || !tokenInTicket || tokenInTicket !== visitor_token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'unauthorized' }) }
    }
  } else {
    if (!user_id || ticket.user_id !== user_id) {
      return { statusCode: 401, body: JSON.stringify({ error: 'unauthorized' }) }
    }
  }

  const { data: messages, error: msgError } = await supabaseAdmin
    .from('support_messages')
    .select('id, created_at, role, content, meta')
    .eq('ticket_id', ticket_id)
    .order('created_at', { ascending: true })

  if (msgError) {
    return { statusCode: 500, body: JSON.stringify({ error: msgError.message }) }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      ticket,
      messages
    })
  }
}
