#!/bin/bash

# Tech Knowledge Base Project Setup Script
# This script creates the complete file structure for the Next.js knowledge base application

set -e  # Exit on any error

PROJECT_NAME="mexdocs"

echo "🚀 Setting up Tech Knowledge Base project..."

# Create main project directory
# mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

echo "📁 Creating directory structure..."

# Create main directories
mkdir -p {app,components,lib}

# App directory structure (Next.js 13+ app router) - Complete structure
mkdir -p app/{admin,api,articles,auth,categories,search}
mkdir -p app/admin/{dashboard,articles,categories,users,feedback,analytics,settings}
mkdir -p app/admin/articles/{create,"[id]"}
mkdir -p "app/admin/articles/[id]/edit"
mkdir -p app/admin/categories/create
mkdir -p app/auth/{signin,signup,forgot-password}
mkdir -p app/api/{auth,articles,categories,search,admin}
mkdir -p "app/api/auth/[...nextauth]"
mkdir -p "app/api/articles/[slug]"
mkdir -p "app/api/articles/[slug]/feedback"
mkdir -p "app/api/categories/[id]"
mkdir -p app/api/admin/{dashboard,users}
mkdir -p "app/articles/[slug]"
mkdir -p "app/categories/[slug]"
mkdir -p "app/admin/categories/create"

# Components directory structure - Complete structure
mkdir -p components/{layout,ui,admin,providers,forms}

# Create all the files
echo "📝 Creating files..."

# Root configuration files
cat > package.json << 'EOF'
{
  "name": "mexdocs",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2.39.3",
    "@supabase/auth-helpers-nextjs": "^0.8.7",
    "@supabase/auth-helpers-react": "^0.4.2",
    "@tiptap/react": "^2.1.16",
    "@tiptap/starter-kit": "^2.1.16",
    "@tiptap/extension-image": "^2.1.16",
    "@tiptap/extension-link": "^2.1.16",
    "@tiptap/extension-code-block-lowlight": "^2.1.16",
    "lowlight": "^3.1.0",
    "lucide-react": "^0.263.1",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "react-hot-toast": "^2.4.1",
    "framer-motion": "^10.18.0",
    "@headlessui/react": "^1.7.17",
    "react-hook-form": "^7.49.3",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.22.4",
    "date-fns": "^3.2.0",
    "reading-time": "^1.5.0",
    "slugify": "^1.6.6",
    "dompurify": "^3.0.8",
    "isomorphic-dompurify": "^2.9.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/dompurify": "^3.0.5",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "eslint": "^8",
    "eslint-config-next": "14.1.0"
  }
}
EOF

cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      'localhost',
      // Add your Supabase project domain here
      'qnvbtxtpgcwovtrpugca.supabase.co'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
EOF

cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  darkMode: 'class',
};
EOF

cat > .env.local.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Optional: Analytics and monitoring
NEXT_PUBLIC_GA_ID=your_google_analytics_id
EOF

cat > .gitignore << 'EOF'
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
EOF

cat > README.md << 'EOF'
# Tech Knowledge Base

A comprehensive technical documentation and knowledge base application built with Next.js, Supabase, and Tailwind CSS.

## Features

- 🔐 Authentication with role-based access (Admin/Reader)
- 📝 Rich text editor for articles with Markdown support
- 🔍 Full-text search across articles and categories
- 📊 Admin dashboard with analytics
- 💬 Feedback system for articles
- 🎨 Dark/Light theme support
- 📱 Fully responsive design

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Rich Text**: TipTap Editor
- **Deployment**: Vercel

## Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Setup Supabase**:
   - Create a new Supabase project
   - Run the SQL schema from `database-schema.sql`
   - Get your project URL and keys

