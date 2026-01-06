"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUploader from "@/components/ui/image-uploader";
import { Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RecipeForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<File[]>([]);

  const uploadImagesToStorage = async (
    files: File[]
  ): Promise<{ url: string; path: string }[]> => {
    const uploadedFiles: { url: string; path: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("recipe-images").getPublicUrl(filePath);

      uploadedFiles.push({ url: publicUrl, path: filePath });
    }

    return uploadedFiles;
  };

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
      setError("You must be logged in to create a recipe");
      setLoading(false);
      return;
    }

    try {
      // Upload images first
      let uploadedImages: { url: string; path: string }[] = [];
      if (images.length > 0) {
        uploadedImages = await uploadImagesToStorage(images);
      }

      // Create recipe
      const { data: recipeData, error: insertError } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          ingredients: ingredientsArray,
          instructions,
          cooking_time: cookingTime ? parseInt(cookingTime) : null,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      // Insert recipe images
      if (uploadedImages.length > 0 && recipeData) {
        console.log("Recipe created with ID:", recipeData.id);
        console.log("Attempting to insert images:", uploadedImages);

        const imageInserts = uploadedImages.map((img, index) => ({
          recipe_id: recipeData.id,
          image_url: img.url,
          storage_path: img.path,
          display_order: index,
        }));

        console.log("Image insert data:", imageInserts);

        const { error: imagesError, data: imageData } = await supabase
          .from("recipe_images")
          .insert(imageInserts)
          .select();

        if (imagesError) {
          console.error("Error saving recipe images:", imagesError);
          console.error("Error details:", JSON.stringify(imagesError, null, 2));
          setError(
            `Recipe created but images failed to save: ${
              imagesError.message || JSON.stringify(imagesError)
            }`
          );
          setLoading(false);
          return;
        }

        console.log("Images saved successfully:", imageData);
      }

      router.push("/recipes");
      router.refresh();
    } catch (err) {
      console.error("Error creating recipe:", err);
      setError("Failed to create recipe. Please try again.");
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
          placeholder="e.g., 30"
          min="0"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label>Images</Label>
        <ImageUploader
          images={images}
          onImagesChange={setImages}
          maxImages={10}
          disabled={loading}
        />
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
              Save Recipe
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
