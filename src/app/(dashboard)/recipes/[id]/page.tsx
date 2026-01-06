import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Clock, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteRecipeButton from "./delete-recipe-button";
import { RecipeWithRelations } from "@/lib/types/recipe";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to view this recipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Await params to get the id
  const { id } = await params;

  // Fetch recipe with images
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
      )
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !recipe) {
    notFound();
  }

  const typedRecipe = recipe as RecipeWithRelations;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Back button */}
        <Link href="/recipes">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Recipes
          </Button>
        </Link>

        {/* Recipe header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{typedRecipe.title}</h1>
              {typedRecipe.description && (
                <p className="text-muted-foreground text-lg">
                  {typedRecipe.description}
                </p>
              )}
            </div>
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
          </div>

          {typedRecipe.cooking_time && (
            <div className="flex items-center gap-2 text-muted-foreground mt-4">
              <Clock className="h-5 w-5" />
              <span className="text-lg">
                {typedRecipe.cooking_time} minutes
              </span>
            </div>
          )}
        </div>

        {/* Images */}
        {typedRecipe.images && typedRecipe.images.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Photos</h2>
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
            <div className="whitespace-pre-wrap text-lg leading-relaxed">
              {typedRecipe.instructions}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