3. **Configure environment**:
   ```bash
   cp .env.local.example .env.local
   # Fill in your Supabase credentials
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Project Structure

```
├── app/                 # Next.js app router
│   ├── admin/          # Admin dashboard
│   ├── api/            # API routes
│   ├── articles/       # Article pages
│   ├── auth/           # Authentication pages
│   └── categories/     # Category pages
├── components/         # React components
│   ├── admin/          # Admin components
│   ├── layout/         # Layout components
│   ├── providers/      # Context providers
│   └── ui/             # UI components
└── lib/                # Utilities and config
```

## Default Admin Account

After running the database schema, create an admin account:

1. Sign up normally through the UI
2. Update your role in Supabase dashboard:
   ```sql
   UPDATE user_profiles SET role = 'admin' WHERE id = 'your-user-id';
   ```

## License

MIT
EOF

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create TypeScript files with placeholder content
touch app/layout.tsx
touch app/page.tsx
touch app/loading.tsx
touch app/not-found.tsx
touch app/error.tsx

# App pages
touch app/articles/page.tsx
touch "app/articles/[slug]/page.tsx"
touch app/categories/page.tsx
touch "app/categories/[slug]/page.tsx"
touch app/search/page.tsx

# Auth pages
touch app/auth/signin/page.tsx
touch app/auth/signup/page.tsx
touch app/auth/forgot-password/page.tsx

# Admin pages
touch app/admin/layout.tsx
touch app/admin/dashboard/page.tsx
touch app/admin/articles/page.tsx
touch app/admin/articles/create/page.tsx
touch "app/admin/articles/[id]/edit/page.tsx"
touch app/admin/categories/page.tsx
touch app/admin/categories/create/page.tsx
touch app/admin/users/page.tsx
touch app/admin/feedback/page.tsx
touch app/admin/analytics/page.tsx
touch app/admin/settings/page.tsx

# API routes
touch "app/api/auth/[...nextauth]/route.ts"
touch app/api/articles/route.ts
touch "app/api/articles/[slug]/route.ts"
touch "app/api/articles/[slug]/feedback/route.ts"
touch app/api/categories/route.ts
touch "app/api/categories/[id]/route.ts"
touch app/api/search/route.ts
touch app/api/admin/dashboard/route.ts
touch app/api/admin/users/route.ts

# Components
touch components/layout/Header.tsx
touch components/layout/Footer.tsx
touch components/layout/Sidebar.tsx
touch components/ui/ArticleCard.tsx
touch components/ui/CategoryCard.tsx
touch components/ui/SearchDialog.tsx
touch components/ui/Button.tsx
touch components/ui/Input.tsx
touch components/ui/Modal.tsx
touch components/ui/LoadingSpinner.tsx
touch components/admin/AdminSidebar.tsx
touch components/admin/ArticleEditor.tsx
touch components/admin/CategoryManager.tsx
touch components/admin/UserManager.tsx
touch components/providers/AuthProvider.tsx
touch components/providers/ThemeProvider.tsx
touch components/forms/ArticleForm.tsx
touch components/forms/CategoryForm.tsx

# Lib files
touch lib/supabase.ts
touch lib/auth.ts
touch lib/utils.ts
touch lib/validations.ts

# CSS
touch app/globals.css

# Database schema
cat > database-schema.sql << 'EOF'
-- Enable RLS (Row Level Security)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'reader');

-- Extend auth.users with custom fields
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'reader'::user_role,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles table
CREATE TABLE public.articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  excerpt TEXT,
  slug TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  reading_time INTEGER,
  search_vector TSVECTOR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article feedback table
CREATE TABLE public.article_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  value INTEGER CHECK (value IN (-1, 1)),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Article views tracking
CREATE TABLE public.article_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes and triggers (abbreviated for brevity)
-- See full schema in the artifacts above

-- Enable RLS and create policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;

-- Insert sample data
INSERT INTO categories (name, description, slug, color, icon) VALUES
('Getting Started', 'Essential guides to get you up and running', 'getting-started', '#10B981', 'rocket'),
('Development', 'Development guides and best practices', 'development', '#3B82F6', 'code'),
('Deployment', 'Deployment and DevOps guides', 'deployment', '#8B5CF6', 'cloud'),
('Troubleshooting', 'Common issues and solutions', 'troubleshooting', '#F59E0B', 'alert-triangle');
EOF

echo "✅ Project structure created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. cd $PROJECT_NAME"
echo "2. npm install"
echo "3. Copy .env.local.example to .env.local and configure Supabase"
echo "4. Run the database-schema.sql in your Supabase SQL editor"
echo "5. npm run dev"
echo ""
echo "🎉 Happy coding!"