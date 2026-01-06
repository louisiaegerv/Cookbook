# Cookbook App - Setup Guide

This guide will help you get the Cookbook app running on your local machine.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Supabase account** ([Sign up free](https://supabase.com))

## Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages including:

- Next.js 15
- React 19
- Supabase SDK
- Tailwind CSS
- shadcn/ui components
- Form handling libraries
- And more...

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up or log in
4. Click **"New Project"**
5. Fill in the form:
   - **Name**: `cookbook`
   - **Database Password**: Generate a strong password (save it securely!)
   - **Region**: Choose the region closest to your users
6. Click **"Create new project"**
7. Wait 2-3 minutes for the database to initialize

### 2.2 Get Your Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in left sidebar)
2. Click **API** in the left menu
3. Copy these values:
   - **Project URL**: Looks like `https://xxxxx.supabase.co`
   - **anon public**: Click to copy the long JWT token
   - **service_role secret**: Click "show" then copy (keep this secret!)

## Step 3: Configure Environment Variables

Create a file named `.env.local` in the project root (same folder as `package.json`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace the placeholder values with your actual Supabase credentials.

**Important**: Never commit `.env.local` to version control! It's already in `.gitignore`.

## Step 4: Set Up Database Schema

### 4.1 Run the SQL Schema

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **"New Query"**
3. Open `plans/database-schema.md` in your code editor
4. Copy the entire SQL code block
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)

This will create:

- ✅ 8 database tables
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for fast queries
- ✅ Storage bucket for images
- ✅ Helper functions for search

### 4.2 Verify Tables Were Created

Click **Table Editor** in the left sidebar. You should see:

- profiles
- recipes
- recipe_images
- categories
- collections
- recipe_collections
- tags
- recipe_tags

## Step 5: Create Storage Bucket

1. Click **Storage** in the left sidebar
2. Click **"New bucket"**
3. Fill in:
   - **Name**: `recipe-images`
   - **Public bucket**: Check this box (so images can be displayed)
4. Click **"Create bucket"**

## Step 6: Start the Development Server

Run this command in your terminal:

```bash
npm run dev
```

You should see:

```
  ▲ Next.js 15.1.6
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 7: Test the Application

### 7.1 Create an Account

1. Click **"Sign Up"** on the homepage
2. Enter your email and password
3. Click **"Create Account"**
4. Check your email for a confirmation link (if enabled)

### 7.2 Create Your First Recipe

1. After logging in, you'll see the dashboard
2. Click **"New Recipe"**
3. Fill in:
   - Title: "Chocolate Chip Cookies"
   - Description: "My favorite cookie recipe"
   - Ingredients: Add items like "2 cups flour", "1 cup sugar", etc.
   - Instructions: "Preheat oven to 350°F..."
   - Cooking time: 30 (minutes)
4. Click **"Save Recipe"**

### 7.3 Upload Images

1. On the recipe detail page, click **"Add Images"**
2. Drag and drop images or click to browse
3. Images will be uploaded to Supabase Storage
4. They'll appear in a gallery on your recipe

### 7.4 Organize with Tags and Categories

1. Go to **Tags** or **Categories** in the sidebar
2. Click **"New Tag"** or **"New Category"**
3. Give it a name and color
4. Apply tags/categories to your recipes

## Troubleshooting

### "Cannot find module 'next'" or similar TypeScript errors

**Solution**: Run `npm install` to install all dependencies. The errors will disappear once packages are installed.

### "Supabase connection failed"

**Solution**:

1. Check that `.env.local` exists in the project root
2. Verify the URL and keys are correct
3. Make sure you copied the entire keys (no extra spaces)

### "Images won't upload"

**Solution**:

1. Verify the `recipe-images` bucket exists in Supabase Storage
2. Check that the bucket is public
3. Ensure storage RLS policies are set (from the SQL schema)

### "Can't see recipes after creating"

**Solution**:

1. Check that RLS policies are properly set
2. Verify you're logged in with the same account
3. Check the browser console for errors (F12)

### "Search doesn't work"

**Solution**:

1. Verify the GIN indexes were created (check SQL Editor history)
2. Ensure the search query is formatted correctly
3. Try refreshing the page

## Next Steps

Once everything is working:

1. **Explore the Features**:

   - Create multiple recipes
   - Try the search and filters
   - Organize with tags and collections
   - Upload images to recipes

2. **Customize the App**:

   - Modify colors in `src/app/globals.css`
   - Add new components in `src/components/`
   - Extend the database schema as needed

3. **Deploy to Production**:
   - Push code to GitHub
   - Deploy to Vercel, Netlify, or Railway
   - Update environment variables in production

## Development Tips

### Hot Reload

The development server automatically reloads when you save files. You don't need to restart it.

### Database Changes

When modifying the database:

1. Create a new SQL query in Supabase Dashboard
2. Test it thoroughly
3. Document changes in `plans/database-schema.md`

### Debugging

- Use `console.log()` in components to debug
- Check the Network tab in browser DevTools
- Monitor Supabase logs in the Dashboard

### Performance

- Images are automatically optimized by Supabase
- Use the built-in Next.js Image component for best performance
- The database indexes ensure fast queries

## Getting Help

If you run into issues:

1. **Check the logs**: Look at the terminal output and browser console
2. **Review the documentation**:
   - [Next.js Docs](https://nextjs.org/docs)
   - [Supabase Docs](https://supabase.com/docs)
   - [Tailwind CSS Docs](https://tailwindcss.com/docs)
3. **Check the planning docs** in the `plans/` folder

## Security Notes

- Never share your `SUPABASE_SERVICE_ROLE_KEY`
- Always use environment variables for sensitive data
- Enable email confirmation in Supabase Auth settings
- Consider enabling 2FA for your Supabase account

## What's Next?

After setup, you can:

- ✅ Create and manage recipes
- ✅ Upload unlimited images
- ✅ Organize with tags, categories, and collections
- ✅ Search and filter recipes
- ✅ Sort by date or alphabetically

Happy cooking! 🍳
