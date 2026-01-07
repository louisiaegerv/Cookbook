import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FolderOpen } from "lucide-react";
import Link from "next/link";
import CollectionsClient from "./collections-client";
import { CollectionWithRecipes } from "@/lib/types/collection";
import { redirect } from "next/navigation";

export default async function CollectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's collections with their recipes and images
  const { data: collections } = await supabase
    .from("collections")
    .select(
      `
      *,
      recipe_collections (
        recipes (
          id,
          title,
          recipe_images (
            id,
            image_url
          )
        )
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-6 px-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">My Collections</h1>
          <Link
            href="/collections/new"
            className="hidden sm:block w-full sm:w-auto"
          >
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </Link>
        </div>

        {!collections || collections.length === 0 ? (
          <Card className="text-center py-8 sm:py-12 px-4 sm:px-6">
            <div className="space-y-4">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl sm:text-2xl font-bold">
                No collections yet
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Create your first collection to organize your recipes
              </p>
              <Link
                href="/collections/new"
                className="hidden sm:block w-full sm:w-auto"
              >
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Collection
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground sm:hidden">
                Use the + button in the bottom navigation to create a collection
              </p>
            </div>
          </Card>
        ) : (
          <CollectionsClient
            collections={collections as CollectionWithRecipes[]}
          />
        )}
      </div>
    </div>
  );
}
