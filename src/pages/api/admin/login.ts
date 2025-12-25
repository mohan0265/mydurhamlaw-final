import type { NextApiRequest, NextApiResponse } from 'next'
import { createHmac } from 'crypto'

const COOKIE_NAME = 'admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 6 // 6 hours

function buildToken(username: string, password: string) {
  return createHmac('sha256', password).update(username).digest('hex')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const adminUser = process.env.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD
  if (!adminUser || !adminPass) {
    return res.status(500).json({ error: 'admin_credentials_not_configured' })
  }

  const { username, password } = req.body || {}
  if (username !== adminUser || password !== adminPass) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  const token = buildToken(adminUser, adminPass)
  const secure = process.env.NODE_ENV === 'production'
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE};${secure ? ' Secure;' : ''}`
  )
  return res.status(200).json({ ok: true })
}
