import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { createErrorResponse, createSuccessResponse, createSlug } from '@/lib/utils';
import { requireAdmin } from '@/lib/auth';

// GET /api/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    
    const { data: category, error } = await supabase
      .from('categories')
      .select(`
        *,
        articles:articles(
          id,
          title,
          excerpt,
          slug,
          is_published,
          view_count,
          created_at,
          updated_at,
          author:user_profiles(display_name)
        )
      `)
      .eq('id', params.id)
      .single();
    
    if (error || !category) {
      return NextResponse.json(
        createErrorResponse('Category not found'),
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      createSuccessResponse(category)
    );
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update category (admin only)
export const PUT = requireAdmin(async (
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) => {
  try {
    const { name, description, color, icon } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        createErrorResponse('Category name is required'),
        { status: 400 }
      );
    }
    
    const slug = createSlug(name);
    const supabase = createSupabaseServerClient();
    
    // Check if slug already exists for different category
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .neq('id', params.id)
      .single();
    
    if (existing) {
      return NextResponse.json(
        createErrorResponse('Category with this name already exists'),
        { status: 400 }
      );
    }
    
    const { data: category, error } = await supabase
      .from('categories')
      .update({
        name,
        description,
        slug,
        color: color || '#3B82F6',
        icon: icon || 'folder',
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        createErrorResponse(error.message),
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      createSuccessResponse(category, 'Category updated successfully')
    );
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
});

// DELETE /api/categories/[id] - Delete category (admin only)
export const DELETE = requireAdmin(async (
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = createSupabaseServerClient();
    
    // Check if category has articles
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id')
      .eq('category_id', params.id)
      .limit(1);
    
    if (articlesError) {
      return NextResponse.json(
        createErrorResponse(articlesError.message),
        { status: 400 }
      );
    }
    
    if (articles && articles.length > 0) {
      return NextResponse.json(
        createErrorResponse('Cannot delete category with articles. Move articles to another category first.'),
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      return NextResponse.json(
        createErrorResponse(error.message),
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      createSuccessResponse(null, 'Category deleted successfully')
    );
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
});