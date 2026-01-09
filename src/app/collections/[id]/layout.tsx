import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  // Fetch collection with recipes and images
  const { data: collection } = await supabase
    .from("collections")
    .select(
      `
      *,
      recipe_collections (
        recipes (
          *,
          recipe_images (
            image_url,
            display_order
          )
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (!collection) {
    return {
      title: "Collection Not Found",
    };
  }

  // Get the first image from the first recipe (sorted by display_order)
  const recipes =
    collection.recipe_collections?.map((rc: { recipes: any }) => rc.recipes) ||
    [];
  let firstImage: string | undefined;

  if (recipes.length > 0) {
    const firstRecipe = recipes[0];
    if (firstRecipe.recipe_images && firstRecipe.recipe_images.length > 0) {
      firstImage = firstRecipe.recipe_images.sort(
        (a: { display_order?: number }, b: { display_order?: number }) =>
          (a.display_order || 0) - (b.display_order || 0)
      )?.[0]?.image_url;
    }
  }

  // Get site URL from environment or use default
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const collectionUrl = `${siteUrl}/collections/${id}`;

  return {
    title: collection.name,
    description:
      collection.description?.substring(0, 160) ||
      `View collection: ${collection.name} with ${recipes.length} recipe${
        recipes.length !== 1 ? "s" : ""
      }`,
    openGraph: {
      title: collection.name,
      description:
        collection.description?.substring(0, 160) ||
        `View collection: ${collection.name} with ${recipes.length} recipe${
          recipes.length !== 1 ? "s" : ""
        }`,
      url: collectionUrl,
      siteName: "Cookbook",
      images: firstImage
        ? [
            {
              url: firstImage,
              width: 1200,
              height: 630,
              alt: collection.name,
            },
          ]
        : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: collection.name,
      description:
        collection.description?.substring(0, 160) ||
        `View collection: ${collection.name} with ${recipes.length} recipe${
          recipes.length !== 1 ? "s" : ""
        }`,
      images: firstImage ? [firstImage] : [],
    },
  };
}

export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
