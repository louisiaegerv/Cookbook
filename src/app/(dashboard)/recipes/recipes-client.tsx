"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  Square,
  Plus,
  Grid,
  List,
  LayoutGrid,
  LayoutTemplate,
  Tag as TagIcon,
  FolderOpen,
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
  const [mounted, setMounted] = useState(false);

  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem("recipes-view-mode") as ViewMode;
    if (savedViewMode && ["single", "double", "list"].includes(savedViewMode)) {
      setViewMode(savedViewMode);
    }
    setMounted(true);
  }, []);

  // Save view mode to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("recipes-view-mode", viewMode);
    }
  }, [viewMode, mounted]);

  // Cycle through view modes
  const cycleViewMode = () => {
    const modes: ViewMode[] = ["single", "double", "list"];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  };

  // Get icon for current view mode
  const getViewModeIcon = () => {
    switch (viewMode) {
      case "single":
        return <Grid className="h-4 w-4" />;
      case "double":
        return <LayoutGrid className="h-4 w-4" />;
      case "list":
        return <List className="h-4 w-4" />;
    }
  };

  // Get label for current view mode
  const getViewModeLabel = () => {
    switch (viewMode) {
      case "single":
        return "Single";
      case "double":
        return "2-Column";
      case "list":
        return "List";
    }
  };

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
            {!selectionMode ? (
              <>
                {/* View mode toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cycleViewMode}
                  className="gap-2"
                  aria-label={`Current view: ${getViewModeLabel()}, click to cycle through views`}
                >
                  {getViewModeIcon()}
                  <span className="hidden sm:inline">{getViewModeLabel()}</span>
                </Button>

                {/* Selection mode toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectionMode}
                  className="gap-2"
                >
                  <Square className="h-4 w-4" />
                  <span className="hidden sm:inline">Select</span>
                </Button>
              </>
            ) : (
              <>
                {/* Selection mode controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkTagManager(true)}
                    className="gap-2"
                    disabled={selectedRecipes.size === 0}
                  >
                    <TagIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Tags</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkCollectionManager(true)}
                    className="gap-2"
                    disabled={selectedRecipes.size === 0}
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Collections</span>
                  </Button>
                  {selectedRecipes.size > 0 && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {selectedRecipes.size} selected
                    </span>
                  )}
                </div>

                {/* Exit selection mode */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={toggleSelectionMode}
                  className="gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Exit</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Desktop selection mode toggle only */}
        <div className="hidden sm:flex items-center justify-end mb-6">
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

      {/* Bulk action bar - desktop only */}
      <div className="hidden sm:block">
        <BulkActionBar
          selectedCount={selectedRecipes.size}
          onClearSelection={clearSelection}
          onManageTags={() => setShowBulkTagManager(true)}
          onManageCollections={() => setShowBulkCollectionManager(true)}
        />
      </div>

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
