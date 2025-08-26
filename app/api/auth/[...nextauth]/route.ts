import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';

// Login endpoint
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        createErrorResponse('Email and password are required'),
        { status: 400 }
      );
    }
    
    const supabase = createSupabaseServerClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return NextResponse.json(
        createErrorResponse(error.message),
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      createSuccessResponse(data, 'Login successful')
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// Logout endpoint
export async function DELETE() {
  try {
    const supabase = createSupabaseServerClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return NextResponse.json(
        createErrorResponse(error.message),
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      createSuccessResponse(null, 'Logout successful')
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}