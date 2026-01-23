// src/pages/api/auth/callback.ts
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const code = req.query.code as string
  const checkEligibility = req.query.check_eligibility === 'true'

  if (!code) {
    return res.redirect('/login?error=no_code')
  }

  const supabase = createPagesServerClient({ req, res })

  // Exchange code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error)
    return res.redirect('/login?error=auth_failed')
  }

  const user = data.session?.user
  if (!user) {
    return res.redirect('/login?error=no_user')
  }

  // If this is an eligibility check, validate Durham domain
  if (checkEligibility) {
    const email = user.email
    
    if (!email?.endsWith('@durham.ac.uk')) {
      // Destroy the session for non-Durham users
      await supabase.auth.signOut()
      
      // Redirect back to eligibility with error
      return res.redirect('/eligibility?error=not_durham&email=' + encodeURIComponent(email || ''))
    }

    // Durham email confirmed - set eligibility cookie and redirect to signup
    res.setHeader('Set-Cookie', [
      `__eligibility_verified=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
    ])

    // Get stored intent from eligibility page
    const { next = '/signup', plan } = req.query
    const redirectUrl = plan ? `${next}?plan=${plan}` : next as string
    
    return res.redirect(redirectUrl)
  }

  // Regular auth callback (not from eligibility)
  return res.redirect('/dashboard')
}
