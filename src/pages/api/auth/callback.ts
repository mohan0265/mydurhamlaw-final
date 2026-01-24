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

  const email = user.email
  const isDurham = email?.endsWith('@durham.ac.uk')

  // ✅ STRICT DOMAIN ENFORCEMENT for ALL signups
  if (!isDurham) {
    // Destroy the session for non-Durham users
    await supabase.auth.signOut()
    
    // Redirect to unified restricted page
    return res.redirect(`/restricted?reason=domain_not_allowed&email=${encodeURIComponent(email || '')}`)
  }

  // ✅ Eligible (Durham account)
  
  // Set eligibility verification cookie
  res.setHeader('Set-Cookie', [
    `__eligibility_verified=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
  ])

  // If this was an explicit check_eligibility=true, ensure we go to the right next step
  if (checkEligibility || req.url?.includes('signup_data')) {
    const { next = '/signup', plan } = req.query
    const redirectUrl = plan ? `${next}?plan=${plan}` : next as string
    return res.redirect(redirectUrl)
  }

  // Regular login/already verified
  return res.redirect('/dashboard')
}
