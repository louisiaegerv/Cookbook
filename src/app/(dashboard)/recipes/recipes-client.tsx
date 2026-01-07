"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Filter,
  X,
  Plus as PlusIcon,
} from "lucide-react";
import Link from "next/link";
import RecipeCard from "./recipe-card";
import RecipeListItem from "./recipe-list-item";
import BulkActionBar from "@/components/ui/bulk-action-bar";
import BulkTagManagerModal from "@/components/ui/bulk-tag-manager-modal";
import BulkCollectionManagerModal from "@/components/ui/bulk-collection-manager-modal";
import FilterDialog from "@/components/ui/filter-dialog";

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
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(recipes);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [mounted, setMounted] = useState(false);

  // Filter state
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [currentSearchInput, setCurrentSearchInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Extract all unique tags from recipes
  const allTags = useMemo(() => {
    const tagsMap = new Map<
      string,
      { id: string; name: string; color: string }
    >();
    recipes.forEach((recipe) => {
      recipe.recipe_tags?.forEach((rt) => {
        if (!tagsMap.has(rt.tags.id)) {
          tagsMap.set(rt.tags.id, rt.tags);
        }
      });
    });
    return Array.from(tagsMap.values());
  }, [recipes]);

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

  // Update filtered recipes when original recipes change
  useEffect(() => {
    setFilteredRecipes(recipes);
  }, [recipes]);

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

  const selectAllFiltered = () => {
    const allFilteredIds = new Set(filteredRecipes.map((r) => r.id));
    setSelectedRecipes(allFilteredIds);
  };

  // Check if all filtered recipes are selected
  const allSelected =
    selectedRecipes.size === filteredRecipes.length &&
    filteredRecipes.length > 0;

  const handleTagsUpdated = () => {
    // Refresh the page to show updated tags
    window.location.reload();
  };

  const handleCollectionsUpdated = () => {
    // Refresh the page to show updated collections
    window.location.reload();
  };

  // Apply filters based on current state
  const applyFilters = () => {
    const filtered = recipes.filter((recipe) => {
      // Text search: match ALL search terms in title OR ingredients
      let matchesText = true;
      if (searchTerms.length > 0) {
        matchesText = searchTerms.every((searchTerm) => {
          const searchLower = searchTerm.toLowerCase();
          const titleMatch = recipe.title.toLowerCase().includes(searchLower);
          const ingredientsMatch = recipe.ingredients.some((ing: any) =>
            typeof ing === "string"
              ? ing.toLowerCase().includes(searchLower)
              : ing.name?.toLowerCase().includes(searchLower)
          );
          return titleMatch || ingredientsMatch;
        });
      }

      // Tag filter: recipe must have ALL selected tags
      let matchesTags = true;
      if (selectedTags.size > 0) {
        const recipeTagIds = new Set(
          recipe.recipe_tags?.map((rt) => rt.tags.id) || []
        );
        matchesTags = Array.from(selectedTags).every((tagId) =>
          recipeTagIds.has(tagId)
        );
      }

      return matchesText && matchesTags;
    });

    setFilteredRecipes(filtered);
  };

  // Apply filters whenever filter state changes
  useEffect(() => {
    applyFilters();
  }, [searchTerms, selectedTags, recipes]);

  const resetFilters = () => {
    setSearchTerms([]);
    setCurrentSearchInput("");
    setSelectedTags(new Set());
  };

  const addSearchTerm = (term: string) => {
    if (term.trim() && !searchTerms.includes(term.trim())) {
      setSearchTerms([...searchTerms, term.trim()]);
    }
    setCurrentSearchInput("");
  };

  const removeSearchTerm = (term: string) => {
    setSearchTerms(searchTerms.filter((t) => t !== term));
  };

  const removeTagFilter = (tagId: string) => {
    const newSelected = new Set(selectedTags);
    newSelected.delete(tagId);
    setSelectedTags(newSelected);
  };

  const hasActiveFilters = searchTerms.length > 0 || selectedTags.size > 0;

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <div className="container mx-auto md:py-6 px-4 sm:py-8">
        {/* Header */}
        <div className="hidden md:flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
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

                {/* Filter button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilterDialog(true)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter</span>
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
                <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                  {/* Select All / Deselect All button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={allSelected ? clearSelection : selectAllFiltered}
                    disabled={filteredRecipes.length === 0}
                    className="gap-2 whitespace-nowrap"
                  >
                    {allSelected ? "Deselect All" : "Select All"}
                  </Button>

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
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
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
        <div className="hidden sm:flex items-center justify-end gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterDialog(true)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>

          {selectionMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={allSelected ? clearSelection : selectAllFiltered}
              disabled={filteredRecipes.length === 0}
              className="gap-2"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </Button>
          )}

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

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Active Filters:
                </span>

                {/* Search filter badges */}
                {searchTerms.map((term) => (
                  <Badge
                    key={term}
                    variant="secondary"
                    className="gap-1 pr-1 pl-2 py-1"
                  >
                    Search: "{term}"
                    <button
                      onClick={() => removeSearchTerm(term)}
                      className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove "${term}" filter`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}

                {/* Tag filter badges */}
                {Array.from(selectedTags).map((tagId) => {
                  const tag = allTags.find((t) => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="gap-1 pr-1 pl-2 py-1"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        borderColor: tag.color,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                      <button
                        onClick={() => removeTagFilter(tag.id)}
                        className="ml-1 hover:bg-current/20 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove ${tag.name} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>

              {/* Clear all filters button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear all filters
              </Button>
            </div>
          </div>
        )}

        {/* Recipes grid */}
        {!filteredRecipes || filteredRecipes.length === 0 ? (
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
            {filteredRecipes.map((recipe) => (
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
            {filteredRecipes.map((recipe) => (
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
          filteredCount={filteredRecipes.length}
          onClearSelection={clearSelection}
          onManageTags={() => setShowBulkTagManager(true)}
          onManageCollections={() => setShowBulkCollectionManager(true)}
          onSelectAll={selectAllFiltered}
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

      {/* Filter dialog */}
      <FilterDialog
        open={showFilterDialog}
        onOpenChange={setShowFilterDialog}
        recipes={recipes}
        searchTerms={searchTerms}
        currentSearchInput={currentSearchInput}
        selectedTags={selectedTags}
        allTags={allTags}
        onSearchTermsChange={setSearchTerms}
        onCurrentSearchInputChange={setCurrentSearchInput}
        onSelectedTagsChange={setSelectedTags}
        onAddSearchTerm={addSearchTerm}
      />
    </div>
  );
}
