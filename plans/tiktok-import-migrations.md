# TikTok Recipe Import - SQL Migration Scripts

## Migration Overview

This document contains the complete SQL migration scripts to add TikTok recipe import support to the cookbook app.

## Migration Script

```sql
-- Migration: Add TikTok Recipe Import Support
-- Description: Adds tables and columns to support importing recipes from TikTok videos
-- Version: 001
-- Date: 2026-01-07

-- ============================================
-- PHASE 1: Add Source Tracking
-- ============================================

-- Create recipe_sources table to track different import sources
CREATE TABLE IF NOT EXISTS recipe_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL UNIQUE, -- 'manual', 'tiktok', 'instagram', 'youtube', etc.
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default source entries
INSERT INTO recipe_sources (source_type, name, description)
VALUES
  ('manual', 'Manual Entry', 'Recipes created manually by the user'),
  ('tiktok', 'TikTok', 'Recipes imported from TikTok videos')
ON CONFLICT (source_type) DO NOTHING;

-- Add source_id column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES recipe_sources(id) ON DELETE SET NULL;

-- Set default source to 'manual' for existing recipes
UPDATE recipes
SET source_id = (SELECT id FROM recipe_sources WHERE source_type = 'manual')
WHERE source_id IS NULL;

-- Create index for source_id on recipes
CREATE INDEX IF NOT EXISTS idx_recipes_source_id ON recipes(source_id);

-- Create index for recipe_sources
CREATE INDEX IF NOT EXISTS idx_recipe_sources_source_type ON recipe_sources(source_type);

-- ============================================
-- PHASE 2: Add TikTok-Specific Tables
-- ============================================

-- Create tiktok_authors table to store TikTok author information
CREATE TABLE IF NOT EXISTS tiktok_authors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unique_id TEXT NOT NULL UNIQUE, -- TikTok username (@username)
  nickname TEXT, -- Display name
  avatar_thumb TEXT, -- Profile picture URL
  verified BOOLEAN DEFAULT FALSE,
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tiktok_video_metadata table to store TikTok-specific video data
CREATE TABLE IF NOT EXISTS tiktok_video_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  source_id UUID REFERENCES recipe_sources(id) ON DELETE SET NULL NOT NULL,
  author_id UUID REFERENCES tiktok_authors(id) ON DELETE SET NULL,
  video_id TEXT NOT NULL UNIQUE, -- TikTok video ID
  video_url TEXT NOT NULL, -- Full TikTok video URL
  cover_image_url TEXT, -- Static cover image URL
  dynamic_cover_url TEXT, -- Animated cover image URL
  music_title TEXT, -- Background music title
  music_author TEXT, -- Background music author
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  video_duration INTEGER, -- Duration in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT tiktok_video_metadata_unique_recipe UNIQUE(recipe_id)
);

-- Create indexes for tiktok_authors
CREATE INDEX IF NOT EXISTS idx_tiktok_authors_unique_id ON tiktok_authors(unique_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_authors_nickname ON tiktok_authors(nickname);

-- Create indexes for tiktok_video_metadata
CREATE INDEX IF NOT EXISTS idx_tiktok_video_metadata_recipe_id ON tiktok_video_metadata(recipe_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_video_metadata_source_id ON tiktok_video_metadata(source_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_video_metadata_author_id ON tiktok_video_metadata(author_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_video_metadata_video_id ON tiktok_video_metadata(video_id);

-- ============================================
-- PHASE 3: Update Tags System
-- ============================================

-- Add source_suggested column to tags table
ALTER TABLE tags ADD COLUMN IF NOT EXISTS source_suggested BOOLEAN DEFAULT FALSE;

-- Add source_id column to tags table to track which source suggested the tag
ALTER TABLE tags ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES recipe_sources(id) ON DELETE SET NULL;

-- Create index for tags source_suggested
CREATE INDEX IF NOT EXISTS idx_tags_source_suggested ON tags(source_suggested);
CREATE INDEX IF NOT EXISTS idx_tags_source_id ON tags(source_id);

-- ============================================
-- PHASE 4: Row Level Security Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE recipe_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_video_metadata ENABLE ROW LEVEL SECURITY;

-- recipe_sources RLS policies
CREATE POLICY "Anyone can view recipe_sources"
  ON recipe_sources FOR SELECT
  USING (true);

-- tiktok_authors RLS policies
CREATE POLICY "Anyone can view tiktok_authors"
  ON tiktok_authors FOR SELECT
  USING (true);

-- tiktok_video_metadata RLS policies
CREATE POLICY "Users can view tiktok_video_metadata of own recipes"
  ON tiktok_video_metadata FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = tiktok_video_metadata.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tiktok_video_metadata for own recipes"
  ON tiktok_video_metadata FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = tiktok_video_metadata.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tiktok_video_metadata of own recipes"
  ON tiktok_video_metadata FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = tiktok_video_metadata.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tiktok_video_metadata of own recipes"
  ON tiktok_video_metadata FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = tiktok_video_metadata.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- ============================================
-- PHASE 5: Triggers
-- ============================================

-- Create trigger to update updated_at on recipe_sources
CREATE TRIGGER update_recipe_sources_updated_at
  BEFORE UPDATE ON recipe_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at on tiktok_authors
CREATE TRIGGER update_tiktok_authors_updated_at
  BEFORE UPDATE ON tiktok_authors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at on tiktok_video_metadata
CREATE TRIGGER update_tiktok_video_metadata_updated_at
  BEFORE UPDATE ON tiktok_video_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PHASE 6: Helper Functions
-- ============================================

-- Function to get or create a TikTok author
CREATE OR REPLACE FUNCTION get_or_create_tiktok_author(
  p_unique_id TEXT,
  p_nickname TEXT DEFAULT NULL,
  p_avatar_thumb TEXT DEFAULT NULL,
  p_verified BOOLEAN DEFAULT FALSE,
  p_follower_count INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_author_id UUID;
BEGIN
  -- Try to find existing author
  SELECT id INTO v_author_id
  FROM tiktok_authors
  WHERE unique_id = p_unique_id;

  -- If not found, create new author
  IF v_author_id IS NULL THEN
    INSERT INTO tiktok_authors (unique_id, nickname, avatar_thumb, verified, follower_count)
    VALUES (p_unique_id, p_nickname, p_avatar_thumb, p_verified, p_follower_count)
    RETURNING id INTO v_author_id;
  ELSE
    -- Update existing author with new data
    UPDATE tiktok_authors
    SET
      nickname = COALESCE(p_nickname, nickname),
      avatar_thumb = COALESCE(p_avatar_thumb, avatar_thumb),
      verified = COALESCE(p_verified, verified),
      follower_count = COALESCE(p_follower_count, follower_count),
      updated_at = NOW()
    WHERE id = v_author_id;
  END IF;

  RETURN v_author_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a TikTok video metadata entry
CREATE OR REPLACE FUNCTION create_tiktok_video_metadata(
  p_recipe_id UUID,
  p_video_id TEXT,
  p_video_url TEXT,
  p_author_id UUID DEFAULT NULL,
  p_cover_image_url TEXT DEFAULT NULL,
  p_dynamic_cover_url TEXT DEFAULT NULL,
  p_music_title TEXT DEFAULT NULL,
  p_music_author TEXT DEFAULT NULL,
  p_play_count INTEGER DEFAULT 0,
  p_like_count INTEGER DEFAULT 0,
  p_share_count INTEGER DEFAULT 0,
  p_comment_count INTEGER DEFAULT 0,
  p_video_duration INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_source_id UUID;
  v_metadata_id UUID;
BEGIN
  -- Get TikTok source ID
  SELECT id INTO v_source_id
  FROM recipe_sources
  WHERE source_type = 'tiktok';

  -- Create video metadata entry
  INSERT INTO tiktok_video_metadata (
    recipe_id,
    source_id,
    author_id,
    video_id,
    video_url,
    cover_image_url,
    dynamic_cover_url,
    music_title,
    music_author,
    play_count,
    like_count,
    share_count,
    comment_count,
    video_duration
  )
  VALUES (
    p_recipe_id,
    v_source_id,
    p_author_id,
    p_video_id,
    p_video_url,
    p_cover_image_url,
    p_dynamic_cover_url,
    p_music_title,
    p_music_author,
    p_play_count,
    p_like_count,
    p_share_count,
    p_comment_count,
    p_video_duration
  )
  RETURNING id INTO v_metadata_id;

  RETURN v_metadata_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get recipes with TikTok metadata
CREATE OR REPLACE FUNCTION get_recipes_with_tiktok_metadata(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  recipe_id UUID,
  title TEXT,
  description TEXT,
  video_id TEXT,
  video_url TEXT,
  cover_image_url TEXT,
  author_unique_id TEXT,
  author_nickname TEXT,
  author_avatar_thumb TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    tvm.video_id,
    tvm.video_url,
    tvm.cover_image_url,
    ta.unique_id,
    ta.nickname,
    ta.avatar_thumb,
    r.created_at
  FROM recipes r
  INNER JOIN tiktok_video_metadata tvm ON r.id = tvm.recipe_id
  LEFT JOIN tiktok_authors ta ON tvm.author_id = ta.id
  WHERE r.user_id = p_user_id
  ORDER BY r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get all recipes from a specific TikTok author
CREATE OR REPLACE FUNCTION get_recipes_by_tiktok_author(
  p_user_id UUID,
  p_author_unique_id TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  recipe_id UUID,
  title TEXT,
  description TEXT,
  video_id TEXT,
  video_url TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    tvm.video_id,
    tvm.video_url,
    tvm.cover_image_url,
    r.created_at
  FROM recipes r
  INNER JOIN tiktok_video_metadata tvm ON r.id = tvm.recipe_id
  INNER JOIN tiktok_authors ta ON tvm.author_id = ta.id
  WHERE r.user_id = p_user_id
  AND ta.unique_id = p_author_unique_id
  ORDER BY r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PHASE 7: Grant Permissions
-- ============================================

-- Grant permissions on new tables
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE recipe_sources TO authenticated;
GRANT ALL ON TABLE tiktok_authors TO authenticated;
GRANT ALL ON TABLE tiktok_video_metadata TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON FUNCTION get_or_create_tiktok_author TO authenticated;
GRANT ALL ON FUNCTION create_tiktok_video_metadata TO authenticated;
GRANT ALL ON FUNCTION get_recipes_with_tiktok_metadata TO authenticated;
GRANT ALL ON FUNCTION get_recipes_by_tiktok_author TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
```

