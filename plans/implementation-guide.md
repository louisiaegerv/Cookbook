# Cookbook App - Implementation Guide

## Phase 1: Project Setup & Infrastructure

### 1.1 Initialize Next.js Project

```bash
npx create-next-app@latest cookbook --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd cookbook
```

### 1.2 Install Dependencies

```bash
# Core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react
npm install clsx tailwind-merge

# UI components (shadcn/ui)
npx shadcn@latest init
npx shadcn@latest add button card input label textarea select
npx shadcn@latest add dialog dropdown-menu badge avatar
npx shadcn@latest add tabs scroll-area separator
npx shadcn@latest add form checkbox

# Additional utilities
npm install date-fns
npm install react-dropzone
```

### 1.3 Create Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Wait for database initialization (~2 minutes)
4. Copy project URL and anon key to `.env.local`

### 1.4 Configure Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Phase 2: Database Setup

### 2.1 Run Migration Script

Create `supabase/migrations/001_initial_schema.sql` with all table definitions and RLS policies from architecture.md

Apply migrations:

```bash
# Using Supabase CLI (recommended)
npx supabase db push

# Or via Supabase Dashboard SQL Editor
# Copy and execute the SQL from the migration file
```

### 2.2 Create Storage Bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true);
```

### 2.3 Set Up Storage RLS Policies

Execute the storage RLS policies from architecture.md

## Phase 3: Core Infrastructure

### 3.1 Supabase Client Setup

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
```

### 3.2 TypeScript Types

Create `lib/types/recipe.ts`:

```typescript
export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string;
  cooking_time: number | null;
  created_at: string;
  updated_at: string;
  images?: RecipeImage[];
  tags?: Tag[];
  category?: Category;
  collections?: Collection[];
}

export interface RecipeImage {
  id: string;
  recipe_id: string;
  image_url: string;
  storage_path: string;
  display_order: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}
```

### 3.3 Validation Schemas

Create `lib/utils/validation.ts`:

```typescript
import { z } from "zod";

export const recipeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  ingredients: z
    .array(z.string().min(1))
    .min(1, "At least one ingredient is required"),
  instructions: z.string().min(1, "Instructions are required"),
  cooking_time: z.number().min(0).optional(),
  category_id: z.string().uuid().optional(),
  collection_ids: z.array(z.string().uuid()).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
});

export const collectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

export const tagSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
});
```

## Phase 4: Authentication

### 4.1 Create Auth Layout

`app/(auth)/layout.tsx`

### 4.2 Build Login Page

`app/(auth)/login/page.tsx` with Supabase auth

### 4.3 Build Signup Page

`app/(auth)/signup/page.tsx` with Supabase auth

### 4.4 Create Auth Middleware

`middleware.ts` for route protection

## Phase 5: Dashboard Layout

### 5.1 Create Dashboard Layout

`app/(dashboard)/layout.tsx` with:

- Header with user menu
- Sidebar with navigation
- Responsive design

### 5.2 Build Navigation Components

- `components/layout/Header.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/Navigation.tsx`

## Phase 6: Recipe Features

### 6.1 Recipe List Page

`app/(dashboard)/recipes/page.tsx`:

- Search bar
- Filter panel (tags, categories, collections)
- Sort dropdown
- Recipe cards grid
- Pagination

### 6.2 Recipe Card Component

`components/recipes/RecipeCard.tsx`:

- Display recipe image, title, description
- Show tags and category
- Quick actions (edit, delete)

### 6.3 Recipe Form

`components/recipes/RecipeForm.tsx`:

- Title input
- Description textarea
- Dynamic ingredient list (add/remove)
- Instructions textarea
- Cooking time input
- Category selector
- Collection multi-select
- Tag multi-select
- Image uploader

### 6.4 Image Uploader

`components/recipes/ImageUploader.tsx`:

- Drag and drop zone
- File preview
- Upload progress
- Remove image option

### 6.5 Recipe Detail Page

`app/(dashboard)/recipes/[id]/page.tsx`:

