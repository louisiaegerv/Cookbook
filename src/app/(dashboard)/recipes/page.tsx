import { createClient } from "@/lib/supabase/server";
import RecipesClient from "./recipes-client";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import Link from "next/link";

export default async function RecipesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md p-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Authentication Required</h2>
            <p className="text-muted-foreground">
              Please sign in to view your recipes
            </p>
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Fetch recipes with images and tags
  const { data: recipes } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_images (
        id,
        image_url,
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
    .order("created_at", { ascending: false });

  // Sort images by display_order for each recipe
  const sortedRecipes =
    recipes?.map((recipe) => ({
      ...recipe,
      recipe_images: recipe.recipe_images?.sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
      ),
    })) || [];

  return <RecipesClient recipes={sortedRecipes} />;
}
