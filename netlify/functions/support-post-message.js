const { supabaseAdmin } = require('./_lib/supabase')
const { validateMessageInput } = require('./_lib/validate')
const { rateLimit } = require('./_lib/rateLimit')
const fetch = require('node-fetch')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) }
  }

  const ip = event.headers['x-forwarded-for'] || event.ip || 'unknown'
  if (!rateLimit(`post:${ip}`)) {
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
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  }

  const { ticket_id, message, visitor_token, errors } = validateMessageInput(body)
  const user_id = body.user_id || null
  if (errors.length) return { statusCode: 400, body: JSON.stringify({ error: errors.join(',') }) }

  // Fetch ticket
  const { data: ticket, error } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .eq('id', ticket_id)
    .single()

  if (error || !ticket) return { statusCode: 404, body: JSON.stringify({ error: 'not_found' }) }

  // Auth check
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

  // Insert user message
  const { error: msgError } = await supabaseAdmin
    .from('support_messages')
    .insert({
      ticket_id,
      role: 'user',
      content: message,
      meta: { page_url: body.page_url || null }
    })

  if (msgError) return { statusCode: 500, body: JSON.stringify({ error: msgError.message }) }

  // Call AI helper
  let aiReply = null
  try {
    const aiRes = await fetch(`${process.env.URL || ''}/.netlify/functions/support-ai-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id,
        latest_user_message: message,
        user_profile: { user_id: ticket.user_id, display_name: ticket.display_name }
      })
    })
    const aiJson = await aiRes.json()
    if (aiJson.ok && aiJson.reply) {
      aiReply = aiJson.reply
      await supabaseAdmin
        .from('support_messages')
        .insert({
          ticket_id,
          role: 'assistant',
          content: aiReply,
          meta: {}
        })
    }
  } catch (err) {
    console.warn('[support-post-message] AI reply failed', err?.message || err)
  }

  // Return updated thread
  const { data: messages } = await supabaseAdmin
    .from('support_messages')
    .select('id, created_at, role, content, meta')
    .eq('ticket_id', ticket_id)
    .order('created_at', { ascending: true })

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, ai: aiReply, messages })
  }
}
