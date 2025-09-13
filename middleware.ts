import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { sanitizeYear, yearKeyToPath, type YearKey } from '@/lib/academic/preview';

export async function middleware(req: NextRequest) {
  // Only process dashboard routes
  if (!req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      // Redirect to login if no session
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Get user profile with trial information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('academic_year, trial_ends_at, can_preview_years')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error in middleware:', profileError);
      // Redirect to onboarding if no profile
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    const realYear = profile.academic_year as YearKey;
    if (!realYear) {
      // Redirect to onboarding if no academic year set
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // Check for preview parameter
    const previewParam = req.nextUrl.searchParams.get('previewYear');
    const previewYear = sanitizeYear(previewParam);

    // Determine effective year
    const inTrial = new Date() <= new Date(profile.trial_ends_at);
    const canPreview = profile.can_preview_years && inTrial;
    const effectiveYear = (previewYear && canPreview) ? previewYear : realYear;

    // Get target path for effective year
    const targetPath = yearKeyToPath(effectiveYear);
    
    // If we're not on the correct path, redirect
    if (req.nextUrl.pathname !== targetPath) {
      const redirectUrl = new URL(targetPath, req.url);
      
      // Preserve preview parameter if we're previewing
      if (previewYear && canPreview && previewYear !== realYear) {
        redirectUrl.searchParams.set('previewYear', previewYear);
      }
      
      // Add headers for the target page to read
      const response = NextResponse.redirect(redirectUrl);
      response.headers.set('x-mdl-effective-year', effectiveYear);
      response.headers.set('x-mdl-real-year', realYear);
      response.headers.set('x-mdl-in-trial', inTrial ? 'true' : 'false');
      response.headers.set('x-mdl-can-preview', canPreview ? 'true' : 'false');
      
      return response;
    }

    // We're on the correct path, just add headers
    const response = NextResponse.next();
    response.headers.set('x-mdl-effective-year', effectiveYear);
    response.headers.set('x-mdl-real-year', realYear);
    response.headers.set('x-mdl-in-trial', inTrial ? 'true' : 'false');
    response.headers.set('x-mdl-can-preview', canPreview ? 'true' : 'false');
    response.headers.set('x-mdl-is-preview', (effectiveYear !== realYear) ? 'true' : 'false');

    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    // On error, redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*'
  ]
};