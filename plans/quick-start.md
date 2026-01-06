# Cookbook App - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier is sufficient)
- Git (optional, for version control)

## Step-by-Step Setup

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up or log in
4. Click "New Project"
5. Fill in:
   - **Name**: `cookbook`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait 2-3 minutes for database initialization

### 2. Get Supabase Credentials

Once your project is ready:

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJxxxxx...`
   - **service_role secret**: `eyJxxxxx...` (click "show" to reveal)

### 3. Initialize Next.js Project

Open your terminal and run:

```bash
npx create-next-app@latest cookbook --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd cookbook
```

### 4. Install Dependencies

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Form handling & validation
npm install react-hook-form @hookform/resolvers zod

# UI components
npm install lucide-react clsx tailwind-merge

# Additional utilities
npm install date-fns react-dropzone
```

### 5. Set Up shadcn/ui

```bash
npx shadcn@latest init
```

When prompted:

- Which style would you like to use? **Default**
- Which color would you like to use? **Slate**
- Do you want to use CSS variables for colors? **Yes**

Install required components:

```bash
npx shadcn@latest add button card input label textarea select
npx shadcn@latest add dialog dropdown-menu badge avatar
npx shadcn@latest add tabs scroll-area separator
npx shadcn@latest add form checkbox
```

### 6. Configure Environment Variables

Create `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. Set Up Database Schema

**Option A: Using Supabase Dashboard (Easier)**

1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Click "New Query"
4. Copy the SQL from `plans/database-schema.sql` (to be created)
5. Paste and click "Run"

**Option B: Using Supabase CLI (Recommended for development)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push the schema
npx supabase db push
```

### 8. Create Storage Bucket

In Supabase Dashboard:

1. Go to **Storage** in the left sidebar
2. Click "New bucket"
3. Name it: `recipe-images`
4. Make it **Public**
5. Click "Create bucket"

### 9. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Project Structure Overview

```
cookbook/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main app pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Auth components
│   ├── recipes/          # Recipe components
│   └── layout/           # Layout components
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase clients
│   ├── types/            # TypeScript types
│   └── utils/            # Helper functions
└── public/               # Static assets
```

## What's Next?

After setup, you'll need to implement the features in this order:

1. **Authentication** - Login/Signup pages
2. **Database Integration** - Connect to Supabase
3. **Recipe CRUD** - Create, Read, Update, Delete recipes
4. **Image Upload** - Upload and display recipe images
5. **Search & Filter** - Implement search and filtering
6. **Categories & Collections** - Organization features
7. **Tags** - Tagging system
8. **User Profile** - Profile management

## Common Issues & Solutions

### Issue: Supabase connection fails

**Solution**: Check that your `.env.local` file has the correct values and restart the dev server.

### Issue: Images won't upload

**Solution**: Ensure the `recipe-images` storage bucket exists and has proper RLS policies.

### Issue: Can't see recipes after creating

**Solution**: Check that RLS policies are properly set up and you're logged in.

### Issue: TypeScript errors

**Solution**: Run `npm run build` to see detailed error messages and fix type issues.

## Development Tips

1. **Use TypeScript**: Always use TypeScript for type safety
2. **Test as you go**: Test each feature before moving to the next
3. **Use the Supabase Dashboard**: Monitor your database in real-time
4. **Keep components small**: Break down large components into smaller ones
5. **Use environment variables**: Never hardcode sensitive data

## Getting Help

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **shadcn/ui Docs**: https://ui.shadcn.com
- **Tailwind CSS Docs**: https://tailwindcss.com/docs

## Next Steps

Switch to **Code mode** to start implementing the features following the implementation guide in `plans/implementation-guide.md`.
