import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.signOut();
    
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}
