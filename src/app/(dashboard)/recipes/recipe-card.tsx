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

interface RecipeCardProps {
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
  collectionId?: string;
}

export default function RecipeCard({
  recipe,
  showViewCount = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  collectionId,
}: RecipeCardProps) {
  const [showTagManager, setShowTagManager] = useState(false);
  const [showCollectionManager, setShowCollectionManager] = useState(false);
  const [currentTags, setCurrentTags] = useState(
    recipe.recipe_tags?.map((rt) => rt.tags) || []
  );
  const [currentCollections, setCurrentCollections] = useState<Collection[]>(
    []
  );
  const firstImage = recipe.recipe_images && recipe.recipe_images[0];
  const secondImage = recipe.recipe_images && recipe.recipe_images[1];
  const hasMultipleImages = secondImage !== undefined;

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
        className={`group relative overflow-hidden rounded-lg hover:shadow-xl transition-all duration-300 ${
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
          {firstImage ? (
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              {/* First image - fades out on hover only if multiple images exist */}
              <img
                src={firstImage.image_url}
                alt={recipe.title}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  hasMultipleImages ? "group-hover:opacity-0" : ""
                }`}
              />
              {/* Second image - fades in on hover */}
              {secondImage && (
                <img
                  src={secondImage.image_url}
                  alt={recipe.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                />
              )}
              {/* Selection checkbox overlay */}
              {selectionMode && (
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20">
                  <div
                    className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? "bg-primary" : "bg-white/90 hover:bg-white"
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                    )}
                  </div>
                </div>
              )}

              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {/* View count - move right if selection mode is active */}
              {showViewCount && !selectionMode && (
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                  <span className="text-white text-[10px] sm:text-xs font-medium">
                    {recipe.view_count || 0}
                  </span>
                </div>
              )}

              {/* View count in selection mode - positioned differently */}
              {showViewCount && selectionMode && (
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                  <span className="text-white text-[10px] sm:text-xs font-medium">
                    {recipe.view_count || 0}
                  </span>
                </div>
              )}

              {/* Tags overlay - hidden for now*/}
              {/* {currentTags.length > 0 && (
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-wrap gap-1 max-w-[calc(100%-2.5rem)] sm:max-w-[calc(100%-3rem)]">
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
              )} */}

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                <h2 className="text-white font-semibold text-sm sm:text-base md:text-lg line-clamp-2 drop-shadow-md">
                  {recipe.title}
                </h2>
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
                      className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 bg-white/90 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
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
          ) : (
            <div className="relative aspect-[3/4] w-full bg-muted flex items-center justify-center">
              <div className="text-center p-3 sm:p-4">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2 line-clamp-2">
                  {recipe.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  No image
                </p>
              </div>

              {/* Selection checkbox overlay */}
              {selectionMode && (
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20">
                  <div
                    className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? "bg-primary" : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                    )}
                  </div>
                </div>
              )}

              {/* View count - hide in selection mode */}
              {showViewCount && !selectionMode && (
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-700" />
                  <span className="text-gray-700 text-[10px] sm:text-xs font-medium">
                    {recipe.view_count || 0}
                  </span>
                </div>
              )}

              {/* Tags overlay */}
              {currentTags.length > 0 && (
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-wrap gap-1 max-w-[calc(100%-2.5rem)] sm:max-w-[calc(100%-3rem)]">
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

              {/* More button on hover - hide in selection mode */}
              {!selectionMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 bg-white hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
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
          )}
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
