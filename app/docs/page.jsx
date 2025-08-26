"use client"

import React, { useState, useEffect } from 'react';
import { Search, Tag, Clock, BookOpen, Sun, Moon, ChevronLeft, ChevronRight, Copy, Check, File, Database, AlertCircle, Loader2, Eye, Grid, List, X } from 'lucide-react';

// Supabase configuration
const SUPABASE_URL = 'https://qnvbtxtpgcwovtrpugca.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFudmJ0eHRwZ2N3b3Z0cnB1Z2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTk0NTgsImV4cCI6MjA3MTY5NTQ1OH0.yKGAAPQti0E0OvEolE-yBAnpCN9xMQOQJHk1PpjAF2w';

class SupabaseClient {
  constructor(supabaseUrl, supabaseKey) {
    this.url = supabaseUrl;
    this.key = supabaseKey;
    this.headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    };
  }

  async query(table, options = {}) {
    let url = `${this.url}/rest/v1/${table}`;
    const params = new URLSearchParams();
    
    if (options.select) params.append('select', options.select);
    if (options.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        params.append(key, `eq.${value}`);
      });
    }
    if (options.order) params.append('order', options.order);
    if (options.limit) params.append('limit', options.limit);
    
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    });
    
    if (!response.ok) throw new Error(`Query failed: ${response.statusText}`);
    return response.json();
  }
}

