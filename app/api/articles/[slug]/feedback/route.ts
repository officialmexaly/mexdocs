import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';
import { requireAuth } from '@/lib/auth';

// GET /api/articles/[slug]/feedback - Get article feedback stats
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get article ID first
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', params.slug)
      .single();
    
    if (articleError || !article) {
      return NextResponse.json(
        createErrorResponse('Article not found'),
        { status: 404 }
      );
    }
    
    // Get feedback stats
    const { data: feedback, error } = await supabase
      .from('article_feedback')
      .select('value, comment, created_at, user:user_profiles(display_name)')
      .eq('article_id', article.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json(
        createErrorResponse(error.message),
        { status: 400 }
      );
    }
    
    const stats = {
      helpful: feedback?.filter(f => f.value === 1).length || 0,
      notHelpful: feedback?.filter(f => f.value === -1).length || 0,
      total: feedback?.length || 0,
      comments: feedback?.filter(f => f.comment).length || 0,
    };
    
    return NextResponse.json(
      createSuccessResponse({
        stats,
        feedback: feedback || [],
      })
    );
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// POST /api/articles/[slug]/feedback - Submit feedback (authenticated users)
export const POST = requireAuth(async (
  request: NextRequest,
  user: any,
  { params }: { params: { slug: string } }
) => {
  try {
    const { value, comment } = await request.json();
    
    if (!value || ![1, -1].includes(value)) {
      return NextResponse.json(
        createErrorResponse('Feedback value must be 1 (helpful) or -1 (not helpful)'),
        { status: 400 }
      );
    }
    
    const supabase = createSupabaseServerClient();
    
    // Get article ID first
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', params.slug)
      .eq('is_published', true)
      .single();
    
    if (articleError || !article) {
      return NextResponse.json(
        createErrorResponse('Article not found'),
        { status: 404 }
      );
    }
    
    // Check if user already gave feedback
    const { data: existingFeedback } = await supabase
      .from('article_feedback')
      .select('id')
      .eq('article_id', article.id)
      .eq('user_id', user.id)
      .single();
    
    if (existingFeedback) {
      // Update existing feedback
      const { data: feedback, error } = await supabase
        .from('article_feedback')
        .update({
          value,
          comment: comment || null,
        })
        .eq('id', existingFeedback.id)
        .select()
        .single();
      
      if (error) {
        return NextResponse.json(
          createErrorResponse(error.message),
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        createSuccessResponse(feedback, 'Feedback updated successfully')
      );
    } else {
      // Create new feedback
      const { data: feedback, error } = await supabase
        .from('article_feedback')
        .insert({
          article_id: article.id,
          user_id: user.id,
          value,
          comment: comment || null,
        })
        .select()
        .single();
      
      if (error) {
        return NextResponse.json(
          createErrorResponse(error.message),
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        createSuccessResponse(feedback, 'Feedback submitted successfully'),
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
});