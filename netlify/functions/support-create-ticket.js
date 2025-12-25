const { supabaseAdmin } = require('./_lib/supabase')
const { validateTicketInput, sanitizeString } = require('./_lib/validate')
const { rateLimit } = require('./_lib/rateLimit')
const { randomUUID } = require('crypto')
const { logSupport } = require('./_lib/log')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) }
  }

  const origin = event.headers.origin || ''
  const allowed = process.env.SUPPORT_ALLOWED_ORIGINS
  if (allowed && !allowed.split(',').some((o) => origin.includes(o.trim()))) {
    return { statusCode: 403, body: JSON.stringify({ error: 'origin_not_allowed' }) }
  }

  const ip = event.headers['x-forwarded-for'] || event.ip || 'unknown'
  if (!rateLimit(`create:${ip}`)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'rate_limited' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'invalid_json' }) }
  }

  // Honeypot
  if (body._hp) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, ticket_id: null }) }
  }

  const { subject, message, visitor_email, visitor_name, errors } = validateTicketInput(body)
  if (errors.length) {
    return { statusCode: 400, body: JSON.stringify({ error: errors.join(',') }) }
  }

  const user_id = body.user_id || null
  const display_name = body.display_name || visitor_name || null
  const is_visitor = !user_id
  const visitor_token = is_visitor ? randomUUID() : null
  const page_url = sanitizeString(body.page_url, 300) || null
  const user_agent = sanitizeString(body.user_agent, 300) || null
  const client_meta = body.client_meta || {}

  const { data: ticket, error } = await supabaseAdmin
    .from('support_tickets')
    .insert({
      status: 'open',
      priority: 'normal',
      source: body.source || 'widget',
      is_visitor,
      visitor_email,
      visitor_name,
      user_id,
      display_name,
      subject,
      page_url,
      user_agent,
      client_meta: {
        ...client_meta,
        visitor_token: visitor_token || undefined
      }
    })
    .select()
    .single()

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }

  const { error: msgError } = await supabaseAdmin
    .from('support_messages')
    .insert({
      ticket_id: ticket.id,
      role: 'user',
      content: message,
      meta: { page_url, user_agent }
    })

  if (msgError) {
    return { statusCode: 500, body: JSON.stringify({ error: msgError.message }) }
  }

  logSupport('ticket_created', { ticket_id: ticket.id, is_visitor, source: body.source || 'widget' })

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      ticket_id: ticket.id,
      visitor_token
    })
  }
}