const DocsViewPage = () => {
  const [docs, setDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [supabase, setSupabase] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Initialize Supabase client
  useEffect(() => {
    if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
      const client = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      setSupabase(client);
      setDbConnected(true);
      loadDocs(client);
    } else {
      setError('Please configure your Supabase credentials');
    }
  }, []);

  // Initialize theme
  useEffect(() => {
    setDarkMode(true);
  }, []);

  // Update theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Filter docs when search term or category changes
  useEffect(() => {
    const filtered = docs.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredDocs(filtered);
  }, [docs, searchTerm, selectedCategory]);

  const loadDocs = async (client = supabase) => {
    if (!client) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await client.query('documents', {
        select: '*',
        order: 'updated_at.desc'
      });
      
      const formattedDocs = data.map(doc => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        category: doc.category,
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
        format: doc.format || 'markdown'
      }));
      
      setDocs(formattedDocs);
    } catch (err) {
      setError(`Failed to load documents: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(docs.map(doc => doc.category))];

  const copyToClipboard = async (text, codeId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setError('Failed to copy to clipboard');
    }
  };

  const getLanguageFromCode = (codeLine) => {
    const match = codeLine.match(/^```(\w+)/);
    return match ? match[1] : 'text';
  };

  const getLanguageColor = (language) => {
    const colors = {
      javascript: 'text-yellow-400',
      js: 'text-yellow-400',
      python: 'text-blue-400',
      py: 'text-blue-400',
      java: 'text-orange-400',
      cpp: 'text-blue-300',
      c: 'text-blue-300',
      html: 'text-orange-300',
      css: 'text-blue-300',
      sql: 'text-orange-400',
      bash: 'text-green-400',
      shell: 'text-green-400',
      json: 'text-green-300',
      xml: 'text-purple-400',
      yaml: 'text-red-400',
      yml: 'text-red-400',
      default: 'text-gray-400'
    };
    return colors[language.toLowerCase()] || colors.default;
  };

  const renderMarkdown = (content) => {
    const lines = content.split('\n');
    const elements = [];
    let i = 0;
    let inCodeBlock = false;
    let codeLines = [];
    let codeLanguage = 'text';
    let codeBlockId = 0;
    let inList = false;
    let listItems = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-4 md:my-6 ml-4 md:ml-6 space-y-1 md:space-y-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-gray-700 dark:text-gray-300 leading-relaxed list-disc text-sm md:text-base">
                {item}
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
      inList = false;
    };

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('```')) {
        flushList();
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = getLanguageFromCode(line);
          codeLines = [];
          codeBlockId++;
        } else {
          inCodeBlock = false;
          const codeContent = codeLines.join('\n');
          elements.push(
            <div key={`code-${codeBlockId}-${i}`} className="relative group my-4 md:my-8">
              <div className="bg-gray-900 border border-gray-700 rounded-lg md:rounded-xl overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-4 bg-gray-800 border-b border-gray-700">
                  <span className={`text-xs md:text-sm font-mono font-medium uppercase tracking-wide ${getLanguageColor(codeLanguage)}`}>
                    {codeLanguage || 'text'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(codeContent, `code-${codeBlockId}`)}
                    className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm rounded-md transition-all duration-200 ${
                      copiedCode === `code-${codeBlockId}`
                        ? 'text-green-400 bg-green-900/30 border border-green-700'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700 border border-transparent'
                    }`}
                    title="Copy code"
                  >
                    {copiedCode === `code-${codeBlockId}` ? (
                      <>
                        <Check className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 md:p-6 overflow-x-auto">
                  <pre className="text-xs md:text-sm leading-relaxed">
                    <code className="text-green-400 font-mono">
                      {codeContent}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          );
        }
      } else if (inCodeBlock) {
        codeLines.push(line);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) inList = true;
        const content = line.slice(2).trim();
        const processedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
        listItems.push(<span dangerouslySetInnerHTML={{ __html: processedContent }} />);
      } else {
        flushList();
        
        if (line.startsWith('# ')) {
          elements.push(
            <h1 key={i} className="text-2xl md:text-4xl font-bold mb-4 md:mb-8 text-gray-900 dark:text-white border-b-2 border-gray-200 dark:border-gray-700 pb-2 md:pb-4 mt-8 md:mt-12 first:mt-0">
              {line.slice(2)}
            </h1>
          );
        } else if (line.startsWith('## ')) {
          elements.push(
            <h2 key={i} className="text-xl md:text-3xl font-semibold mb-3 md:mb-6 mt-6 md:mt-10 text-gray-800 dark:text-gray-100">
              {line.slice(3)}
            </h2>
          );
        } else if (line.startsWith('### ')) {
          elements.push(
            <h3 key={i} className="text-lg md:text-2xl font-medium mb-2 md:mb-4 mt-4 md:mt-8 text-gray-700 dark:text-gray-200">
              {line.slice(4)}
            </h3>
          );
        } else if (line.match(/^\d+\./)) {
          elements.push(
            <li key={i} className="ml-4 md:ml-6 mb-2 md:mb-3 text-gray-700 dark:text-gray-300 list-decimal leading-relaxed text-sm md:text-base">
              {line.replace(/^\d+\.\s/, '')}
            </li>
          );
        } else if (line.includes('**') || line.includes('*')) {
          const processedLine = line
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
            .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic text-gray-800 dark:text-gray-200">$1</em>');
          
          elements.push(
            <p key={i} className="mb-3 md:mb-4 leading-relaxed text-gray-700 dark:text-gray-300 text-sm md:text-lg">
              <span dangerouslySetInnerHTML={{ __html: processedLine }} />
            </p>
          );
        } else if (line.trim() === '') {
          elements.push(<div key={i} className="h-3 md:h-6"></div>);
        } else if (line.trim()) {
          elements.push(
            <p key={i} className="mb-3 md:mb-4 leading-relaxed text-gray-700 dark:text-gray-300 text-sm md:text-lg">
              {line}
            </p>
          );
        }
      }
      i++;
    }
    
    flushList();
    return <div className="space-y-1 md:space-y-2">{elements}</div>;
  };

  const renderContent = (doc) => {
    if (doc.format === 'word') {
      return (
        <div 
          className="prose prose-lg dark:prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:text-green-400"
          dangerouslySetInnerHTML={{ __html: doc.content }}
        />
      );
    } else {
      return renderMarkdown(doc.content);
    }
  };

  const getContentPreview = (content, limit = 200) => {
    const textContent = content.replace(/<[^>]*>/g, '').replace(/[#*`]/g, '');
    return textContent.length > limit ? textContent.substring(0, limit) + '...' : textContent;
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  <span className="hidden sm:inline">Documentation Hub</span>
                  <span className="sm:hidden">Docs Hub</span>
                </h1>
                <div className={`hidden md:flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full ${dbConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                  <Database className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{dbConnected ? 'Connected' : 'Not Connected'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <div className="hidden sm:flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Grid view"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                  title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedDoc ? (
          // Document View
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => setSelectedDoc(null)}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 mb-4 sm:mb-6 p-2 -ml-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm sm:text-base">Back to all documents</span>
              </button>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 sm:p-6 lg:p-8 border-b border-gray-200 dark:border-gray-700">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 leading-tight">{selectedDoc.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      {selectedDoc.category}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="hidden sm:inline">Updated </span>
                      {selectedDoc.updatedAt.toLocaleDateString()}
                    </span>
                    <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${selectedDoc.format === 'word' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {selectedDoc.format === 'word' ? 'Word Format' : 'Markdown'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDoc.tags.map(tag => (
                      <span key={tag} className="px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs sm:text-sm font-medium border border-blue-200 dark:border-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 sm:p-6 lg:p-10">
                  {renderContent(selectedDoc)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Documents List/Grid
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Filters */}
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 shadow-lg text-sm sm:text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-3 sm:px-4 py-3 sm:py-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 shadow-lg min-w-[160px] sm:min-w-48 text-sm sm:text-base"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile View Mode Toggle */}
            <div className="sm:hidden mb-4 flex justify-center">
              <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && docs.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 animate-spin mx-auto mb-3 sm:mb-4 text-blue-600 dark:text-blue-400" />
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">Loading documents...</p>
              </div>
            )}

            {/* No Documents */}
            {!loading && filteredDocs.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <Eye className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300 dark:text-gray-600" />
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  {docs.length === 0 ? 'No documents available' : 'No documents match your search'}
                </h2>
                <p className="text-sm sm:text-base text-gray-400 dark:text-gray-500 px-4">
                  {docs.length === 0 ? 'Add some documents to get started' : 'Try adjusting your search terms or filters'}
                </p>
              </div>
            )}

            {/* Documents Grid/List */}
            {filteredDocs.length > 0 && (
              <>
                <div className="mb-4 sm:mb-6 flex items-center justify-between">
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Showing {filteredDocs.length} of {docs.length} documents
                  </p>
                </div>

                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
                  : 'space-y-4 sm:space-y-6'
                }>
                  {filteredDocs.map(doc => (
                    <div
                      key={doc.id}
                      className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <div className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-2">
                            <File className={`w-4 h-4 sm:w-5 sm:h-5 ${doc.format === 'word' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${doc.format === 'word' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                              {doc.format === 'word' ? 'Word' : 'MD'}
                            </span>
                          </div>
                          <span className="px-2 sm:px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                            {doc.category}
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                          {doc.title}
                        </h3>

                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 leading-relaxed line-clamp-3">
                          {getContentPreview(doc.content, viewMode === 'grid' ? 120 : 250)}
                        </p>

                        <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                          {doc.tags.slice(0, viewMode === 'grid' ? 2 : 4).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                          {doc.tags.length > (viewMode === 'grid' ? 2 : 4) && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                              +{doc.tags.length - (viewMode === 'grid' ? 2 : 4)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="truncate">{doc.updatedAt.toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            View
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocsViewPage;