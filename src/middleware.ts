import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
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
    // Get user role - check both 'role' (new) and 'user_role' (legacy) just in case
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, user_role')
      .eq('id', session.user.id)
      .single();

    const userRole = profile?.role || profile?.user_role || 'student';

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
