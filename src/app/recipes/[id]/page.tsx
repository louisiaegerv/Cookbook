import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  Trash2,
  Edit,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Play,
  Music,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteRecipeButton from "@/components/ui/delete-recipe-button";
import {
  RecipeWithRelations,
  Tag,
  RecipeImage,
  Collection,
  TikTokAuthor,
  TikTokVideoMetadata,
  RecipeSource,
} from "@/lib/types/recipe";
import RecipeTags from "@/components/ui/recipe-tags";
import RecipeCollections from "@/components/ui/recipe-collections";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  // Fetch recipe with images
  const { data: recipe } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_images (
        image_url,
        display_order
      )
    `
    )
    .eq("id", id)
    .single();

  if (!recipe) {
    return {
      title: "Recipe Not Found",
    };
  }

  // Get the first image (sorted by display_order)
  const firstImage = recipe.recipe_images?.sort(
    (a: { display_order?: number }, b: { display_order?: number }) =>
      (a.display_order || 0) - (b.display_order || 0)
  )?.[0]?.image_url;

  // Get site URL from environment or use default
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const recipeUrl = `${siteUrl}/recipes/${id}`;

  return {
    title: recipe.title,
    description:
      recipe.description?.substring(0, 160) ||
      `View recipe for ${recipe.title}`,
    openGraph: {
      title: recipe.title,
      description:
        recipe.description?.substring(0, 160) ||
        `View recipe for ${recipe.title}`,
      url: recipeUrl,
      siteName: "Cookbook",
      images: firstImage
        ? [
            {
              url: firstImage,
              width: 1200,
              height: 630,
              alt: recipe.title,
            },
          ]
        : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: recipe.title,
      description:
        recipe.description?.substring(0, 160) ||
        `View recipe for ${recipe.title}`,
      images: firstImage ? [firstImage] : [],
    },
  };
}

export default async function PublicRecipeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ collectionId?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Await params to get the id
  const { id } = await params;
  const { collectionId } = await searchParams;

  // Fetch recipe with images, tags, collections, and source (without filtering by user_id for public access)
  const { data: recipe, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_sources (
        id,
        name,
        created_at
      ),
      recipe_images (
        id,
        image_url,
        storage_path,
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
      ),
      recipe_collections (
        collections (
          id,
          user_id,
          name,
          description,
          created_at,
          updated_at
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !recipe) {
    notFound();
  }

  // Increment view count using RPC function (works for both authenticated and unauthenticated users)
  await supabase.rpc("increment_recipe_view_count", { recipe_id: id });

  const typedRecipe = recipe as RecipeWithRelations & {
    recipe_sources?: RecipeSource;
    recipe_tags?: { tags: Tag }[];
    recipe_images?: RecipeImage[];
    recipe_collections?: { collections: Collection }[];
  };

  // Fetch TikTok data if this recipe is from TikTok
  let tiktokAuthor: TikTokAuthor | null = null;
  let tiktokVideoMetadata: TikTokVideoMetadata | null = null;

  if (typedRecipe.recipe_sources?.name?.toLowerCase() === "tiktok") {
    // Fetch TikTok video metadata first
    const { data: videoData } = await supabase
      .from("tiktok_video_metadata")
      .select("*")
      .eq("recipe_id", id)
      .single();

    if (videoData) {
      tiktokVideoMetadata = videoData as TikTokVideoMetadata;

      // Then fetch TikTok author data using the author_id from video metadata
      const { data: authorData } = await supabase
        .from("tiktok_authors")
        .select("*")
        .eq("id", tiktokVideoMetadata.author_id)
        .single();

      if (authorData) {
        tiktokAuthor = authorData as TikTokAuthor;
      }
    }
  }

  typedRecipe.images = typedRecipe.recipe_images;
  const tags = typedRecipe.recipe_tags?.map((rt) => rt.tags) || [];
  const collections =
    typedRecipe.recipe_collections?.map((rc) => rc.collections) || [];

  // Check if current user is the owner
  const isOwner = user && user.id === typedRecipe.user_id;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-6 px-4 max-w-4xl sm:py-8">
        {/* Back button */}
        <Link href={collectionId ? `/collections/${collectionId}` : "/recipes"}>
          <Button variant="ghost" className="mb-4 sm:mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {collectionId ? "Collection" : "Recipes"}
          </Button>
        </Link>

        {/* Images */}
        {typedRecipe.images && typedRecipe.images.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {typedRecipe.images
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((image) => (
                  <div
                    key={image.id}
                    className="aspect-square rounded-lg overflow-hidden border"
                  >
                    <img
                      src={image.image_url}
                      alt={`${typedRecipe.title} photo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recipe header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                {typedRecipe.title}
              </h1>
              {typedRecipe.description && (
                <div className="text-muted-foreground text-lg prose prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {typedRecipe.description}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            {/* Only show edit/delete buttons if user is the owner */}
            {isOwner && (
              <div className="flex gap-2">
                <Link href={`/recipes/${typedRecipe.id}/edit`}>
                  <Button variant="outline" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <DeleteRecipeButton
                  recipeId={typedRecipe.id}
                  recipeTitle={typedRecipe.title}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-muted-foreground mt-4">
            {typedRecipe.cooking_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-lg">
                  {typedRecipe.cooking_time} minutes
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-lg">
                {typedRecipe.view_count || 0} view
                {typedRecipe.view_count !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* TikTok Section */}
        {typedRecipe.recipe_sources?.name?.toLowerCase() === "tiktok" &&
          tiktokAuthor &&
          tiktokVideoMetadata && (
            <Card className="pt-6 mb-6 sm:mb-8 border-t-4 border-t-pink-500 bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-pink-950/20 dark:to-purple-950/20">
              <CardContent className="space-y-6">
                {/* Author, Stats, and Link Row - Desktop: One row, Mobile: Stacked */}
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Author Info */}
                  <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg flex-1">
                    {tiktokAuthor.avatar_thumb && (
                      <img
                        src={tiktokAuthor.avatar_thumb}
                        alt={tiktokAuthor.nickname || tiktokAuthor.unique_id}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-pink-200 dark:border-pink-800 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base sm:text-lg">
                          {tiktokAuthor.nickname || tiktokAuthor.unique_id}
                        </h3>
                        {tiktokAuthor.verified && (
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        @{tiktokAuthor.unique_id}
                      </p>
                    </div>
                  </div>

                  {/* Engagement Stats - Likes and Views only */}
                  <div className="flex gap-3 flex-1">
                    <div className="flex-1 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Heart className="h-4 w-4 text-pink-500" />
                        <span className="text-xl sm:text-2xl font-bold">
                          {tiktokVideoMetadata.like_count &&
                          tiktokVideoMetadata.like_count >= 1000
                            ? `${(
                                tiktokVideoMetadata.like_count / 1000
                              ).toFixed(1)}K`
                            : tiktokVideoMetadata.like_count?.toLocaleString() ||
                              "0"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Likes</p>
                    </div>
                    <div className="flex-1 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Play className="h-4 w-4 text-purple-500" />
                        <span className="text-xl sm:text-2xl font-bold">
                          {tiktokVideoMetadata.play_count &&
                          tiktokVideoMetadata.play_count >= 1000000
                            ? `${(
                                tiktokVideoMetadata.play_count / 1000000
                              ).toFixed(1)}M`
                            : tiktokVideoMetadata.play_count &&
                              tiktokVideoMetadata.play_count >= 1000
                            ? `${(
                                tiktokVideoMetadata.play_count / 1000
                              ).toFixed(1)}K`
                            : tiktokVideoMetadata.play_count?.toLocaleString() ||
                              "0"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </div>
                  </div>

                  {/* Video Link */}
                  {tiktokAuthor.unique_id && (
                    <a
                      href={`https://www.tiktok.com/@${tiktokAuthor.unique_id}/video/${tiktokVideoMetadata.video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors group text-sm flex-1"
                    >
                      <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                        <ExternalLink className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">View on TikTok</p>
                      </div>
                    </a>
                  )}
                </div>

                {/* Embedded Video */}
                {tiktokVideoMetadata.video_id && (
                  <div className="relative w-full rounded-lg overflow-hidden bg-gray-900 shadow-lg">
                    <div className="aspect-[9/16] max-h-[600px] mx-auto">
                      <iframe
                        src={`https://www.tiktok.com/embed/v2/${tiktokVideoMetadata.video_id}`}
                        className="w-full h-full border-0"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title={`TikTok video by @${tiktokAuthor?.unique_id}`}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        {/* Tags */}
        <RecipeTags recipeId={typedRecipe.id} tags={tags} />

        {/* Collections */}
        <RecipeCollections
          recipeId={typedRecipe.id}
          collections={collections}
        />

        {/* Ingredients */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
            <CardDescription>
              {typedRecipe.ingredients.length} item
              {typedRecipe.ingredients.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 sm:space-y-3">
              {typedRecipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-2 sm:gap-3">
                  <span className="text-primary font-semibold min-w-[20px] sm:min-w-[24px] text-sm sm:text-base">
                    {index + 1}.
                  </span>
                  <span className="flex-1 text-sm sm:text-base">
                    {ingredient}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate dark:prose-invert max-w-none prose-sm sm:prose-base">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {typedRecipe.instructions}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
