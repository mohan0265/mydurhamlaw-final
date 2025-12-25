const { supabaseAdmin } = require('./_lib/supabase')
const { parse } = require('cookie')
const { createHmac } = require('crypto')
const { Resend } = require('resend')

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

  const ticket_id = body.ticket_id
  if (!ticket_id) return { statusCode: 400, body: JSON.stringify({ error: 'ticket_id_required' }) }

  const updates = {}
  if (body.status) updates.status = body.status
  if (body.priority) updates.priority = body.priority
  if (body.tags) updates.tags = body.tags

  const { error } = await supabaseAdmin
    .from('support_tickets')
    .update(updates)
    .eq('id', ticket_id)

  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) }

  // Escalation placeholder: if pending/urgent, send email via Resend if configured, else log
  const shouldEscalate = updates.status === 'pending' || updates.priority === 'urgent'
  if (shouldEscalate) {
    try {
      const resendKey = process.env.RESEND_API_KEY
      const emailFrom = process.env.EMAIL_FROM
      const emailTo = process.env.SUPPORT_ESCALATION_EMAIL || emailFrom
      if (resendKey && emailFrom && emailTo) {
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from: emailFrom,
          to: emailTo,
          subject: `Support escalation: ${ticket_id}`,
          html: `<p>Ticket ${ticket_id} marked ${updates.status || ''} / ${updates.priority || ''}</p>`
        })
      } else {
        console.log('[support-update-ticket] escalate', ticket_id, updates)
      }
    } catch (e) {
      console.warn('[support-update-ticket] escalation failed', e?.message || e)
    }
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
