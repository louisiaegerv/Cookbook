"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  FolderOpen,
  Clock,
  Eye,
  Trash2,
  X,
  Check,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionWithRecipes } from "@/lib/types/collection";
import RecipeCard from "@/app/(dashboard)/recipes/recipe-card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DeleteCollectionButton from "@/components/ui/delete-collection-button";

export default function PublicCollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = createClient();
  const [collection, setCollection] = useState<CollectionWithRecipes | null>(
    null
  );
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(
    new Set()
  );
  const [isRemoving, setIsRemoving] = useState(false);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      const { id: collectionId } = await params;
      setId(collectionId);

      // Get user
      const {
        data: { user: userData },
      } = await supabase.auth.getUser();
      setUser(userData);

      // Fetch collection with recipes
      const { data: collectionData, error } = await supabase
        .from("collections")
        .select(
          `
          *,
          recipe_collections (
            recipes (
              *,
              recipe_images (
                id,
                image_url
              ),
              recipe_tags (
                tags (
                  id,
                  name,
                  color,
                  user_id,
                  created_at
                )
              )
            )
          )
        `
        )
        .eq("id", collectionId)
        .single();

      if (error || !collectionData) {
        setLoading(false);
        return;
      }

      setCollection(collectionData as CollectionWithRecipes);
      setLoading(false);
    }

    loadData();
  }, [params, supabase]);

  const handleToggleSelect = (recipeId: string) => {
    setSelectedRecipes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  };

  const handleEnableMultiSelect = (recipeId: string) => {
    setSelectionMode(true);
    setSelectedRecipes(new Set([recipeId]));
  };

  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedRecipes(new Set());
  };

  const handleBulkRemove = async () => {
    if (selectedRecipes.size === 0) return;

    setIsRemoving(true);
    try {
      // Remove all selected recipes from the collection
      const { error } = await supabase
        .from("recipe_collections")
        .delete()
        .eq("collection_id", id)
        .in("recipe_id", Array.from(selectedRecipes));

      if (error) throw error;

      // Refresh collection data
      const { data: collectionData, error: fetchError } = await supabase
        .from("collections")
        .select(
          `
          *,
          recipe_collections (
            recipes (
              *,
              recipe_images (
                id,
                image_url
              ),
              recipe_tags (
                tags (
                  id,
                  name,
                  color,
                  user_id,
                  created_at
                )
              )
            )
          )
        `
        )
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      setCollection(collectionData as CollectionWithRecipes);
      setSelectionMode(false);
      setSelectedRecipes(new Set());
    } catch (error) {
      console.error("Error removing recipes:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!collection) {
    notFound();
  }

  const recipes = collection.recipe_collections?.map((rc) => rc.recipes) || [];
  const isOwner = user && user.id === collection.user_id;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-6 px-4 max-w-6xl sm:py-8">
        {/* Back button */}
        <Link href={isOwner ? "/collections" : "/recipes"}>
          <Button variant="ghost" className="mb-4 sm:mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {isOwner ? "My Collections" : "Recipes"}
          </Button>
        </Link>

        {/* Collection header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                  {collection.name}
                </h1>
                {isOwner && (
                  <DeleteCollectionButton
                    collectionId={collection.id}
                    collectionName={collection.name}
                  />
                )}
              </div>
              {collection.description && (
                <div className="text-muted-foreground text-lg prose prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {collection.description}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-muted-foreground mt-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-lg">
                {recipes.length} recipe{recipes.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-lg">
                Created {new Date(collection.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Selection mode controls */}
        {selectionMode && isOwner && (
          <div className="mb-4 sm:mb-6 flex items-center justify-between bg-muted p-3 sm:p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-sm sm:text-base">
                {selectedRecipes.size} recipe
                {selectedRecipes.size !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExitSelectionMode}
                disabled={isRemoving}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkRemove}
                disabled={selectedRecipes.size === 0 || isRemoving}
              >
                {isRemoving ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove Selected
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Recipes grid */}
        {recipes.length === 0 ? (
          <Card className="text-center py-8 sm:py-12 px-4 sm:px-6">
            <div className="space-y-4">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl sm:text-2xl font-bold">No recipes yet</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                This collection doesn't have any recipes yet
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                showViewCount={true}
                collectionId={collection.id}
                selectionMode={selectionMode}
                isSelected={selectedRecipes.has(recipe.id)}
                onToggleSelect={handleToggleSelect}
                onEnableMultiSelect={handleEnableMultiSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
