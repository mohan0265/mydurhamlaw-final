import { NextApiRequest, NextApiResponse } from 'next'
import { randomUUID } from 'crypto'
import { Resend } from 'resend'
import { getUserOrThrow } from '@/lib/apiAuth'
import { supabaseAdmin } from '@/lib/server/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 1. Validate Env Vars
  const apiKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM

  if (!apiKey || !emailFrom) {
    console.error('[awy/add-loved-one] Missing env vars: RESEND_API_KEY or EMAIL_FROM')
  }

  const resend = apiKey ? new Resend(apiKey) : null

  let user, supabase
  try {
    const auth = await getUserOrThrow(req, res)
    user = auth.user
    supabase = auth.supabase
  } catch {
    return
  }

  const { email, relationship, nickname } = req.body || {}
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const relationshipLabel = String(relationship || '').trim()
  const nicknameLabel = String(nickname || '').trim()

  if (!normalizedEmail || !relationshipLabel) {
    return res.status(400).json({ error: 'Email and relationship are required' })
  }

  try {
    // Enforce a small cap to prevent spam
    const { count } = await supabase
      .from('awy_connections')
      .select('*', { count: 'exact', head: true })
      .or(`student_id.eq.${user!.id},student_user_id.eq.${user!.id}`)

    if ((count ?? 0) >= 3) {
      return res.status(400).json({ error: 'Maximum 3 loved ones allowed' })
    }

    // Existing connection?
    const { data: existing, error: existingError } = await supabase
      .from('awy_connections')
      .select('id,invite_token,status,loved_user_id,loved_one_id,accepted_at')
      .eq('loved_email', normalizedEmail)
      .or(`student_id.eq.${user!.id},student_user_id.eq.${user!.id}`)
      .maybeSingle()

    if (existingError) {
      console.warn('[awy/add-loved-one] lookup issue:', existingError.message)
    }

    if (existing && ['active', 'accepted'].includes((existing.status || '').toLowerCase())) {
      return res.status(200).json({ ok: true, invited: false, alreadyConnected: true })
    }

    // Attempt to link to an existing user by email
    let lovedUserId: string | null = existing?.loved_user_id || existing?.loved_one_id || null
    try {
      const { data } = await supabase.auth.admin.listUsers()
      const found = data?.users?.find(u => u.email?.toLowerCase() === normalizedEmail)
      if (found?.id) lovedUserId = found.id
    } catch (lookupError: any) {
      console.warn('[awy/add-loved-one] user lookup skipped:', lookupError?.message || lookupError)
    }

    const inviteToken = existing?.invite_token || randomUUID()
    const nowIso = new Date().toISOString()
    // Use 'granted' as the standard status for the new flow, unless they are already linked ('active')
    const status = lovedUserId ? 'active' : 'granted'

    const { data: connectionData, error: upsertError } = await supabase
      .from('awy_connections')
      .upsert(
        {
          id: existing?.id,
          owner_user_id: user!.id,
          user_id: user!.id,
          student_id: user!.id,
          student_user_id: user!.id,
          loved_email: normalizedEmail,
          email: normalizedEmail,
          relationship: relationshipLabel,
          nickname: nicknameLabel || relationshipLabel,
          loved_one_id: lovedUserId,
          loved_user_id: lovedUserId,
          status,
          invite_token: inviteToken,
          invited_at: nowIso, // kept for legacy
          granted_at: nowIso,
          granted_by: user!.id,
          revoked_at: null,
          revoked_by: null,
          accepted_at: lovedUserId ? nowIso : null,
          updated_at: nowIso
        },
        { onConflict: 'student_id,loved_email' }
      )
      .select()
      .single()

    if (upsertError) throw upsertError

    // Audit Log
    const { error: auditError } = await supabase.from('awy_audit_log').insert({
      connection_id: connectionData.id,
      action: 'grant',
      actor_user_id: user!.id,
      actor_role: 'student',
      details: { email: normalizedEmail, relationship: relationshipLabel }
    })
    
    if (auditError) console.error('Audit log error:', auditError)


    // Simplified Flow: Just grant access (database record)
    // The user can now log in via Google/Auth and will be linked via trigger or existing check.

    return res.status(200).json({
      ok: true,
      invited: true, // Legacy flag, effectively "Authorized"
      message: 'Access granted. Loved one can log in now.'
    })

  } catch (error: any) {
    console.error('Add loved one error:', error)
    return res.status(500).json({ error: error.message || 'Internal error' })
  }
}
