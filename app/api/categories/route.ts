import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { createErrorResponse, createSuccessResponse, createSlug } from '@/lib/utils';
import { requireAdmin } from '@/lib/auth';

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        *,
        articles:articles(count)
      `)
      .order('sort_order', { ascending: true });
    
    if (error) {
      return NextResponse.json(
        createErrorResponse(error.message),
        { status: 400 }
      );
    }
    
    // Add article count to each category
    const categoriesWithCounts = categories.map(category => ({
      ...category,
      article_count: category.articles?.[0]?.count || 0,
    }));
    
    return NextResponse.json(
      createSuccessResponse(categoriesWithCounts)
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category (admin only)
export const POST = requireAdmin(async (request: NextRequest) => {
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
    
    // Check if slug already exists
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (existing) {
      return NextResponse.json(
        createErrorResponse('Category with this name already exists'),
        { status: 400 }
      );
    }
    
    // Get next sort order
    const { data: lastCategory } = await supabase
      .from('categories')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();
    
    const nextSortOrder = (lastCategory?.sort_order || 0) + 1;
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name,
        description,
        slug,
        color: color || '#3B82F6',
        icon: icon || 'folder',
        sort_order: nextSortOrder,
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
      createSuccessResponse(category, 'Category created successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
});

// PUT /api/categories - Update categories order (admin only)
export const PUT = requireAdmin(async (request: NextRequest) => {
  try {
    const { categories } = await request.json();
    
    if (!Array.isArray(categories)) {
      return NextResponse.json(
        createErrorResponse('Categories array is required'),
        { status: 400 }
      );
    }
    
    const supabase = createSupabaseServerClient();
    
    // Update sort order for each category
    const updates = categories.map((category, index) => ({
      id: category.id,
      sort_order: index + 1,
    }));
    
    for (const update of updates) {
      const { error } = await supabase
        .from('categories')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
      
      if (error) {
        console.error('Error updating category order:', error);
      }
    }
    
    return NextResponse.json(
      createSuccessResponse(null, 'Category order updated successfully')
    );
  } catch (error) {
    console.error('Error updating categories order:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
});