import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Guard against missing env vars to prevent undici crashes in createMiddlewareClient
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Middleware skipping: Missing Supabase Env Vars");
    return res;
  }

  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public routes
  const publicPaths = ['/', '/login', '/auth', '/legal', '/about', '/loved-one-login'];
  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path)
  );

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (session) {
    const meta = session.user;
    let userRole =
      ((meta.user_metadata?.role as string) ||
        (meta.user_metadata?.user_role as string) ||
        (meta.app_metadata?.role as string) ||
        (meta.app_metadata?.user_role as string)) ??
      'student';

    if (!userRole || typeof userRole !== 'string') {
      userRole = 'student';
    }

    if (userRole === 'student') {
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profileError && profile?.user_role) {
        userRole = profile.user_role as string;
      }
    }

    // Define allowed paths
    const lovedOnePaths = [
      '/loved-one-dashboard', 
      '/loved-one-settings',
      '/api/awy' // Allow API access
    ];

    // Redirect based on role
    if (userRole === 'loved_one') {
      // Loved ones can only access specific paths
      const isAllowed = lovedOnePaths.some(path => 
        req.nextUrl.pathname.startsWith(path)
      ) || publicPaths.some(path => 
        req.nextUrl.pathname.startsWith(path)
      );

      if (!isAllowed) {
        return NextResponse.redirect(new URL('/loved-one-dashboard', req.url));
      }
    } else {
      // Students/Admins cannot access loved one login/dashboard (optional, but good for clarity)
      if (req.nextUrl.pathname === '/loved-one-login') {
         return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
