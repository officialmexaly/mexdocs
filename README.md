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
