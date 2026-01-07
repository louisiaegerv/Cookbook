"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Tag as TagIcon,
  Eye,
  FolderOpen,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import TagManagerModal from "@/components/ui/tag-manager-modal";
import CollectionManagerModal from "@/components/ui/collection-manager-modal";
import { Tag, Collection } from "@/lib/types/recipe";

interface RecipeListItemProps {
  recipe: {
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
      tags: Tag;
    }[];
  };
  showViewCount?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (recipeId: string) => void;
  onEnableMultiSelect?: (recipeId: string) => void;
  collectionId?: string;
}

export default function RecipeListItem({
  recipe,
  showViewCount = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  onEnableMultiSelect,
  collectionId,
}: RecipeListItemProps) {
  const [showTagManager, setShowTagManager] = useState(false);
  const [showCollectionManager, setShowCollectionManager] = useState(false);
  const [currentTags, setCurrentTags] = useState(
    recipe.recipe_tags?.map((rt) => rt.tags) || []
  );
  const [currentCollections, setCurrentCollections] = useState<Collection[]>(
    []
  );
  const firstImage = recipe.recipe_images && recipe.recipe_images[0];

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode && onToggleSelect) {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelect(recipe.id);
    }
  };

  return (
    <>
      <Card
        className={`group relative overflow-hidden rounded-lg hover:shadow-md transition-all duration-300 ${
          selectionMode ? "cursor-pointer ring-2 ring-transparent" : ""
        } ${isSelected ? "ring-2 ring-primary" : ""}`}
        onClick={handleCardClick}
      >
        <Link
          href={
            selectionMode
              ? "#"
              : `/recipes/${recipe.id}${
                  collectionId ? `?collectionId=${collectionId}` : ""
                }`
          }
          className="block h-full"
          onClick={(e) => {
            if (selectionMode) {
              e.preventDefault();
            }
          }}
        >
          <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
            {/* Image on the left */}
            <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-muted">
              {firstImage ? (
                <img
                  src={firstImage.image_url}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    No image
                  </span>
                </div>
              )}
            </div>

            {/* Details on the right */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h2 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2 line-clamp-2">
                  {recipe.title}
                </h2>

                {/* Description */}
                {recipe.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
                    {recipe.description}
                  </p>
                )}

                {/* Tags */}
                {currentTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {currentTags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5"
                        style={{
                          backgroundColor: `${tag.color}cc`,
                          color: "white",
                        }}
                      >
                        <TagIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {tag.name}
                      </Badge>
                    ))}
                    {currentTags.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                        style={{
                          backgroundColor: "rgba(0,0,0,0.6)",
                          color: "white",
                        }}
                      >
                        +{currentTags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* View count and selection indicator */}
              <div className="flex items-center justify-between mt-2">
                {showViewCount && !selectionMode && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">
                      {recipe.view_count || 0}
                    </span>
                  </div>
                )}

                {/* Selection checkbox */}
                {selectionMode && (
                  <div
                    className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? "bg-primary" : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* More button on hover - hide in selection mode */}
            {!selectionMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="flex-shrink-0 p-1.5 sm:p-2 hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="bottom"
                  sideOffset={4}
                  className="w-48"
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onEnableMultiSelect) {
                        onEnableMultiSelect(recipe.id);
                      }
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Select This Recipe
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTagManager(true);
                    }}
                  >
                    <TagIcon className="h-4 w-4 mr-2" />
                    Manage Tags
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCollectionManager(true);
                    }}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Manage Collections
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </Link>
      </Card>

      <TagManagerModal
        open={showTagManager}
        onOpenChange={setShowTagManager}
        recipeId={recipe.id}
        currentTags={currentTags}
        onTagsUpdated={setCurrentTags}
      />
      <CollectionManagerModal
        open={showCollectionManager}
        onOpenChange={setShowCollectionManager}
        recipeId={recipe.id}
        currentCollections={currentCollections}
        onCollectionsUpdated={setCurrentCollections}
      />
    </>
  );
}
