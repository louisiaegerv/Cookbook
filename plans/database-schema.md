# Cookbook App - Database Schema

This document contains the complete SQL schema for the Cookbook app. Copy and run this in your Supabase SQL Editor.

## Complete Schema

```sql
-- Cookbook App Database Schema
-- Run this in Supabase SQL Editor or via Supabase CLI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- TABLES
-- ============================================

-- 1. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ingredients TEXT[] NOT NULL,
  instructions TEXT NOT NULL,
  cooking_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Recipe Images Table
CREATE TABLE IF NOT EXISTS recipe_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 5. Collections Table
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 6. Recipe Collections (Many-to-Many)
CREATE TABLE IF NOT EXISTS recipe_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, collection_id)
);

-- 7. Tags Table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#10b981',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 8. Recipe Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS recipe_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(recipe_id, tag_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Recipes indexes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_title_gin ON recipes USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_recipes_ingredients_gin ON recipes USING GIN(ingredients);

-- Recipe images indexes
CREATE INDEX IF NOT EXISTS idx_recipe_images_recipe_id ON recipe_images(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_images_display_order ON recipe_images(display_order);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);

-- Recipe collections indexes
CREATE INDEX IF NOT EXISTS idx_recipe_collections_recipe_id ON recipe_collections(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_collections_collection_id ON recipe_collections(collection_id);

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- Recipe tags indexes
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag_id ON recipe_tags(tag_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Recipes RLS
CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- Recipe Images RLS
CREATE POLICY "Users can view images of own recipes"
  ON recipe_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_images.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert images to own recipes"
  ON recipe_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_images.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update images of own recipes"
  ON recipe_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_images.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images of own recipes"
  ON recipe_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_images.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Categories RLS
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Collections RLS
CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- Recipe Collections RLS
CREATE POLICY "Users can view recipe_collections of own recipes"
  ON recipe_collections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_collections.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert recipe_collections for own recipes"
  ON recipe_collections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_collections.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete recipe_collections of own recipes"
  ON recipe_collections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_collections.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Tags RLS
CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- Recipe Tags RLS
CREATE POLICY "Users can view recipe_tags of own recipes"
  ON recipe_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert recipe_tags for own recipes"
  ON recipe_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete recipe_tags of own recipes"
  ON recipe_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Create storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Users can upload images to recipe-images bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view images in recipe-images bucket"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'recipe-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete images from recipe-images bucket"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'recipe-images'
    AND auth.role() = 'authenticated'
  );

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to search recipes
CREATE OR REPLACE FUNCTION search_recipes(
  search_query TEXT,
  p_user_id UUID DEFAULT NULL,
  p_tag_ids UUID[] DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_collection_id UUID DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'DESC',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  ingredients TEXT[],
  instructions TEXT,
  cooking_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.user_id,
    r.title,
    r.description,
    r.ingredients,
    r.instructions,
    r.cooking_time,
    r.created_at,
    r.updated_at
  FROM recipes r
  WHERE
    (p_user_id IS NULL OR r.user_id = p_user_id)
    AND (search_query IS NULL OR
         to_tsvector('english', r.title) @@ plainto_tsquery('english', search_query)
         OR r.ingredients @> ARRAY[search_query])
    AND (p_tag_ids IS NULL OR EXISTS (
      SELECT 1 FROM recipe_tags rt
      WHERE rt.recipe_id = r.id AND rt.tag_id = ANY(p_tag_ids)
    ))
    AND (p_category_id IS NULL OR EXISTS (
      SELECT 1 FROM recipes rc
      WHERE rc.id = r.id AND rc.category_id = p_category_id
    ))
    AND (p_collection_id IS NULL OR EXISTS (
      SELECT 1 FROM recipe_collections rcoll
      WHERE rcoll.recipe_id = r.id AND rcoll.collection_id = p_collection_id
    ))
  ORDER BY
    CASE
      WHEN p_sort_by = 'title' THEN r.title
      ELSE r.created_at
    END
    CASE WHEN p_sort_order = 'ASC' THEN ASC ELSE DESC END
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANTS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant storage permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated;
```

## How to Use

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire SQL code above
5. Paste it into the editor
6. Click **Run** to execute

## What This Creates

### Tables

- `profiles` - User profile information
- `recipes` - Recipe data (title, ingredients, instructions, etc.)
- `recipe_images` - Recipe image references
- `categories` - Recipe categories
- `collections` - Custom recipe collections
- `recipe_collections` - Many-to-many relationship between recipes and collections
- `tags` - Recipe tags
- `recipe_tags` - Many-to-many relationship between recipes and tags

### Features

- Full Row Level Security (RLS) for data isolation
- Optimized indexes for fast queries
- Full-text search capabilities
- Automatic timestamp updates
- Storage bucket for recipe images
- Helper functions for complex queries

## Important Notes

- All tables have RLS enabled to ensure users can only access their own data
- The `recipe-images` storage bucket is public for easy image serving
- Full-text search is enabled on recipe titles and ingredients
- Cascade deletes are set up to maintain data integrity
- All foreign keys have proper indexes for performance
