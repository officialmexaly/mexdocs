import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { createErrorResponse, createSuccessResponse, createSlug, calculateReadingTime, generateExcerpt } from '@/lib/utils';
import { requireAdmin, getAuthUser } from '@/lib/auth';

// GET /api/articles/[slug] - Get single article
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const user = await getAuthUser(request);
    
    let query = supabase
      .from('articles')
      .select(`
        *,
        category:categories(id, name, slug, color, icon),
        author:user_profiles(display_name, avatar_url),
        feedback:article_feedback(value)
      `)
      .eq('slug', params.slug);
    
    // Only show published articles to non-admins
    if (!user || user.role !== 'admin') {
      query = query.eq('is_published', true);
    }
    
    const { data: article, error } = await query.single();
    
    if (error || !article) {
      return NextResponse.json(
        createErrorResponse('Article not found'),
        { status: 404 }
      );
    }
    
    // Calculate feedback stats
    const feedbackStats = {
      helpful: article.feedback?.filter((f: any) => f.value === 1).length || 0,
      notHelpful: article.feedback?.filter((f: any) => f.value === -1).length || 0,
    };
    
    // Remove feedback array from response (we only need the stats)
    const { feedback, ...articleWithoutFeedback } = article;
    
    // Track article view (if user is authenticated)
    if (user) {
      try {
        await supabase
          .from('article_views')
          .insert({
            article_id: article.id,
            user_id: user.id,
            ip_address: request.headers.get('x-forwarded-for') || request.ip,
            user_agent: request.headers.get('user-agent'),
          });
        
        // Increment view count
        await supabase
          .from('articles')
          .update({ view_count: article.view_count + 1 })
          .eq('id', article.id);
      } catch (viewError) {
        // Don't fail the request if view tracking fails
        console.error('Error tracking article view:', viewError);
      }
    }
    
    return NextResponse.json(
      createSuccessResponse({
        ...articleWithoutFeedback,
        feedback_stats: feedbackStats,
      })
    );
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// PUT /api/articles/[slug] - Update article (admin only)
export const PUT = requireAdmin(async (
  request: NextRequest,
  user: any,
  { params }: { params: { slug: string } }
) => {
  try {
    const {
      title,
      content,
      category_id,
      tags = [],
      is_published,
      is_featured,
      meta_title,
      meta_description,
    } = await request.json();
    
    if (!title || !content) {
      return NextResponse.json(
        createErrorResponse('Title and content are required'),
        { status: 400 }
      );
    }
    
    const newSlug = createSlug(title);
    const supabase = createSupabaseServerClient();
    
    // Get current article
    const { data: currentArticle, error: fetchError } = await supabase
      .from('articles')
      .select('id, slug, title')
      .eq('slug', params.slug)
      .single();
    
    if (fetchError || !currentArticle) {
      return NextResponse.json(
        createErrorResponse('Article not found'),
        { status: 404 }
      );
    }
    
    // Check if new slug conflicts with existing article (if title changed)
    if (newSlug !== params.slug) {
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', currentArticle.id)
        .single();
      
      if (existing) {
        return NextResponse.json(
          createErrorResponse('Article with this title already exists'),
          { status: 400 }
        );
      }
    }
    
    // Generate excerpt and reading time
    const excerpt = generateExcerpt(content);
    const readingTime = calculateReadingTime(content);
    
    const { data: article, error } = await supabase
      .from('articles')
      .update({
        title,
        content,
        excerpt,
        slug: newSlug,
        category_id,
        tags: Array.isArray(tags) ? tags : [],
        is_published: is_published !== undefined ? is_published : true,
        is_featured: is_featured !== undefined ? is_featured : false,
        meta_title: meta_title || title,
        meta_description: meta_description || excerpt,
        reading_time: readingTime,
      })
      .eq('id', currentArticle.id)
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
      createSuccessResponse(article, 'Article updated successfully')
    );
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
});

// DELETE /api/articles/[slug] - Delete article (admin only)
export const DELETE = requireAdmin(async (
  request: NextRequest,
  user: any,
  { params }: { params: { slug: string } }
) => {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get article ID first
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', params.slug)
      .single();
    
    if (fetchError || !article) {
      return NextResponse.json(
        createErrorResponse('Article not found'),
        { status: 404 }
      );
    }
    
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', article.id);
    
    if (error) {
      return NextResponse.json(
        createErrorResponse(error.message),
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      createSuccessResponse(null, 'Article deleted successfully')
    );
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
});