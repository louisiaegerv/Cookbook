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
import { RecipeWithRelations, Tag, RecipeImage } from "@/lib/types/recipe";
import RecipeTags from "@/components/ui/recipe-tags";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default async function PublicRecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Await params to get the id
  const { id } = await params;

  // Fetch recipe with images and tags (without filtering by user_id for public access)
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
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !recipe) {
    notFound();
  }

  // Increment view count (fire and forget, don't await)
  supabase
    .from("recipes")
    .update({ view_count: (recipe.view_count || 0) + 1 })
    .eq("id", id);

  const typedRecipe = recipe as RecipeWithRelations & {
    recipe_tags?: { tags: Tag }[];
    recipe_images?: RecipeImage[];
  };
  typedRecipe.images = typedRecipe.recipe_images;
  const tags = typedRecipe.recipe_tags?.map((rt) => rt.tags) || [];

  // Check if current user is the owner
  const isOwner = user && user.id === typedRecipe.user_id;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Back button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        {/* Images */}
        {typedRecipe.images && typedRecipe.images.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{typedRecipe.title}</h1>
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

          <div className="flex items-center gap-6 text-muted-foreground mt-4">
            {typedRecipe.cooking_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="text-lg">
                  {typedRecipe.cooking_time} minutes
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <span className="text-lg">
                {typedRecipe.view_count || 0} view
                {typedRecipe.view_count !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <RecipeTags recipeId={typedRecipe.id} tags={tags} />

        {/* Ingredients */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
            <CardDescription>
              {typedRecipe.ingredients.length} item
              {typedRecipe.ingredients.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {typedRecipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary font-semibold min-w-[24px]">
                    {index + 1}.
                  </span>
                  <span className="flex-1">{ingredient}</span>
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
            <div className="prose prose-slate max-w-none">
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
