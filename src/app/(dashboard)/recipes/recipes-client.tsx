"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  Square,
  Plus,
  Grid,
  List,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import RecipeCard from "./recipe-card";
import RecipeListItem from "./recipe-list-item";
import BulkActionBar from "@/components/ui/bulk-action-bar";
import BulkTagManagerModal from "@/components/ui/bulk-tag-manager-modal";
import BulkCollectionManagerModal from "@/components/ui/bulk-collection-manager-modal";

interface Recipe {
  id: string;
  title: string;
  description?: string | null;
  ingredients: any[];
  cooking_time?: number;
  view_count?: number;
  recipe_images?: {
    id: string;
    image_url: string;
  }[];
  recipe_tags?: {
    tags: {
      id: string;
      name: string;
      color: string;
      user_id: string;
      created_at: string;
    };
  }[];
}

interface RecipesClientProps {
  recipes: Recipe[];
}

type ViewMode = "single" | "double" | "list";

export default function RecipesClient({ recipes }: RecipesClientProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(
    new Set()
  );
  const [showBulkTagManager, setShowBulkTagManager] = useState(false);
  const [showBulkCollectionManager, setShowBulkCollectionManager] =
    useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("single");

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedRecipes(new Set());
  };

  const handleEnableMultiSelect = (recipeId: string) => {
    // Enable selection mode if not already enabled
    if (!selectionMode) {
      setSelectionMode(true);
    }
    // Select the recipe
    setSelectedRecipes(new Set([recipeId]));
  };

  const toggleSelectRecipe = (recipeId: string) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(recipeId)) {
      newSelected.delete(recipeId);
    } else {
      newSelected.add(recipeId);
    }
    setSelectedRecipes(newSelected);
  };

  const clearSelection = () => {
    setSelectedRecipes(new Set());
  };

  const handleTagsUpdated = () => {
    // Refresh the page to show updated tags
    window.location.reload();
  };

  const handleCollectionsUpdated = () => {
    // Refresh the page to show updated collections
    window.location.reload();
  };

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <div className="container mx-auto py-6 px-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">My Recipes</h1>
          <Link
            href="/recipes/new"
            className="hidden sm:block w-full sm:w-auto"
          >
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Recipe
            </Button>
          </Link>
        </div>

        {/* Sticky action bar for mobile */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b mb-6 sm:hidden">
          <div className="flex items-center justify-between py-3 gap-3">
            {/* View mode selector */}
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "single" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("single")}
                className="p-2"
                aria-label="Single card view"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "double" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("double")}
                className="p-2"
                aria-label="Two column view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="p-2"
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Selection mode toggle */}
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
              className="gap-2"
            >
              {selectionMode ? (
                <>
                  <CheckSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Exit</span>
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  <span className="hidden sm:inline">Select</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Desktop view mode selector */}
        <div className="hidden sm:flex items-center justify-between mb-6">
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === "single" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("single")}
              className="gap-2"
            >
              <Grid className="h-4 w-4" />
              <span>Single</span>
            </Button>
            <Button
              variant={viewMode === "double" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("double")}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>2-Column</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              <span>List</span>
            </Button>
          </div>

          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            onClick={toggleSelectionMode}
            className="gap-2"
          >
            {selectionMode ? (
              <>
                <CheckSquare className="h-4 w-4" />
                Exit Selection
              </>
            ) : (
              <>
                <Square className="h-4 w-4" />
                Select Multiple
              </>
            )}
          </Button>
        </div>

        {/* Recipes grid */}
        {!recipes || recipes.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4 sm:px-6 border rounded-lg">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold">No recipes yet</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Get started by creating your first recipe
              </p>
            </div>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-3 sm:space-y-4">
            {recipes.map((recipe) => (
              <RecipeListItem
                key={recipe.id}
                recipe={recipe}
                showViewCount={true}
                selectionMode={selectionMode}
                isSelected={selectedRecipes.has(recipe.id)}
                onToggleSelect={toggleSelectRecipe}
                onEnableMultiSelect={handleEnableMultiSelect}
              />
            ))}
          </div>
        ) : (
          <div
            className={
              viewMode === "single"
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
                : "grid grid-cols-2 gap-3 sm:gap-4"
            }
          >
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                showViewCount={true}
                selectionMode={selectionMode}
                isSelected={selectedRecipes.has(recipe.id)}
                onToggleSelect={toggleSelectRecipe}
                onEnableMultiSelect={handleEnableMultiSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        selectedCount={selectedRecipes.size}
        onClearSelection={clearSelection}
        onManageTags={() => setShowBulkTagManager(true)}
        onManageCollections={() => setShowBulkCollectionManager(true)}
      />

      {/* Bulk tag manager modal */}
      <BulkTagManagerModal
        open={showBulkTagManager}
        onOpenChange={setShowBulkTagManager}
        recipeIds={Array.from(selectedRecipes)}
        onTagsUpdated={handleTagsUpdated}
      />

      {/* Bulk collection manager modal */}
      <BulkCollectionManagerModal
        open={showBulkCollectionManager}
        onOpenChange={setShowBulkCollectionManager}
        recipeIds={Array.from(selectedRecipes)}
        onCollectionsUpdated={handleCollectionsUpdated}
      />
    </div>
  );
}
