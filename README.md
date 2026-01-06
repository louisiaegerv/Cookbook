# Cookbook App

A modern Next.js web application with Supabase integration for tracking and organizing your favorite recipes with images, tags, categories, and collections.

## Features

- **User Authentication** - Secure signup and login with Supabase Auth
- **Recipe Management** - Create, edit, and delete recipes with rich details
- **Image Upload** - Add unlimited images to each recipe
- **Smart Organization** - Organize with tags, categories, and custom collections
- **Search & Filter** - Search by title/ingredients, filter by tags/categories
- **Sorting** - Sort recipes by date added or alphabetically
- **Responsive Design** - Beautiful UI that works on all devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Forms**: React Hook Form, Zod validation
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier is sufficient)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to initialize (~2 minutes)
3. Go to **Project Settings** → **API**
4. Copy the following values:
   - Project URL
   - anon public key
   - service_role secret (click "show" to reveal)

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set Up Database Schema

Go to your Supabase project:

1. Click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the SQL from `plans/database-schema.md`
4. Paste and click **Run**

This will create:

- 8 database tables (profiles, recipes, recipe_images, categories, collections, recipe_collections, tags, recipe_tags)
- Row Level Security (RLS) policies
- Storage bucket for recipe images
- Indexes for performance
- Helper functions for search

### 5. Create Storage Bucket

In Supabase Dashboard:

1. Go to **Storage** in the left sidebar
2. Click "New bucket"
3. Name it: `recipe-images`
4. Make it **Public**
5. Click "Create bucket"

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

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
├── plans/                # Architecture and planning docs
└── public/               # Static assets
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Development Workflow

### Adding New Features

1. Create feature branch
2. Implement feature
3. Test locally
4. Create pull request
5. Code review
6. Merge to main

### Database Migrations

When making database changes:

```bash
# Create new migration
npx supabase migration new feature_name

# Apply migration
npx supabase db push
```

## Troubleshooting

### Supabase Connection Issues

- Verify environment variables are set correctly
- Check Supabase project status
- Ensure RLS policies are properly configured

### Images Won't Upload

- Check that the `recipe-images` storage bucket exists
- Verify storage RLS policies are set
- Check file size limits (default 50MB)

### Search Not Working

- Verify GIN indexes are created
- Check full-text search configuration
- Ensure search query is properly formatted

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy

### Other Platforms

The app can be deployed to:

- Netlify
- Railway
- Self-hosted with Docker

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:

- Check the [documentation](./plans/)
- Review [Supabase docs](https://supabase.com/docs)
- Review [Next.js docs](https://nextjs.org/docs)

## Roadmap

Future enhancements:

- Recipe sharing with other users
- Import recipes from URLs
- Export to PDF
- Meal planning
- Shopping lists
- Nutritional information
- Ratings and reviews
- Real-time collaboration
