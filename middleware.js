import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // Only run middleware on admin routes
  if (pathname.startsWith('/admin')) {
    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables not configured');
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/setup-required';
      return NextResponse.redirect(redirectUrl);
    }

    try {
      const supabase = createMiddlewareClient({ req, res });
      
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // If no session, redirect to signin
      if (!session) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/auth/signin';
        redirectUrl.searchParams.set('redirectedFrom', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Optional: Check admin role at middleware level
      // Uncomment if you want role checking in middleware
      /*
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userProfile?.role !== 'admin') {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/unauthorized';
        return NextResponse.redirect(redirectUrl);
      }
      */

    } catch (error) {
      console.error('Middleware auth error:', error);
      // If there's an error, redirect to signin
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/auth/signin';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*']
};
