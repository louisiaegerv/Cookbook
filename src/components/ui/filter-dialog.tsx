"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Plus } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

interface Recipe {
  id: string;
  title: string;
  ingredients: any[];
  recipe_tags?: {
    tags: Tag;
  }[];
}

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: Recipe[];
  searchTerms: string[];
  currentSearchInput: string;
  selectedTags: Set<string>;
  allTags: { id: string; name: string; color: string }[];
  onSearchTermsChange: (terms: string[]) => void;
  onCurrentSearchInputChange: (text: string) => void;
  onSelectedTagsChange: (tags: Set<string>) => void;
  onAddSearchTerm: (term: string) => void;
}

export default function FilterDialog({
  open,
  onOpenChange,
  recipes,
  searchTerms,
  currentSearchInput,
  selectedTags,
  allTags,
  onSearchTermsChange,
  onCurrentSearchInputChange,
  onSelectedTagsChange,
  onAddSearchTerm,
}: FilterDialogProps) {
  const toggleTag = (tagId: string) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId);
    } else {
      newSelected.add(tagId);
    }
    onSelectedTagsChange(newSelected);
  };

  const clearFilters = () => {
    onSearchTermsChange([]);
    onCurrentSearchInputChange("");
    onSelectedTagsChange(new Set());
  };

  const applyFilters = () => {
    onOpenChange(false);
  };

  const hasActiveFilters = searchTerms.length > 0 || selectedTags.size > 0;

  const handleAddSearchTerm = () => {
    if (currentSearchInput.trim()) {
      onAddSearchTerm(currentSearchInput);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentSearchInput.trim()) {
      onAddSearchTerm(currentSearchInput);
    }
  };

  const removeSearchTerm = (term: string) => {
    onSearchTermsChange(searchTerms.filter((t) => t !== term));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Recipes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Text Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by title or ingredients..."
                  value={currentSearchInput}
                  onChange={(e) => onCurrentSearchInputChange(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddSearchTerm}
                  disabled={!currentSearchInput.trim()}
                  aria-label="Add search term"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Display active search terms */}
              {searchTerms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {searchTerms.map((term) => (
                    <Badge
                      key={term}
                      variant="secondary"
                      className="gap-1 pr-1 pl-2 py-1"
                    >
                      "{term}"
                      <button
                        onClick={() => removeSearchTerm(term)}
                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove "${term}"`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const isSelected = selectedTags.has(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      style={
                        isSelected
                          ? {
                              backgroundColor: tag.color,
                              color: "#fff",
                            }
                          : {
                              borderColor: tag.color,
                              color: tag.color,
                            }
                      }
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                      {isSelected && <X className="h-3 w-3 ml-1" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {allTags.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No tags available. Add tags to your recipes to enable tag
              filtering.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            Clear
          </Button>
          <Button onClick={applyFilters}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
