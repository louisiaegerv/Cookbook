import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import EditRecipeForm from "./edit-form";

export default async function EditRecipePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !recipe) {
    notFound();
  }

  const typedRecipe = recipe as RecipeWithImages;

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link href={`/recipes/${params.id}`}>
            <button className="px-3 py-2 rounded-md hover:bg-muted transition-colors">
              Cancel
            </button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-4xl">
        <EditRecipeForm recipe={recipe} />
      </main>
    </div>
  );
}
