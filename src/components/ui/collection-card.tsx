"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, FolderOpen, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { CollectionWithRecipes } from "@/lib/types/collection";

interface CollectionCardProps {
  collection: CollectionWithRecipes;
  onDelete?: (id: string) => void;
  onEdit?: (collection: CollectionWithRecipes) => void;
}

export default function CollectionCard({
  collection,
  onDelete,
  onEdit,
}: CollectionCardProps) {
  const recipeCount = collection.recipe_collections?.length || 0;

  // Get first 3 recipe images for preview
  const previewImages = collection.recipe_collections
    ?.slice(0, 3)
    .map((rc) => rc.recipes.recipe_images?.[0]?.image_url)
    .filter(Boolean) as string[] | undefined;

  return (
    <Card className="group relative overflow-hidden rounded-lg cursor-pointer hover:shadow-xl transition-all duration-300">
      <Link href={`/collections/${collection.id}`} className="block h-full">
        <div className="relative aspect-[3/4] w-full bg-muted">
          {/* Image grid preview */}
          {previewImages && previewImages.length > 0 ? (
            <div className="w-full h-full grid gap-1 p-1">
              {previewImages.length === 1 && (
                <img
                  src={previewImages[0]}
                  alt={collection.name}
                  className="w-full h-full object-cover rounded"
                />
              )}
              {previewImages.length === 2 && (
                <>
                  <img
                    src={previewImages[0]}
                    alt="Recipe 1"
                    className="w-full h-full object-cover rounded"
                  />
                  <img
                    src={previewImages[1]}
                    alt="Recipe 2"
                    className="w-full h-full object-cover rounded"
                  />
                </>
              )}
              {previewImages.length === 3 && (
                <>
                  <img
                    src={previewImages[0]}
                    alt="Recipe 1"
                    className="w-full h-full object-cover rounded"
                  />
                  <img
                    src={previewImages[1]}
                    alt="Recipe 2"
                    className="w-full h-full object-cover rounded"
                  />
                  <img
                    src={previewImages[2]}
                    alt="Recipe 3"
                    className="w-full h-full object-cover rounded"
                  />
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-white font-semibold text-lg line-clamp-2 drop-shadow-md mb-2">
              {collection.name}
            </h2>
            {collection.description && (
              <p className="text-white/80 text-sm line-clamp-2 mb-2">
                {collection.description}
              </p>
            )}
            <Badge
              variant="secondary"
              className="bg-white/20 text-white hover:bg-white/30"
            >
              <FolderOpen className="h-3 w-3 mr-1" />
              {recipeCount} recipe{recipeCount !== 1 ? "s" : ""}
            </Badge>
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
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(collection);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Collection
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(collection.id);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Collection
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Link>
    </Card>
  );
}