- Full recipe information
- Image gallery
- Ingredients list
- Instructions
- Tags and category display
- Collections
- Edit/Delete actions

### 6.6 Create Recipe Page

`app/(dashboard)/recipes/new/page.tsx`:

- Recipe form for new recipes
- Redirect to detail page on success

## Phase 7: Categories, Collections, Tags

### 7.1 Categories Page

`app/(dashboard)/categories/page.tsx`:

- List of categories
- Create/edit/delete categories
- Color picker for categories

### 7.2 Collections Page

`app/(dashboard)/collections/page.tsx`:

- List of collections
- Create/edit/delete collections
- View recipes in collection

### 7.3 Tags Page

`app/(dashboard)/tags/page.tsx`:

- List of tags
- Create/edit/delete tags
- Color picker for tags

## Phase 8: Search & Filter

### 8.1 Search Bar

`components/filters/SearchBar.tsx`:

- Search input
- Debounced search
- Clear search button

### 8.2 Filter Panel

`components/filters/FilterPanel.tsx`:

- Tag filter (multi-select)
- Category filter (dropdown)
- Collection filter (dropdown)
- Active filters display

### 8.3 Sort Dropdown

`components/filters/SortDropdown.tsx`:

- Sort by: Date Added, Alphabetical
- Sort direction: Ascending, Descending

## Phase 9: User Profile

### 9.1 Profile Page

`app/(dashboard)/profile/page.tsx`:

- User information display
- Edit profile form
- Avatar upload
- Account settings

## Phase 10: Responsive Design

### 10.1 Mobile Optimization

- Responsive navigation (hamburger menu)
- Touch-friendly components
- Optimized image sizes
- Mobile-first approach

### 10.2 Tablet & Desktop

- Grid layouts for recipe cards
- Sidebar navigation
- Hover states and transitions

## Phase 11: Testing

### 11.1 Manual Testing Checklist

- [ ] User signup and login
- [ ] Create recipe with images
- [ ] Edit recipe
- [ ] Delete recipe
- [ ] Search recipes by title
- [ ] Search recipes by ingredients
- [ ] Filter by tags
- [ ] Filter by categories
- [ ] Filter by collections
- [ ] Sort recipes
- [ ] Create/edit/delete categories
- [ ] Create/edit/delete collections
- [ ] Create/edit/delete tags
- [ ] Add recipe to collections
- [ ] Add tags to recipes
- [ ] Profile management
- [ ] Image upload and display
- [ ] Responsive design (mobile, tablet, desktop)

## Phase 12: Deployment

### 12.1 Build for Production

```bash
npm run build
```

### 12.2 Deploy Options

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- Self-hosted with Docker

### 12.3 Environment Variables

Set production environment variables in your hosting platform

### 12.4 Post-Deployment

- Test all features in production
- Set up custom domain
- Configure SSL
- Set up monitoring and analytics

## Development Workflow

### Feature Development

1. Create feature branch
2. Implement feature
3. Test locally
4. Create pull request
5. Code review
6. Merge to main

### Database Migrations

```bash
# Create new migration
npx supabase migration new feature_name

# Apply migration
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --linked > lib/types/database.ts
```

### Useful Commands

```bash
# Start development server
npm run dev

# Run linter
npm run lint

# Run tests (when added)
npm test

# Build production bundle
npm run build

# Start production server
npm start
```

## Troubleshooting

### Common Issues

**Supabase Connection Issues**

- Verify environment variables are set correctly
- Check Supabase project status
- Ensure RLS policies are properly configured

**Image Upload Fails**

- Check storage bucket permissions
- Verify file size limits (default 50MB)
- Ensure storage RLS policies are set

**Search Not Working**

- Verify GIN indexes are created
- Check full-text search configuration
- Ensure search query is properly formatted

**Authentication Issues**

- Verify auth configuration
- Check cookie settings in middleware
- Ensure user is created in profiles table

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zod Validation](https://zod.dev)
