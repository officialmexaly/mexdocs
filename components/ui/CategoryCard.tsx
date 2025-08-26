import Link from 'next/link';
import { FileText, ChevronRight, FolderOpen } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  color: string;
  icon: string;
  article_count: number;
}

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/categories/${category.slug}`}>
      <div className="card hover:shadow-md transition-all duration-200 hover:scale-105 group cursor-pointer h-full">
        <div className="card-content p-6">
          <div className="flex items-start justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <FolderOpen 
                className="w-6 h-6" 
                style={{ color: category.color }}
              />
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          
          {category.description && (
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {category.description}
            </p>
          )}
          
          <div className="flex items-center text-sm text-muted-foreground">
            <FileText className="w-4 h-4 mr-1" />
            <span>
              {category.article_count} {category.article_count === 1 ? 'article' : 'articles'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}