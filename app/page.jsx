"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, FileText, Tag, Clock, Edit, Trash2, Save, X, BookOpen, Menu, Sun, Moon, ChevronLeft, ChevronRight, Copy, Check, Upload, Download, File, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, AlertCircle, Loader2, Database } from 'lucide-react';

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

  async insert(table, data) {
    const response = await fetch(`${this.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        ...this.headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error(`Insert failed: ${response.statusText}`);
    return response.json();
  }

  async update(table, id, data) {
    const response = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        ...this.headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error(`Update failed: ${response.statusText}`);
    return response.json();
  }

  async delete(table, id) {
    const response = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers: this.headers
    });
    
    if (!response.ok) throw new Error(`Delete failed: ${response.statusText}`);
    return true;
  }
}

const TechDocsApp = () => {
  const [docs, setDocs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showWordTools, setShowWordTools] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [supabase, setSupabase] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const contentRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    category: '',
    tags: [],
    format: 'markdown'
  });

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && mobileMenuOpen && !event.target.closest('.sidebar') && !event.target.closest('.mobile-menu-trigger')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, mobileMenuOpen]);

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
  
  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateDoc = () => {
    setEditForm({
      title: '',
      content: '',
      category: '',
      tags: [],
      format: 'markdown'
    });
    setShowCreateForm(true);
    setShowWordTools(false);
    setMobileMenuOpen(false);
  };

  const handleSaveDoc = async () => {
    if (!editForm.title || !editForm.content || !supabase) return;

    setLoading(true);
    setError(null);

    try {
      const docData = {
        title: editForm.title,
        content: editForm.content,
        category: editForm.category || 'General',
        tags: Array.isArray(editForm.tags) ? editForm.tags : editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        format: editForm.format,
        updated_at: new Date().toISOString()
      };

      if (isEditing) {
        const [updatedDoc] = await supabase.update('documents', selectedDoc.id, docData);
        const formattedDoc = {
          id: updatedDoc.id,
          title: updatedDoc.title,
          content: updatedDoc.content,
          category: updatedDoc.category,
          tags: Array.isArray(updatedDoc.tags) ? updatedDoc.tags : [],
          createdAt: new Date(updatedDoc.created_at),
          updatedAt: new Date(updatedDoc.updated_at),
          format: updatedDoc.format || 'markdown'
        };
        
        setDocs(docs.map(doc => doc.id === selectedDoc.id ? formattedDoc : doc));
        setSelectedDoc(formattedDoc);
      } else {
        docData.created_at = new Date().toISOString();
        const [newDoc] = await supabase.insert('documents', docData);
        const formattedDoc = {
          id: newDoc.id,
          title: newDoc.title,
          content: newDoc.content,
          category: newDoc.category,
          tags: Array.isArray(newDoc.tags) ? newDoc.tags : [],
          createdAt: new Date(newDoc.created_at),
          updatedAt: new Date(newDoc.updated_at),
          format: newDoc.format || 'markdown'
        };
        
        setDocs([formattedDoc, ...docs]);
      }

      setIsEditing(false);
      setShowCreateForm(false);
      setShowWordTools(false);
    } catch (err) {
      setError(`Failed to save document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDoc = (doc) => {
    setEditForm({
      title: doc.title,
      content: doc.content,
      category: doc.category,
      tags: doc.tags,
      format: doc.format || 'markdown'
    });
    setIsEditing(true);
    setShowWordTools(doc.format === 'word');
  };

  const handleDeleteDoc = async (docId) => {
    if (!supabase) return;
    
    if (!confirm('Are you sure you want to delete this document?')) return;

    setLoading(true);
    setError(null);

    try {
      await supabase.delete('documents', docId);
      setDocs(docs.filter(doc => doc.id !== docId));
      if (selectedDoc && selectedDoc.id === docId) {
        setSelectedDoc(null);
      }
    } catch (err) {
      setError(`Failed to delete document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDocSelect = (doc) => {
    setSelectedDoc(doc);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleFormatToggle = (format) => {
    setEditForm({...editForm, format});
    setShowWordTools(format === 'word');
    
    if (format === 'word' && editForm.format === 'markdown') {
      let htmlContent = editForm.content
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<div class="code-block"><pre><code>$2</code></pre></div>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[h|l|d])/gm, '<p>')
        .replace(/<p><\/p>/g, '')
        .replace(/<li>/g, '<ul><li>')
        .replace(/<\/li>(?!\s*<li>)/g, '</li></ul>');
      
      setEditForm({...editForm, content: htmlContent, format});
    } else if (format === 'markdown' && editForm.format === 'word') {
      let markdownContent = editForm.content
        .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
        .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
        .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<em>(.*?)<\/em>/g, '*$1*')
        .replace(/<ul><li>(.*?)<\/li><\/ul>/g, '- $1')
        .replace(/<li>(.*?)<\/li>/g, '- $1')
        .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
        .replace(/<div class="code-block"><pre><code>([\s\S]*?)<\/code><\/pre><\/div>/g, '```\n$1\n```')
        .replace(/<[^>]*>/g, '');
      
      setEditForm({...editForm, content: markdownContent, format});
    }
  };

  const handleWordFormatting = (command, value = null) => {
    if (contentRef.current) {
      contentRef.current.focus();
      document.execCommand(command, false, value);
      
      const newContent = contentRef.current.innerHTML;
      setEditForm({...editForm, content: newContent});
    }
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setEditForm({
          ...editForm,
          content: content,
          title: editForm.title || file.name.replace(/\.[^/.]+$/, "")
        });
      };
      reader.readAsText(file);
    }
  };

  const handleExportToWord = () => {
    if (!selectedDoc) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${selectedDoc.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1, h2, h3 { color: #333; margin-top: 24px; margin-bottom: 16px; }
          h1 { border-bottom: 2px solid #eee; padding-bottom: 8px; }
          .code-block { background: #f5f5f5; border: 1px solid #ddd; padding: 16px; margin: 16px 0; border-radius: 4px; }
          pre { margin: 0; white-space: pre-wrap; }
          ul, ol { margin: 16px 0; padding-left: 32px; }
          li { margin: 4px 0; }
          strong { font-weight: bold; }
          em { font-style: italic; }
        </style>
      </head>
      <body>
        <h1>${selectedDoc.title}</h1>
        <p><strong>Category:</strong> ${selectedDoc.category}</p>
        <p><strong>Tags:</strong> ${selectedDoc.tags.join(', ')}</p>
        <p><strong>Last Updated:</strong> ${selectedDoc.updatedAt.toLocaleDateString()}</p>
        <hr>
        ${selectedDoc.format === 'word' ? selectedDoc.content : renderMarkdownToHtml(selectedDoc.content)}
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDoc.title}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderMarkdownToHtml = (content) => {
    return content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<div class="code-block"><pre><code>$2</code></pre></div>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|l|d])/gm, '<p>');
  };

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

  const renderContent = (doc) => {
    if (doc.format === 'word') {
      return (
        <div 
          className="prose prose-sm md:prose-lg dark:prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:text-green-400"
          dangerouslySetInnerHTML={{ __html: doc.content }}
        />
      );
    } else {
      return renderMarkdown(doc.content);
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

  // Responsive classes
  const sidebarWidth = isMobile ? 'w-full' : (sidebarCollapsed ? 'w-16' : 'w-80');
  const mainMargin = isMobile ? 'ml-0' : (sidebarCollapsed ? 'ml-16' : 'ml-80');
  const sidebarPosition = isMobile ? (mobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0';

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
        {/* Mobile Header */}
        {isMobile && (
          <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 fixed top-0 left-0 right-0 z-50 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="mobile-menu-trigger p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Tech Docs</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full ${dbConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                  <Database className="w-3 h-3" />
                  {dbConnected ? 'Connected' : 'Not Connected'}
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Overlay */}
        {isMobile && mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Error Banner */}
        {error && (
          <div className={`bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-4 ${isMobile ? 'mt-16' : ''}`}>
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
        )}

        {/* Sidebar */}
        <div className={`sidebar ${sidebarWidth} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${isMobile ? 'fixed' : 'fixed'} left-0 ${isMobile ? 'top-16' : 'top-0'} ${isMobile ? 'h-[calc(100vh-4rem)]' : 'h-full'} z-40 transition-all duration-300 ease-in-out shadow-lg transform ${sidebarPosition}`}>
          {/* Desktop Header */}
          {!isMobile && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tech Docs</h1>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!sidebarCollapsed && (
                    <>
                      <div className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full ${dbConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                        <Database className="w-3 h-3" />
                        {dbConnected ? 'Connected' : 'Not Connected'}
                      </div>
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                      >
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {!sidebarCollapsed && (
                <>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search documentation..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    className="w-full mb-4 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleCreateDoc}
                    disabled={!dbConnected || loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white p-3 rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    New Document
                  </button>
                </>
              )}

              {sidebarCollapsed && (
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 flex justify-center"
                    title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleCreateDoc}
                    disabled={!dbConnected || loading}
                    className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title="New Document"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Header */}
          {isMobile && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="w-full mb-4 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>

              <button
                onClick={handleCreateDoc}
                disabled={!dbConnected || loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white p-3 rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                New Document
              </button>
            </div>
          )}

          {/* Document List */}
          <div className="flex-1 overflow-y-auto">
            {loading && docs.length === 0 ? (
              <div className="p-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading documents...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {docs.length === 0 ? 'No documents yet' : 'No documents match your search'}
                </p>
              </div>
            ) : (
              filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  className={`mx-2 mb-2 p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedDoc?.id === doc.id 
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-700 shadow-lg' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent'
                  }`}
                  onClick={() => handleDocSelect(doc)}
                  title={(!isMobile && sidebarCollapsed) ? doc.title : ''}
                >
                  {(!isMobile && sidebarCollapsed) ? (
                    <div className="flex justify-center">
                      <File className={`w-5 h-5 ${doc.format === 'word' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 text-sm md:text-base">{doc.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${doc.format === 'word' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                            {doc.format === 'word' ? 'Word' : 'MD'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {doc.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {doc.updatedAt.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.slice(0, isMobile ? 2 : 3).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
                              {tag}
                            </span>
                          ))}
                          {doc.tags.length > (isMobile ? 2 : 3) && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
                              +{doc.tags.length - (isMobile ? 2 : 3)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={`${mainMargin} transition-all duration-300 ease-in-out ${isMobile ? 'pt-16' : ''}`}>
          <div className="flex flex-col h-screen">
            {selectedDoc ? (
              <>
                {/* Document Header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 md:p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">{selectedDoc.title}</h1>
                      <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          {selectedDoc.category}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Updated {selectedDoc.updatedAt.toLocaleDateString()}
                        </span>
                        <span className={`px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-medium ${selectedDoc.format === 'word' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                          {selectedDoc.format === 'word' ? 'Word Format' : 'Markdown'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3 md:mt-4">
                        {selectedDoc.tags.map(tag => (
                          <span key={tag} className="px-2 md:px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs md:text-sm font-medium border border-blue-200 dark:border-blue-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 self-end lg:self-auto">
                      <button
                        onClick={handleExportToWord}
                        className="p-2 md:p-3 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 border border-gray-200 dark:border-gray-600"
                        title="Export to Word (HTML)"
                      >
                        <Download className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={() => handleEditDoc(selectedDoc)}
                        disabled={loading}
                        className="p-2 md:p-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-600"
                        title="Edit document"
                      >
                        {loading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Edit className="w-4 h-4 md:w-5 md:h-5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(selectedDoc.id)}
                        disabled={loading}
                        className="p-2 md:p-3 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-600"
                        title="Delete document"
                      >
                        {loading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Trash2 className="w-4 h-4 md:w-5 md:h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Document Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                  <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 md:p-10">
                    {renderContent(selectedDoc)}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
                <div className="text-center">
                  <FileText className="w-16 md:w-20 h-16 md:h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4 md:mb-6" />
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-500 dark:text-gray-400 mb-2 md:mb-3">No document selected</h2>
                  <p className="text-gray-400 dark:text-gray-500 text-base md:text-lg">Choose a document from the {isMobile ? 'menu' : 'sidebar'} to view its content</p>
                  {!dbConnected && (
                    <div className="mt-4 md:mt-6 p-4 md:p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm md:text-base">
                        Please configure your Supabase credentials to start using the app.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(showCreateForm || isEditing) && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-2 md:p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl w-full max-w-7xl max-h-[95vh] md:max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-t-xl md:rounded-t-2xl">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? 'Edit Document' : 'Create New Document'}
                </h2>
                <div className="flex items-center gap-2 md:gap-4">
                  {/* Format Toggle */}
                  <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => handleFormatToggle('markdown')}
                      className={`px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm rounded-md transition-all duration-200 font-medium ${
                        editForm.format === 'markdown'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Markdown
                    </button>
                    <button
                      onClick={() => handleFormatToggle('word')}
                      className={`px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm rounded-md transition-all duration-200 font-medium ${
                        editForm.format === 'word'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Word Format
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setIsEditing(false);
                      setShowWordTools(false);
                    }}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                  >
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
              </div>

              {/* Word Formatting Toolbar */}
              {showWordTools && (
                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center gap-1 flex-wrap">
                    <div className="flex items-center gap-1 mr-2 md:mr-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileImport}
                        accept=".txt,.html,.doc,.docx"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1 md:p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                        title="Import file"
                      >
                        <Upload className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                    
                    <div className="h-4 md:h-6 w-px bg-gray-300 dark:bg-gray-600 mr-2 md:mr-4"></div>
                    
                    <button
                      onClick={() => handleWordFormatting('bold')}
                      className="p-1 md:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                      title="Bold"
                    >
                      <Bold className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => handleWordFormatting('italic')}
                      className="p-1 md:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                      title="Italic"
                    >
                      <Italic className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => handleWordFormatting('underline')}
                      className="p-1 md:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                      title="Underline"
                    >
                      <Underline className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    
                    <div className="h-4 md:h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1 md:mx-2"></div>
                    
                    <button
                      onClick={() => handleWordFormatting('justifyLeft')}
                      className="p-1 md:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                      title="Align left"
                    >
                      <AlignLeft className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => handleWordFormatting('justifyCenter')}
                      className="p-1 md:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                      title="Align center"
                    >
                      <AlignCenter className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => handleWordFormatting('justifyRight')}
                      className="p-1 md:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                      title="Align right"
                    >
                      <AlignRight className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    
                    <div className="h-4 md:h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1 md:mx-2"></div>
                    
                    <button
                      onClick={() => handleWordFormatting('insertUnorderedList')}
                      className="p-1 md:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                      title="Bullet list"
                    >
                      <List className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => handleWordFormatting('insertOrderedList')}
                      className="p-1 md:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                      title="Numbered list"
                    >
                      <ListOrdered className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    
                    <div className="h-4 md:h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1 md:mx-2"></div>
                    
                    <select
                      onChange={(e) => handleWordFormatting('formatBlock', e.target.value)}
                      className="px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg transition-all duration-200"
                      defaultValue=""
                    >
                      <option value="">Normal</option>
                      <option value="h1">Heading 1</option>
                      <option value="h2">Heading 2</option>
                      <option value="h3">Heading 3</option>
                      <option value="p">Paragraph</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Form Section */}
                <div className={`${isMobile ? 'w-full' : 'w-full lg:w-1/2'} p-4 md:p-6 ${!isMobile ? 'border-r border-gray-200 dark:border-gray-700' : 'border-b border-gray-200 dark:border-gray-700 lg:border-b-0 lg:border-r'} overflow-y-auto max-h-96 lg:max-h-none`}>
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title</label>
                      <input
                        type="text"
                        className="w-full p-3 md:p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        value={editForm.title}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        placeholder="Enter document title..."
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                        <input
                          type="text"
                          className="w-full p-3 md:p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={editForm.category}
                          onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                          placeholder="e.g., React, Backend, Database"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags (comma-separated)</label>
                        <input
                          type="text"
                          className="w-full p-3 md:p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={Array.isArray(editForm.tags) ? editForm.tags.join(', ') : editForm.tags}
                          onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                          placeholder="e.g., hooks, best-practices, frontend"
                        />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Content ({editForm.format === 'word' ? 'Rich Text Editor' : 'Markdown supported'})
                      </label>
                      <div className="flex-1 min-h-0">
                        {editForm.format === 'word' ? (
                          <div
                            ref={contentRef}
                            contentEditable
                            className="w-full h-full min-h-[200px] md:min-h-[400px] lg:min-h-[500px] p-3 md:p-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 overflow-y-auto resize-none"
                            dangerouslySetInnerHTML={{ __html: editForm.content }}
                            onInput={(e) => setEditForm({...editForm, content: e.target.innerHTML})}
                          />
                        ) : (
                          <textarea
                            className="w-full h-full min-h-[200px] md:min-h-[400px] lg:min-h-[500px] p-3 md:p-4 bg-gray-900 dark:bg-gray-800 border-2 border-gray-700 dark:border-gray-600 text-green-400 dark:text-green-400 placeholder-gray-500 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 font-mono text-xs md:text-sm transition-all duration-200 resize-none"
                            value={editForm.content}
                            onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                            placeholder={`# Your Document Title

## Section 1
Your content here...

## Code Example
\`\`\`javascript
import pandas as pd
const example = 'code';
console.log('Hello World');
\`\`\`

## Another Section
- Bullet point 1
- Bullet point 2

**Bold text** and regular text.`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Section - Hidden on mobile, shown on larger screens */}
                <div className={`${isMobile ? 'hidden' : 'w-full lg:w-1/2'} p-4 md:p-6 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800`}>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Live Preview</h3>
                    <div className="h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700"></div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-8 min-h-[300px] md:min-h-[500px] shadow-lg">
                    {editForm.content ? (
                      <div className="prose prose-sm md:prose-lg dark:prose-invert max-w-none">
                        {editForm.format === 'word' ? (
                          <div dangerouslySetInnerHTML={{ __html: editForm.content }} />
                        ) : (
                          renderMarkdown(editForm.content)
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                        <div className="text-center">
                          <FileText className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-base md:text-lg">Start typing to see preview...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3 md:gap-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-b-xl md:rounded-b-2xl">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setIsEditing(false);
                    setShowWordTools(false);
                  }}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDoc}
                  disabled={!editForm.title || !editForm.content || loading}
                  className="w-full sm:w-auto px-6 md:px-8 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 md:w-5 md:h-5" />}
                  {isEditing ? 'Update' : 'Create'} Document
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechDocsApp;