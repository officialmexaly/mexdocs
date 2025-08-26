import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client component client (for app directory)
export const createSupabaseClient = () => {
  return createClientComponentClient();
};

// Server component client (for app directory)
export const createSupabaseServerClient = () => {
  return createServerComponentClient({ cookies });
};

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Types for database tables
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          role: 'admin' | 'reader';
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'admin' | 'reader';
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          role?: 'admin' | 'reader';
          display_name?: string | null;
          avatar_url?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          slug: string;
          color: string;
          icon: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          slug: string;
          color?: string;
          icon?: string;
          sort_order?: number;
        };
        Update: {
          name?: string;
          description?: string | null;
          slug?: string;
          color?: string;
          icon?: string;
          sort_order?: number;
        };
      };
      articles: {
        Row: {
          id: string;
          title: string;
          content: any;
          excerpt: string | null;
          slug: string;
          category_id: string | null;
          author_id: string | null;
          is_published: boolean;
          is_featured: boolean;
          view_count: number;
          tags: string[];
          meta_title: string | null;
          meta_description: string | null;
          reading_time: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          content: any;
          excerpt?: string | null;
          slug: string;
          category_id?: string | null;
          author_id?: string | null;
          is_published?: boolean;
          is_featured?: boolean;
          tags?: string[];
          meta_title?: string | null;
          meta_description?: string | null;
          reading_time?: number | null;
        };
        Update: {
          title?: string;
          content?: any;
          excerpt?: string | null;
          slug?: string;
          category_id?: string | null;
          is_published?: boolean;
          is_featured?: boolean;
          tags?: string[];
          meta_title?: string | null;
          meta_description?: string | null;
          reading_time?: number | null;
        };
      };
      article_feedback: {
        Row: {
          id: string;
          article_id: string;
          user_id: string;
          value: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          article_id: string;
          user_id: string;
          value: number;
          comment?: string | null;
        };
        Update: {
          value?: number;
          comment?: string | null;
        };
      };
      article_views: {
        Row: {
          id: string;
          article_id: string;
          user_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          viewed_at: string;
        };
        Insert: {
          article_id: string;
          user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {};
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];