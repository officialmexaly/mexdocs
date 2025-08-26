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
          user_id: string | null;
          is_helpful: boolean;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          article_id: string;
          user_id?: string | null;
          is_helpful: boolean;
          comment?: string | null;
        };
        Update: {
          is_helpful?: boolean;
          comment?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'admin' | 'reader';
    };
  };
}