## How to Apply This Migration

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire SQL code above
5. Paste it into the editor
6. Click **Run** to execute

## What This Migration Creates

### New Tables

1. **`recipe_sources`** - Tracks different recipe import sources

   - `source_type`: Unique identifier for the source (manual, tiktok, etc.)
   - `name`: Display name for the source
   - `description`: Description of the source

2. **`tiktok_authors`** - Stores TikTok author information

   - `unique_id`: TikTok username (@username)
   - `nickname`: Display name
   - `avatar_thumb`: Profile picture URL
   - `verified`: Whether the author is verified
   - `follower_count`: Number of followers

3. **`tiktok_video_metadata`** - Stores TikTok-specific video data
   - `recipe_id`: Reference to the recipe
   - `source_id`: Reference to the source (TikTok)
   - `author_id`: Reference to the TikTok author
   - `video_id`: TikTok video ID
   - `video_url`: Full TikTok video URL
   - `cover_image_url`: Static cover image URL
   - `dynamic_cover_url`: Animated cover image URL
   - `music_title`: Background music title
   - `music_author`: Background music author
   - Engagement metrics (play_count, like_count, share_count, comment_count)
   - `video_duration`: Duration in seconds

### Modified Tables

1. **`recipes`** - Added `source_id` column
2. **`tags`** - Added `source_suggested` and `source_id` columns

