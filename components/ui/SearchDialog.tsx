'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, FileText, Folder } from 'lucide-react';
import { debounce } from '@/lib/utils';

interface SearchResult {
  articles: Array<{
    id: string;
    title: string;
    excerpt: string | null;
    slug: string;
    category?: { name: string; color: string } | null;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string;
  }>;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  // Debounced search function
  const performSearch = debounce(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    performSearch(query);
  }, [query]);

  const handleResultClick = (slug: string, type: 'article' | 'category') => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
    }
    
    const url = type === 'article' ? `/articles/${slug}` : `/categories/${slug}`;
    router.push(url);
    onOpenChange(false);
    setQuery('');
    setResults(null);
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent-searches');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <div className="bg-card border rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Search input */}
        <div className="flex items-center border-b p-4">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <input
            type="text"
            placeholder="Search articles and categories..."
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-muted rounded ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search results */}
        <div className="overflow-y-auto max-h-96 scrollbar-thin">
          {loading && (
            <div className="p-8 text-center">
              <div className="loading-spinner w-6 h-6 mx-auto mb-2" />
              <p className="text-muted-foreground">Searching...</p>
            </div>
          )}

          {!loading && query.length >= 2 && results && (
            <div className="p-2">
              {/* Categories */}
              {results.categories.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
                    Categories
                  </h3>
                  {results.categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleResultClick(category.slug, 'category')}
                      className="w-full flex items-center p-3 hover:bg-muted rounded-lg text-left transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Folder className="w-4 h-4" style={{ color: category.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {category.name}
                        </h4>
                        {category.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Articles */}
              {results.articles.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
                    Articles
                  </h3>
                  {results.articles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleResultClick(article.slug, 'article')}
                      className="w-full flex items-start p-3 hover:bg-muted rounded-lg text-left transition-colors"
                    >
                      <FileText className="w-5 h-5 text-muted-foreground mr-3 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground line-clamp-1 mb-1">
                          {article.title}
                        </h4>
                        {article.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}
                        {article.category && (
                          <span
                            className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full"
                            style={{
                              backgroundColor: `${article.category.color}20`,
                              color: article.category.color,
                            }}
                          >
                            {article.category.name}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.articles.length === 0 && results.categories.length === 0 && (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-foreground mb-1">No results found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or browse categories instead.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recent searches */}
          {!loading && query.length < 2 && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Recent Searches
                </h3>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((recentQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(recentQuery)}
                  className="w-full flex items-center p-3 hover:bg-muted rounded-lg text-left transition-colors"
                >
                  <Clock className="w-4 h-4 text-muted-foreground mr-3" />
                  <span className="text-foreground">{recentQuery}</span>
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && query.length < 2 && recentSearches.length === 0 && (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-1">Search Knowledge Base</h3>
              <p className="text-muted-foreground">
                Find articles, tutorials, and guides across all categories.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}