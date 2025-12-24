import type { NextApiRequest, NextApiResponse } from 'next'
import { parse } from 'cookie'
import { createHmac } from 'crypto'
import { supabaseAdmin } from '@/lib/server/supabaseAdmin'

const COOKIE_NAME = 'admin_session'

function expectedToken() {
  const adminUser = process.env.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD
  if (!adminUser || !adminPass) return null
  return createHmac('sha256', adminPass).update(adminUser).digest('hex')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const token = parse(req.headers.cookie || '')[COOKIE_NAME]
  const exp = expectedToken()
  if (!token || !exp || token !== exp) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const { id, display_name, user_role, year_group } = req.body || {}
  if (!id) return res.status(400).json({ error: 'profile id required' })

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (display_name !== undefined) updates.display_name = display_name
  if (user_role !== undefined) updates.user_role = user_role
  if (year_group !== undefined) updates.year_group = year_group

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}
