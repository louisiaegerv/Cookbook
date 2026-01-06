import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import DeleteRecipeButton from "./[id]/delete-recipe-button";

export default async function RecipesPage() {
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
              Please sign in to view your recipes
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

  // Fetch recipes with images
  const { data: recipes } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_images (
        id,
        image_url
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
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No recipes yet</CardTitle>
              <CardDescription>
                Get started by creating your first recipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/recipes/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Recipe
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => {
              const firstImage =
                recipe.recipe_images && recipe.recipe_images[0];
              return (
                <Card
                  key={recipe.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                >
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="flex-1 flex flex-col"
                  >
                    {firstImage && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={firstImage.image_url}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-1">
                        {recipe.title}
                      </CardTitle>
                      {recipe.description && (
                        <CardDescription className="line-clamp-2">
                          {recipe.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-semibold">Ingredients:</span>
                          <span className="text-muted-foreground">
                            {recipe.ingredients.length} items
                          </span>
                        </div>
                        {recipe.cooking_time && (
                          <div>
                            <span className="font-semibold">Cooking time:</span>
                            <span className="text-muted-foreground">
                              {recipe.cooking_time} minutes
                            </span>
                          </div>
                        )}
                        {recipe.recipe_images &&
                          recipe.recipe_images.length > 0 && (
                            <div>
                              <span className="font-semibold">Images:</span>
                              <span className="text-muted-foreground">
                                {recipe.recipe_images.length} photo
                                {recipe.recipe_images.length > 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Link>
                  <div className="p-4 pt-0">
                    <DeleteRecipeButton
                      recipeId={recipe.id}
                      recipeTitle={recipe.title}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
