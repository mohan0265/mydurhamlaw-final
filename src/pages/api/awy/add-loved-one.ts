import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 1. Authenticate the student
  const supabase = createPagesServerClient({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { email, relationship, nickname } = req.body

  if (!email || !relationship) {
    return res.status(400).json({ error: 'Email and relationship are required' })
  }

  try {
    // 2. Check limit (max 3)
    const { count } = await supabase
      .from('awy_connections')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', session.user.id)

    if (count && count >= 3) {
      return res.status(400).json({ error: 'Maximum 3 loved ones allowed' })
    }

    // 3. Check if already exists
    const { data: existing } = await supabase
      .from('awy_connections')
      .select('id')
      .eq('student_id', session.user.id)
      .ilike('loved_email', email)
      .single()

    if (existing) {
      return res.status(400).json({ error: 'This loved one is already connected or pending' })
    }

    // 4. Create Connection Record
    const adminSupabase = getSupabaseClient()
    
    // Check if user exists to link immediately
    const { data: { users } } = await adminSupabase.auth.admin.listUsers()
    const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    const { error: insertError } = await supabase
      .from('awy_connections')
      .insert({
        student_id: session.user.id,
        loved_email: email,
        relationship,
        nickname,
        loved_one_id: existingUser?.id || null, // Link immediately if they exist
        status: existingUser ? 'active' : 'pending'
      })

    if (insertError) throw insertError

    // 5. Generate Magic Link & Send Email
    let emailSent = false
    try {
      // Generate link
      const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/loved-one-dashboard`,
          data: { role: 'loved_one' } // Ensure they get the role if new
        }
      })

      if (linkError) throw linkError

      // Send email via Resend
      const { error: emailError } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'MyDurhamLaw <onboarding@resend.dev>', // Default fallback
        to: email,
        subject: '[MyDurhamLaw] You’ve been invited to Always With You',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #db2777;">Welcome to MyDurhamLaw</h1>
            <p>You have been invited by a student to be their "Always With You" connection.</p>
            <p>This allows you to see when they are studying and available to talk, and lets you show them your support.</p>
            <div style="margin: 30px 0;">
              <a href="${linkData.properties.action_link}" style="background-color: #db2777; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Open MyDurhamLaw
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">If the button doesn't work, copy this link: ${linkData.properties.action_link}</p>
          </div>
        `
      })

      if (emailError) {
        console.error('Resend error:', emailError)
      } else {
        emailSent = true
      }

    } catch (err) {
      console.error('Email sending failed:', err)
      // We don't fail the request, just report it
    }

    return res.status(200).json({ 
      ok: true, 
      invited: true, 
      emailSent,
      message: emailSent ? 'Invitation sent successfully' : 'Connection created, but email failed to send.'
    })

  } catch (error: any) {
    console.error('Add loved one error:', error)
    return res.status(500).json({ error: error.message })
  }
}
