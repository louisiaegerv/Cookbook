-- Migration: Add Missing RLS Policies for tiktok_authors Table
-- Description: Adds INSERT and UPDATE RLS policies to the tiktok_authors table
--              to allow authenticated users to create and update TikTok author records
-- Version: 002
-- Date: 2026-01-08

-- ============================================
-- Issue: tiktok_authors table missing INSERT and UPDATE policies
-- ============================================
-- The tiktok_authors table has RLS enabled but only has a SELECT policy.
-- This causes a 500 error when trying to create or update TikTok authors.
-- This migration adds the missing INSERT and UPDATE policies.

-- ============================================
-- Add INSERT policy for tiktok_authors
-- ============================================

-- Allow authenticated users to insert tiktok_authors
CREATE POLICY "Authenticated users can insert tiktok_authors"
  ON tiktok_authors FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- Add UPDATE policy for tiktok_authors
-- ============================================

-- Allow authenticated users to update tiktok_authors
CREATE POLICY "Authenticated users can update tiktok_authors"
  ON tiktok_authors FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- The tiktok_authors table now has the following RLS policies:
-- 1. SELECT: Anyone can view tiktok_authors (existing policy)
-- 2. INSERT: Authenticated users can insert tiktok_authors (new)
-- 3. UPDATE: Authenticated users can update tiktok_authors (new)
-- ============================================

-- ============================================
-- Rollback Script (if needed)
-- ============================================
-- DROP POLICY IF EXISTS "Authenticated users can update tiktok_authors" ON tiktok_authors;
-- DROP POLICY IF EXISTS "Authenticated users can insert tiktok_authors" ON tiktok_authors;
