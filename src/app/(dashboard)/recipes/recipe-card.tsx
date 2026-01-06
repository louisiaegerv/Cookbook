"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Tag as TagIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import TagManagerModal from "@/components/ui/tag-manager-modal";
import { Tag } from "@/lib/types/recipe";

interface RecipeCardProps {
  recipe: {
    id: string;
    title: string;
    description?: string;
    ingredients: any[];
    cooking_time?: number;
    recipe_images?: {
      id: string;
      image_url: string;
    }[];
    tags?: Tag[];
  };
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const [showTagManager, setShowTagManager] = useState(false);
  const [currentTags, setCurrentTags] = useState(recipe.tags || []);
  const firstImage = recipe.recipe_images && recipe.recipe_images[0];

  return (
    <>
      <Card className="group relative overflow-hidden rounded-lg cursor-pointer hover:shadow-xl transition-all duration-300">
        <Link href={`/recipes/${recipe.id}`} className="block h-full">
          {firstImage ? (
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <img
                src={firstImage.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Tags overlay */}
              {currentTags.length > 0 && (
                <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[calc(100%-3rem)]">
                  {currentTags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-xs gap-1"
                      style={{
                        backgroundColor: `${tag.color}cc`,
                        color: "white",
                      }}
                    >
                      <TagIcon className="h-3 w-3" />
                      {tag.name}
                    </Badge>
                  ))}
                  {currentTags.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="text-xs"
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

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h2 className="text-white font-semibold text-lg line-clamp-2 drop-shadow-md">
                  {recipe.title}
                </h2>
              </div>

              {/* More button on hover */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-700" />
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="relative aspect-[3/4] w-full bg-muted flex items-center justify-center">
              <div className="text-center p-4">
                <h2 className="text-lg font-semibold mb-2 line-clamp-2">
                  {recipe.title}
                </h2>
                <p className="text-sm text-muted-foreground">No image</p>
              </div>

              {/* Tags overlay */}
              {currentTags.length > 0 && (
                <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[calc(100%-3rem)]">
                  {currentTags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-xs gap-1"
                      style={{
                        backgroundColor: `${tag.color}cc`,
                        color: "white",
                      }}
                    >
                      <TagIcon className="h-3 w-3" />
                      {tag.name}
                    </Badge>
                  ))}
                  {currentTags.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="text-xs"
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

              {/* More button on hover */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="absolute top-3 right-3 p-2 bg-white hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-700" />
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
                </DropdownMenuContent>
              </DropdownMenu>
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
    </>
  );
}
