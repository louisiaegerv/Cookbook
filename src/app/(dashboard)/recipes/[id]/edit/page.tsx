import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import EditRecipeForm from "./edit-form";
import { RecipeWithRelations } from "@/lib/types/recipe";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center">
          <Link href={`/recipes/${id}`}>
            <button className="px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm sm:text-base">
              Cancel
            </button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 sm:py-8 max-w-4xl">
        <EditRecipeForm recipe={recipe} />
      </main>
    </div>
  );
}
