import Link from 'next/link';
import { Clock, Eye, User, Star } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  view_count: number;
  reading_time: number | null;
  created_at: string;
  category?: {
    name: string;
    color: string;
  } | null;
  author?: {
    display_name: string | null;
  } | null;
}

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
  showViews?: boolean;
}

export function ArticleCard({ article, featured = false, showViews = false }: ArticleCardProps) {
  return (
    <Link href={`/articles/${article.slug}`}>
      <article className={`card hover:shadow-md transition-all duration-200 group cursor-pointer h-full ${
        featured ? 'ring-1 ring-primary/20' : ''
      }`}>
        <div className="card-content p-6">
          {featured && (
            <div className="flex items-center mb-3">
              <Star className="w-4 h-4 text-amber-500 mr-1" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Featured
              </span>
            </div>
          )}
          
          {article.category && (
            <div className="mb-3">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${article.category.color}20`,
                  color: article.category.color,
                }}
              >
                {article.category.name}
              </span>
            </div>
          )}

          <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>

          {article.excerpt && (
            <p className="text-muted-foreground mb-4 line-clamp-3">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto">
            <div className="flex items-center space-x-4">
              {article.author?.display_name && (
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  <span>{article.author.display_name}</span>
                </div>
              )}
              
              {article.reading_time && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{article.reading_time} min read</span>
                </div>
              )}

              {showViews && article.view_count > 0 && (
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  <span>{article.view_count.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            <time className="text-xs">
              {formatRelativeTime(article.created_at)}
            </time>
          </div>
        </div>
      </article>
    </Link>
  );
}