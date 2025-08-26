import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, supabaseAdmin } from './supabase';
import { createErrorResponse, createSuccessResponse } from './utils';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'reader';
  display_name: string | null;
  avatar_url: string | null;
}

// Get authenticated user from request
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const supabase = createSupabaseServerClient();
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      return null;
    }
    
    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, display_name, avatar_url')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !profile) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email!,
      role: profile.role,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
    };
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

// Middleware to require authentication
export function requireAuth(handler: Function) {
  return async (request: NextRequest) => {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        createErrorResponse('Authentication required'),
        { status: 401 }
      );
    }
    
    return handler(request, user);
  };
}

// Middleware to require admin role
export function requireAdmin(handler: Function) {
  return async (request: NextRequest) => {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        createErrorResponse('Authentication required'),
        { status: 401 }
      );
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        createErrorResponse('Admin access required'),
        { status: 403 }
      );
    }
    
    return handler(request, user);
  };
}

// Create user profile after signup
export async function createUserProfile(userId: string, email: string, displayName?: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        display_name: displayName || email.split('@')[0],
        role: 'reader', // Default role
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
}

// Update user role (admin only)
export async function updateUserRole(userId: string, role: 'admin' | 'reader') {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user role:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating user role:', error);
    return null;
  }
}

// Log user activity
export async function logActivity(
  userId: string | null,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any,
  ipAddress?: string
) {
  try {
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: ipAddress,
      });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}