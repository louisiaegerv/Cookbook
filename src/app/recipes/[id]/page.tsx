import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Clock, Trash2, Edit, Eye } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteRecipeButton from "@/components/ui/delete-recipe-button";
import {
  RecipeWithRelations,
  Tag,
  RecipeImage,
  Collection,
} from "@/lib/types/recipe";
import RecipeTags from "@/components/ui/recipe-tags";
import RecipeCollections from "@/components/ui/recipe-collections";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default async function PublicRecipeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ collectionId?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Await params to get the id
  const { id } = await params;
  const { collectionId } = await searchParams;

  // Fetch recipe with images, tags, and collections (without filtering by user_id for public access)
  const { data: recipe, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_images (
        id,
        image_url,
        storage_path,
        display_order
      ),
      recipe_tags (
        tags (
          id,
          name,
          color,
          user_id,
          created_at
        )
      ),
      recipe_collections (
        collections (
          id,
          user_id,
          name,
          description,
          created_at,
          updated_at
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !recipe) {
    notFound();
  }

  // Increment view count using RPC function (works for both authenticated and unauthenticated users)
  await supabase.rpc("increment_recipe_view_count", { recipe_id: id });

  const typedRecipe = recipe as RecipeWithRelations & {
    recipe_tags?: { tags: Tag }[];
    recipe_images?: RecipeImage[];
    recipe_collections?: { collections: Collection }[];
  };
  typedRecipe.images = typedRecipe.recipe_images;
  const tags = typedRecipe.recipe_tags?.map((rt) => rt.tags) || [];
  const collections =
    typedRecipe.recipe_collections?.map((rc) => rc.collections) || [];

  // Check if current user is the owner
  const isOwner = user && user.id === typedRecipe.user_id;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-6 px-4 max-w-4xl sm:py-8">
        {/* Back button */}
        <Link href={collectionId ? `/collections/${collectionId}` : "/recipes"}>
          <Button variant="ghost" className="mb-4 sm:mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {collectionId ? "Collection" : "Recipes"}
          </Button>
        </Link>

        {/* Images */}
        {typedRecipe.images && typedRecipe.images.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {typedRecipe.images
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((image) => (
                  <div
                    key={image.id}
                    className="aspect-square rounded-lg overflow-hidden border"
                  >
                    <img
                      src={image.image_url}
                      alt={`${typedRecipe.title} photo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recipe header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                {typedRecipe.title}
              </h1>
              {typedRecipe.description && (
                <div className="text-muted-foreground text-lg prose prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {typedRecipe.description}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            {/* Only show edit/delete buttons if user is the owner */}
            {isOwner && (
              <div className="flex gap-2">
                <Link href={`/recipes/${typedRecipe.id}/edit`}>
                  <Button variant="outline" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <DeleteRecipeButton
                  recipeId={typedRecipe.id}
                  recipeTitle={typedRecipe.title}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-muted-foreground mt-4">
            {typedRecipe.cooking_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-lg">
                  {typedRecipe.cooking_time} minutes
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-lg">
                {typedRecipe.view_count || 0} view
                {typedRecipe.view_count !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <RecipeTags recipeId={typedRecipe.id} tags={tags} />

        {/* Collections */}
        <RecipeCollections
          recipeId={typedRecipe.id}
          collections={collections}
        />

        {/* Ingredients */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
            <CardDescription>
              {typedRecipe.ingredients.length} item
              {typedRecipe.ingredients.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 sm:space-y-3">
              {typedRecipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-2 sm:gap-3">
                  <span className="text-primary font-semibold min-w-[20px] sm:min-w-[24px] text-sm sm:text-base">
                    {index + 1}.
                  </span>
                  <span className="flex-1 text-sm sm:text-base">
                    {ingredient}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate max-w-none prose-sm sm:prose-base">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {typedRecipe.instructions}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
