"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageEditor from "@/components/ui/image-editor";
import type { UnifiedImage } from "@/components/ui/image-editor";
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

interface ExistingImage {
  id: string;
  recipe_id: string;
  image_url: string;
  storage_path: string;
  display_order: number | null;
}

interface NormalizedImage {
  id: string;
  recipe_id: string;
  image_url: string;
  storage_path: string;
  display_order: number;
}

interface EditRecipeFormProps {
  recipe: RecipeWithImages;
}

export default function EditRecipeForm({ recipe }: EditRecipeFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingImages, setExistingImages] = useState<NormalizedImage[]>(
    () => {
      const sorted = [...(recipe.recipe_images || [])].sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0)
      );
      // Ensure display_order values are sequential starting from 0
      return sorted.map((img, index) => ({
        ...img,
        display_order: index,
      }));
    }
  );
  const [newImages, setNewImages] = useState<File[]>([]);
  const [unifiedImages, setUnifiedImages] = useState<UnifiedImage[]>([]);

  // Wrapper to ensure display_order is always normalized
  const handleExistingImagesChange = (images: ExistingImage[]) => {
    const sorted = [...images].sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    );
    const normalized: NormalizedImage[] = sorted.map((img, index) => ({
      ...img,
      display_order: index,
    }));
    setExistingImages(normalized);
  };

  const handleUnifiedImagesChange = (images: UnifiedImage[]) => {
    setUnifiedImages(images);
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

      // Use unified images for ordering if available, otherwise fall back to existingImages
      const imagesToUpdate: UnifiedImage[] =
        unifiedImages.length > 0
          ? unifiedImages
          : existingImages.map((img) => ({
              id: img.id,
              recipe_id: img.recipe_id,
              image_url: img.image_url,
              storage_path: img.storage_path,
              display_order: img.display_order,
              isNew: false,
            }));

      // Update existing images with their new display_order values
      for (const image of imagesToUpdate) {
        if (image.isNew) continue; // Skip new images, they'll be uploaded separately

        const { data: updateData, error: updateImageError } =
          await supabase.rpc("update_image_display_order", {
            p_image_id: image.id!,
            p_display_order: image.display_order,
            p_user_id: user.id,
          });

        if (updateImageError) {
          console.error(
            "Error updating image order via RPC:",
            updateImageError
          );
          console.error("Image ID:", image.id);
          console.error("Display order:", image.display_order);
          console.error(
            "Full error details:",
            JSON.stringify(updateImageError, null, 2)
          );
          setError(`Failed to update image order: ${updateImageError.message}`);
          setLoading(false);
          return;
        }
      }

      console.log("All image display orders updated successfully");

      // Verify the updates were actually saved
      const existingImageIds = imagesToUpdate
        .filter((img) => !img.isNew)
        .map((img) => img.id!);

      if (existingImageIds.length > 0) {
        const { data: verifyData, error: verifyError } = await supabase
          .from("recipe_images")
          .select("id, display_order")
          .in("id", existingImageIds);
      }

      // Upload new images with their correct display_order from unified list
      const newImagesToUpload = imagesToUpdate.filter((img) => img.isNew);

      if (newImagesToUpload.length > 0) {
        for (let i = 0; i < newImagesToUpload.length; i++) {
          const image = newImagesToUpload[i];
          const file = image.file!;
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
            setError(`Failed to upload image ${file.name}`);
            setLoading(false);
            return;
          }

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("recipe-images").getPublicUrl(filePath);

          // Insert image record with the correct display_order from unified list
          const { error: insertError } = await supabase
            .from("recipe_images")
            .insert({
              recipe_id: recipe.id,
              image_url: publicUrl,
              storage_path: filePath,
              display_order: image.display_order,
            });

          if (insertError) {
            console.error("Error inserting image record:", insertError);
            setError(`Failed to save image ${file.name}`);
            setLoading(false);
            return;
          }
        }
      }

      // Force hard navigation to bypass cache
      router.push(`/recipes/${recipe.id}?t=${Date.now()}`);
    } catch (err) {
      console.error("Error updating recipe:", err);
      setError("Failed to update recipe. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-xs sm:text-sm p-3 rounded-md">
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
        <p className="text-xs text-muted-foreground mt-1">
          Markdown formatting supported (e.g., **bold**, *italic*, [link](url))
        </p>
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
        <p className="text-xs text-muted-foreground mt-1">
          Markdown formatting supported (e.g., **bold**, *italic*, # headers,
          [link](url))
        </p>
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
        <ImageEditor
          existingImages={existingImages}
          newImages={newImages}
          onExistingImagesChange={handleExistingImagesChange}
          onNewImagesChange={setNewImages}
          onUnifiedImagesChange={handleUnifiedImagesChange}
          maxImages={10}
          disabled={loading}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
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
