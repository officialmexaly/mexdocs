import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';
import { getAuthUser } from '@/lib/auth';

// GET /api/search - Full-text search across articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const categoryId = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        createErrorResponse('Search query must be at least 2 characters'),
        { status: 400 }
      );
    }
    
    const supabase = createSupabaseServerClient();
    const user = await getAuthUser(request);
    
    // Prepare search query
    let searchQuery = supabase
      .from('articles')
      .select(`
        id,
        title,
        excerpt,
        slug,
        is_published,
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
      searchQuery = searchQuery.eq('is_published', true);
    }
    
    if (categoryId) {
      searchQuery = searchQuery.eq('category_id', categoryId);
    }
    
    // Use full-text search
    searchQuery = searchQuery
      .textSearch('search_vector', query, {
        type: 'websearch',
        config: 'english',
      })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data: articles, error } = await searchQuery;
    
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
    
    countQuery = countQuery.textSearch('search_vector', query, {
      type: 'websearch',
      config: 'english',
    });
    
    const { count: totalCount } = await countQuery;
    
    // Also search categories
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('id, name, slug, description, color, icon')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(5);
    
    if (categoryError) {
      console.error('Error searching categories:', categoryError);
    }
    
    return NextResponse.json(
      createSuccessResponse({
        articles: articles || [],
        categories: categories || [],
        pagination: {
          total: totalCount || 0,
          limit,
          offset,
          hasMore: (offset + limit) < (totalCount || 0),
        },
        query,
      })
    );
  } catch (error) {
    console.error('Error performing search:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}