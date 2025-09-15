import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public routes that don't require auth
  const publicPaths = ['/', '/login', '/auth', '/legal', '/about'];
  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path)
  );

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (session) {
    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', session.user.id)
      .single();

    const userRole = profile?.user_role || 'student';

    // Define allowed paths for each role
    const studentPaths = [
      '/dashboard', '/study', '/assignments', '/research-hub', 
      '/lounge', '/community', '/news', '/settings'
    ];
    
    const lovedOnePaths = [
      '/loved-one/dashboard', '/loved-one/calls', '/settings/awy'
    ];

    // Redirect based on role and current path
    if (userRole === 'loved_one') {
      const isAllowedPath = lovedOnePaths.some(path => 
        req.nextUrl.pathname.startsWith(path)
      ) || publicPaths.some(path => 
        req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path)
      );

      if (!isAllowedPath) {
        return NextResponse.redirect(new URL('/loved-one/dashboard', req.url));
      }
    } else if (userRole === 'student') {
      // Students have access to most paths, just redirect loved-one paths
      if (req.nextUrl.pathname.startsWith('/loved-one/')) {
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
