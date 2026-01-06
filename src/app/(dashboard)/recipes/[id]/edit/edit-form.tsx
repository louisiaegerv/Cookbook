"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface RecipeWithImages {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string;
  cooking_time: number | null;
  created_at: string;
  updated_at: string;
  recipe_images: Array<{
    id: string;
    recipe_id: string;
    image_url: string;
    storage_path: string;
    display_order: number | null;
  }>;
}

interface EditRecipeFormProps {
  recipe: RecipeWithImages;
}

export default function EditRecipeForm({ recipe }: EditRecipeFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const ingredients = formData.get("ingredients") as string;
    const instructions = formData.get("instructions") as string;
    const cookingTime = formData.get("cooking_time") as string;

    // Parse ingredients (one per line)
    const ingredientsArray = ingredients
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to edit a recipe");
      setLoading(false);
      return;
    }

    try {
      // Update recipe
      const { error: updateError } = await supabase
        .from("recipes")
        .update({
          title,
          description: description || null,
          ingredients: ingredientsArray,
          instructions,
          cooking_time: cookingTime ? parseInt(cookingTime) : null,
        })
        .eq("id", recipe.id)
        .eq("user_id", user.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      router.push(`/recipes/${recipe.id}`);
      router.refresh();
    } catch (err) {
      console.error("Error updating recipe:", err);
      setError("Failed to update recipe. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          defaultValue={recipe.title}
          placeholder="e.g., Chocolate Chip Cookies"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={recipe.description || ""}
          placeholder="Brief description of your recipe"
          rows={3}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ingredients">Ingredients</Label>
        <Textarea
          id="ingredients"
          name="ingredients"
          defaultValue={recipe.ingredients.join("\n")}
          placeholder="One ingredient per line&#10;e.g.,&#10;2 cups flour&#10;1 cup sugar&#10;1/2 tsp salt"
          rows={5}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter one ingredient per line
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          name="instructions"
          defaultValue={recipe.instructions}
          placeholder="Step-by-step cooking instructions"
          rows={10}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cooking_time">Cooking Time (minutes)</Label>
        <Input
          id="cooking_time"
          name="cooking_time"
          type="number"
          defaultValue={recipe.cooking_time || ""}
          placeholder="e.g., 30"
          min="0"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label>Images</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Image editing is not yet available. You can add new images or remove
          existing ones when creating a new version of the recipe.
        </p>
        {recipe.recipe_images && recipe.recipe_images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recipe.recipe_images
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .map((image) => (
                <div
                  key={image.id}
                  className="aspect-square rounded-lg overflow-hidden border"
                >
                  <img
                    src={image.image_url}
                    alt={`${recipe.title} photo`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
