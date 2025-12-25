const { parse } = require('cookie')
const { createHmac } = require('crypto')

const COOKIE_NAME = 'admin_session'
function expectedToken() {
  const user = process.env.ADMIN_USERNAME
  const pass = process.env.ADMIN_PASSWORD
  if (!user || !pass) return null
  return createHmac('sha256', pass).update(user).digest('hex')
}

function isAdmin(event) {
  const token = parse(event.headers.cookie || '')[COOKIE_NAME]
  const exp = expectedToken()
  return Boolean(token && exp && token === exp)
}

module.exports = { isAdmin, expectedToken, COOKIE_NAME }
