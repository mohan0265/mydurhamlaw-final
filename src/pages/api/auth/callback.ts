// src/pages/api/auth/callback.ts
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const code = req.query.code as string
  const role = req.query.role as string // 'student' or 'lovedone'
  const checkEligibility = req.query.check_eligibility === 'true'
  const signupDataRaw = req.query.signup_data as string

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

  const email = user.email || ''
  const isDurham = email.endsWith('@durham.ac.uk')

  // Parse signup data if present to check role inside
  let internalRole = role
  if (signupDataRaw && !internalRole) {
    try {
        const decoded = JSON.parse(decodeURIComponent(signupDataRaw))
        if (decoded.role) internalRole = decoded.role
    } catch (e) {
        console.warn('Failed to parse signup_data for role')
    }
  }

  // ✅ ROLE-AWARE DOMAIN ENFORCEMENT
  // Security Default: If no role is specified, assume 'student' for safety
  const effectiveRole = internalRole || 'student'
  
  if (effectiveRole === 'student') {
    if (!isDurham) {
        console.log(`Blocking non-Durham student signup: ${email}`)
        await supabase.auth.signOut()
        return res.redirect(`/restricted?reason=domain_not_allowed&email=${encodeURIComponent(email)}`)
    }
  } else if (effectiveRole === 'lovedone') {
    // Loved ones are allowed any domain, proceed to dashboard
    console.log(`Allowing Loved One login for: ${email}`)
    return res.redirect('/loved-one-dashboard')
  }

  // ✅ Eligible or Student bypass passed (for Durham account)
  
  // Set eligibility verification cookie (optional but kept for compatibility)
  res.setHeader('Set-Cookie', [
    `__eligibility_verified=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
  ])

  // If this was an explicit check_eligibility=true or has signup_data, go to signup
  if (checkEligibility || signupDataRaw) {
    const { next = '/signup', plan } = req.query
    const redirectUrl = plan ? `${next}?plan=${plan}` : next as string
    
    // Ensure signup_data is preserved for the next page
    const finalUrl = signupDataRaw 
        ? `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}signup_data=${encodeURIComponent(signupDataRaw)}`
        : redirectUrl
        
    return res.redirect(finalUrl)
  }

  // Regular login/already verified
  return res.redirect('/dashboard')
}
