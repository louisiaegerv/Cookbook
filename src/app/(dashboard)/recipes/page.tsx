import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import RecipeCard from "./recipe-card";

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
    `
    )
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Recipes</h1>
          <Link href="/recipes/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Recipe
            </Button>
          </Link>
        </div>

        {!recipes || recipes.length === 0 ? (
          <Card className="text-center py-12 px-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">No recipes yet</h2>
              <p className="text-muted-foreground">
                Get started by creating your first recipe
              </p>
              <Link href="/recipes/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Recipe
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
