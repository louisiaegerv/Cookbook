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

interface CollectionListItemProps {
  collection: CollectionWithRecipes;
  onDelete?: (id: string) => void;
  onEdit?: (collection: CollectionWithRecipes) => void;
}

export default function CollectionListItem({
  collection,
  onDelete,
  onEdit,
}: CollectionListItemProps) {
  const recipeCount = collection.recipe_collections?.length || 0;

  // Get first recipe image for preview
  const previewImage =
    collection.recipe_collections?.[0]?.recipes.recipe_images?.[0]?.image_url;

  return (
    <Card className="group relative overflow-hidden rounded-lg hover:shadow-md transition-all duration-300">
      <Link href={`/collections/${collection.id}`} className="block h-full">
        <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
          {/* Image on the left */}
          <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-muted">
            {previewImage ? (
              <img
                src={previewImage}
                alt={collection.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Details on the right */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h2 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2 line-clamp-2">
                {collection.name}
              </h2>

              {/* Description */}
              {collection.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
                  {collection.description}
                </p>
              )}

              {/* Recipe count badge */}
              <Badge variant="secondary" className="w-fit gap-1">
                <FolderOpen className="h-3 w-3" />
                {recipeCount} recipe{recipeCount !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>

          {/* More button on hover */}
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