### Helper Functions

1. **`get_or_create_tiktok_author()`** - Gets existing author or creates new one
2. **`create_tiktok_video_metadata()`** - Creates video metadata entry
3. **`get_recipes_with_tiktok_metadata()`** - Gets recipes with TikTok data
4. **`get_recipes_by_tiktok_author()`** - Gets recipes from specific author

## Example Usage

### Importing a TikTok Recipe

```sql
-- Step 1: Get or create the author
SELECT get_or_create_tiktok_author(
  '@chefjohn',
  'Chef John',
  'https://tiktokcdn.com/avatar.jpg',
  true,
  1500000
);

-- Step 2: Create the recipe
INSERT INTO recipes (
  user_id,
  title,
  description,
  ingredients,
  instructions,
  cooking_time,
  source_id
)
VALUES (
  'user-uuid-here',
  'Easy Pasta Recipe',
  'A delicious pasta recipe from TikTok',
  ARRAY['pasta', 'tomato sauce', 'garlic', 'basil'],
  'Cook pasta. Add sauce. Mix well.',
  20,
  (SELECT id FROM recipe_sources WHERE source_type = 'tiktok')
)
RETURNING id;

-- Step 3: Create video metadata
SELECT create_tiktok_video_metadata(
  'recipe-uuid-here',
  '7234567890123456789',
  'https://tiktok.com/@chefjohn/video/7234567890123456789',
  'author-uuid-here',
  'https://tiktokcdn.com/cover.jpg',
  'https://tiktokcdn.com/cover-dynamic.jpg',
  'Background Music',
  'Music Artist',
  1000000,
  50000,
  10000,
  5000,
  60
);

-- Step 4: Create suggested tags
INSERT INTO tags (user_id, name, color, source_suggested, source_id)
VALUES
  ('user-uuid-here', 'easy', '#10b981', true, (SELECT id FROM recipe_sources WHERE source_type = 'tiktok')),
  ('user-uuid-here', 'pasta', '#10b981', true, (SELECT id FROM recipe_sources WHERE source_type = 'tiktok'))
ON CONFLICT (user_id, name) DO NOTHING;

-- Step 5: Link tags to recipe
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT 'recipe-uuid-here', id FROM tags WHERE name IN ('easy', 'pasta')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
```

