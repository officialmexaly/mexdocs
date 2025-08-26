import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/dashboard - Get admin dashboard stats
export const GET = requireAdmin(async (request: NextRequest, user: any) => {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get total counts
    const [
      articlesResult,
      categoriesResult,
      usersResult,
      viewsResult,
      feedbackResult,
    ] = await Promise.all([
      // Total articles
      supabase
        .from('articles')
        .select('id, is_published, created_at')
        .order('created_at', { ascending: false }),
      
      // Total categories
      supabase
        .from('categories')
        .select('id'),
      
      // Total users
      supabase
        .from('user_profiles')
        .select('id, role, created_at'),
      
      // Total views (last 30 days)
      supabase
        .from('article_views')
        .select('id, viewed_at, article_id')
        .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Recent feedback
      supabase
        .from('article_feedback')
        .select(`
          id,
          value,
          comment,
          created_at,
          article:articles(title, slug),
          user:user_profiles(display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);
    
    if (articlesResult.error || categoriesResult.error || usersResult.error) {
      return NextResponse.json(
        createErrorResponse('Error fetching dashboard data'),
        { status: 400 }
      );
    }
    
    const articles = articlesResult.data || [];
    const categories = categoriesResult.data || [];
    const users = usersResult.data || [];
    const views = viewsResult.data || [];
    const feedback = feedbackResult.data || [];
    
    // Calculate stats
    const totalArticles = articles.length;
    const publishedArticles = articles.filter(a => a.is_published).length;
    const draftArticles = totalArticles - publishedArticles;
    const totalCategories = categories.length;
    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const readerUsers = totalUsers - adminUsers;
    
    // Views in last 30 days
    const totalViews = views.length;
    const uniqueArticleViews = new Set(views.map(v => v.article_id)).size;
    
    // Articles created in last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentArticles = articles.filter(a => new Date(a.created_at) > weekAgo).length;
    
    // New users in last 7 days
    const recentUsers = users.filter(u => new Date(u.created_at) > weekAgo).length;
    
    // Most viewed articles
    const { data: topArticles, error: topArticlesError } = await supabase
      .from('articles')
      .select('id, title, slug, view_count, category:categories(name)')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(5);
    
    // Activity timeline (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { data: recentActivity, error: activityError } = await supabase
      .from('activity_logs')
      .select('id, action, resource_type, created_at, user:user_profiles(display_name)')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);
    
    return NextResponse.json(
      createSuccessResponse({
        stats: {
          articles: {
            total: totalArticles,
            published: publishedArticles,
            drafts: draftArticles,
            recent: recentArticles,
          },
          categories: {
            total: totalCategories,
          },
          users: {
            total: totalUsers,
            admins: adminUsers,
            readers: readerUsers,
            recent: recentUsers,
          },
          views: {
            total: totalViews,
            uniqueArticles: uniqueArticleViews,
          },
        },
        topArticles: topArticles || [],
        recentFeedback: feedback,
        recentActivity: recentActivity || [],
      })
    );
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
});