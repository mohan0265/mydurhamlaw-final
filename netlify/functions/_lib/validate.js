const MAX_SUBJECT = 200
const MAX_MESSAGE = 2000
const MAX_NAME = 120
const MAX_EMAIL = 200

function isEmail(val = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

function sanitizeString(val = '', max = 200) {
  return String(val || '').trim().slice(0, max)
}

function validateTicketInput(body) {
  const errors = []
  const subject = sanitizeString(body.subject, MAX_SUBJECT)
  const message = sanitizeString(body.message, MAX_MESSAGE)
  const visitor_name = sanitizeString(body.visitor_name, MAX_NAME)
  const visitor_email = sanitizeString(body.visitor_email, MAX_EMAIL)

  if (!subject) errors.push('subject_required')
  if (!message) errors.push('message_required')
  if (visitor_email && !isEmail(visitor_email)) errors.push('invalid_email')
  return {
    subject,
    message,
    visitor_name,
    visitor_email,
    errors
  }
}

function validateMessageInput(body) {
  const errors = []
  const ticket_id = sanitizeString(body.ticket_id, 64)
  const message = sanitizeString(body.message, MAX_MESSAGE)
  const visitor_token = sanitizeString(body.visitor_token, 128)
  if (!ticket_id) errors.push('ticket_id_required')
  if (!message) errors.push('message_required')
  return { ticket_id, message, visitor_token, errors }
}

module.exports = {
  sanitizeString,
  isEmail,
  validateTicketInput,
  validateMessageInput
}
