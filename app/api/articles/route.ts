import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { createErrorResponse, createSuccessResponse, createSlug, calculateReadingTime, generateExcerpt } from '@/lib/utils';
import { requireAdmin, getAuthUser } from '@/lib/auth';

// GET /api/articles - Get all articles with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const featured = searchParams.get('featured');
    const published = searchParams.get('published');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    
    const supabase = createSupabaseServerClient();
    const user = await getAuthUser(request);
    
    let query = supabase
      .from('articles')
      .select(`
        id,
        title,
        excerpt,
        slug,
        is_published,
        is_featured,
        view_count,
        tags,
        reading_time,
        created_at,
        updated_at,
        category:categories(id, name, slug, color),
        author:user_profiles(display_name, avatar_url)
      `);
    
    // Only show published articles to non-admins
    if (!user || user.role !== 'admin') {
      query = query.eq('is_published', true);
    } else if (published !== null) {
      query = query.eq('is_published', published === 'true');
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }
    
    // Full-text search
    if (search) {
      query = query.textSearch('search_vector', search, {
        type: 'websearch',
        config: 'english',
      });
    }
    
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data: articles, error, count } = await query;
    
    if (error) {
      return NextResponse.json(
        createErrorResponse(error.message),
        { status: 400 }
      );
    }
    
    // Get total count for pagination
    let countQuery = supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    if (!user || user.role !== 'admin') {
      countQuery = countQuery.eq('is_published', true);
    }
    
    if (categoryId) {
      countQuery = countQuery.eq('category_id', categoryId);
    }
    
    if (featured === 'true') {
      countQuery = countQuery.eq('is_featured', true);
    }
    
    if (search) {
      countQuery = countQuery.textSearch('search_vector', search, {
        type: 'websearch',
        config: 'english',
      });
    }
    
    const { count: totalCount } = await countQuery;
    
    return NextResponse.json(
      createSuccessResponse({
        articles,
        pagination: {
          total: totalCount || 0,
          limit,
          offset,
          hasMore: (offset + limit) < (totalCount || 0),
        },
      })
    );
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// POST /api/articles - Create new article (admin only)
export const POST = requireAdmin(async (request: NextRequest, user: any) => {
  try {
    const {
      title,
      content,
      category_id,
      tags = [],
      is_published = false,
      is_featured = false,
      meta_title,
      meta_description,
    } = await request.json();
    
    if (!title || !content) {
      return NextResponse.json(
        createErrorResponse('Title and content are required'),
        { status: 400 }
      );
    }
    
    const slug = createSlug(title);
    const supabase = createSupabaseServerClient();
    
    // Check if slug already exists
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (existing) {
      return NextResponse.json(
        createErrorResponse('Article with this title already exists'),
        { status: 400 }
      );
    }
    
    // Generate excerpt and reading time
    const excerpt = generateExcerpt(content);
    const readingTime = calculateReadingTime(content);
    
    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        title,
        content,
        excerpt,
        slug,
        category_id,
        author_id: user.id,
        tags: Array.isArray(tags) ? tags : [],
        is_published,
        is_featured,
        meta_title: meta_title || title,
        meta_description: meta_description || excerpt,
        reading_time: readingTime,
      })
      .select(`
        *,
        category:categories(id, name, slug, color),
        author:user_profiles(display_name, avatar_url)
      `)
      .single();
    
    if (error) {
      return NextResponse.json(
        createErrorResponse(error.message),
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      createSuccessResponse(article, 'Article created successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
});