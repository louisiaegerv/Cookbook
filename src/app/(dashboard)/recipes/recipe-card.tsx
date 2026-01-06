"use client";

import { Card } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
  };
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const firstImage = recipe.recipe_images && recipe.recipe_images[0];

  return (
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

            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h2 className="text-white font-semibold text-lg line-clamp-2 drop-shadow-md">
                {recipe.title}
              </h2>
            </div>

            {/* More button on hover */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        ) : (
          <div className="relative aspect-[3/4] w-full bg-muted flex items-center justify-center">
            <div className="text-center p-4">
              <h2 className="text-lg font-semibold mb-2 line-clamp-2">
                {recipe.title}
              </h2>
              <p className="text-sm text-muted-foreground">No image</p>
            </div>

            {/* More button on hover */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="absolute top-3 right-3 p-2 bg-white hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        )}
      </Link>
    </Card>
  );
}