### Querying TikTok Recipes

```sql
-- Get all TikTok recipes for a user
SELECT * FROM get_recipes_with_tiktok_metadata('user-uuid-here', 20, 0);

-- Get recipes from a specific TikTok author
SELECT * FROM get_recipes_by_tiktok_author('user-uuid-here', '@chefjohn', 20, 0);
```

## Rollback Script

If you need to rollback this migration, use the following SQL:

```sql
-- Drop helper functions
DROP FUNCTION IF EXISTS get_recipes_by_tiktok_author CASCADE;
DROP FUNCTION IF EXISTS get_recipes_with_tiktok_metadata CASCADE;
DROP FUNCTION IF EXISTS create_tiktok_video_metadata CASCADE;
DROP FUNCTION IF EXISTS get_or_create_tiktok_author CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_tiktok_video_metadata_updated_at ON tiktok_video_metadata;
DROP TRIGGER IF EXISTS update_tiktok_authors_updated_at ON tiktok_authors;
DROP TRIGGER IF EXISTS update_recipe_sources_updated_at ON recipe_sources;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can delete tiktok_video_metadata of own recipes" ON tiktok_video_metadata;
DROP POLICY IF EXISTS "Users can update tiktok_video_metadata of own recipes" ON tiktok_video_metadata;
DROP POLICY IF EXISTS "Users can insert tiktok_video_metadata for own recipes" ON tiktok_video_metadata;
DROP POLICY IF EXISTS "Users can view tiktok_video_metadata of own recipes" ON tiktok_video_metadata;
DROP POLICY IF EXISTS "Anyone can view tiktok_authors" ON tiktok_authors;
DROP POLICY IF EXISTS "Anyone can view recipe_sources" ON recipe_sources;

-- Disable RLS
ALTER TABLE tiktok_video_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_authors DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_sources DISABLE ROW LEVEL SECURITY;

-- Drop indexes
DROP INDEX IF EXISTS idx_tags_source_id;
DROP INDEX IF EXISTS idx_tags_source_suggested;
DROP INDEX IF EXISTS idx_tiktok_video_metadata_video_id;
DROP INDEX IF EXISTS idx_tiktok_video_metadata_author_id;
DROP INDEX IF EXISTS idx_tiktok_video_metadata_source_id;
DROP INDEX IF EXISTS idx_tiktok_video_metadata_recipe_id;
DROP INDEX IF EXISTS idx_tiktok_authors_nickname;
DROP INDEX IF EXISTS idx_tiktok_authors_unique_id;
DROP INDEX IF EXISTS idx_recipe_sources_source_type;
DROP INDEX IF EXISTS idx_recipes_source_id;

-- Drop columns
ALTER TABLE tags DROP COLUMN IF EXISTS source_id;
ALTER TABLE tags DROP COLUMN IF EXISTS source_suggested;
ALTER TABLE recipes DROP COLUMN IF EXISTS source_id;

-- Drop tables
DROP TABLE IF EXISTS tiktok_video_metadata CASCADE;
DROP TABLE IF EXISTS tiktok_authors CASCADE;
DROP TABLE IF EXISTS recipe_sources CASCADE;
```

## Notes

- All new tables have proper RLS policies enabled
- Foreign keys ensure referential integrity
- Indexes are created for optimal query performance
- Helper functions simplify common operations
- The schema is designed to be extensible for other social media platforms
- Existing recipes are not affected by this migration
