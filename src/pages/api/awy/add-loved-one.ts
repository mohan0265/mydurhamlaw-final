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
    const status = lovedUserId ? 'active' : 'pending'

    const { error: upsertError } = await supabase
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
          invited_at: nowIso,
          accepted_at: lovedUserId ? nowIso : null,
          updated_at: nowIso
        },
        { onConflict: 'student_id,loved_email' }
      )

    if (upsertError) throw upsertError

    // Prepare invite link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const magicLink = `${siteUrl}/awy/invite?token=${inviteToken}`
    
    let emailStatus: 'sent' | 'failed' = 'failed'
    let emailError: string | undefined

    // Attempt Verification Email
    if (magicLink) {
      if (!resend || !emailFrom) {
         emailError = 'Service configuration missing (RESEND_API_KEY or EMAIL_FROM).'
         console.warn(`[awy/add-loved-one] ${emailError}`)
      } else {
        try {
          const { data: emailData, error: sendError } = await resend.emails.send({
            from: emailFrom,
            to: normalizedEmail,
            subject: "[MyDurhamLaw] You've been invited to Always With You",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #db2777;">Welcome to MyDurhamLaw</h1>
                <p>You have been invited to be part of a student's "Always With You" circle.</p>
                <div style="margin: 30px 0;">
                  <a href="${magicLink}" style="background-color: #db2777; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Open MyDurhamLaw
                  </a>
                </div>
                <p style="color: #666; font-size: 14px;">If the button doesn't work, copy this link: ${magicLink}</p>
              </div>
            `
          })

          if (sendError) {
             console.error('[awy/add-loved-one] Resend API error:', sendError)
             emailError = sendError.message
          } else {
             console.log(`[awy/add-loved-one] Email sent to ${normalizedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')} | ID: ${emailData?.id}`)
             emailStatus = 'sent'
          }
        } catch (postErr: any) {
          console.error('[awy/add-loved-one] Resend exception:', postErr)
          emailError = postErr.message
        }
      }
    } else {
      emailError = 'Could not generate magic link.'
    }

    return res.status(200).json({
      ok: true,
      invited: true,
      emailSent: emailStatus === 'sent',
      emailStatus,
      emailError,
      status,
      inviteLink: magicLink,
      warning: emailStatus === 'failed' ? 'Email failed to send, please share link manually.' : undefined
    })

  } catch (error: any) {
    console.error('Add loved one error:', error)
    return res.status(500).json({ error: error.message || 'Internal error' })
  }
}
