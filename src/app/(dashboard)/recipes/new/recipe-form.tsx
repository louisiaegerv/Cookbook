"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import ImageUploader from "@/components/ui/image-uploader";
import {
  Save,
  Loader2,
  Download,
  X,
  ExternalLink,
  Plus,
  X as XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// TypeScript interfaces for TikTok data
interface TikTokVideoData {
  author: {
    uniqueId: string;
    avatarThumb: string;
    nickname: string;
  };
  suggestedWords: string[];
  description: string;
  coverUrl: string;
  dynamicCoverUrl: string;
  videoUrl: string;
  videoId: string;
}

interface ParsedRecipeData {
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
  }>;
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  tags: string[];
  notes?: string;
}

interface ScrapeResponse {
  success: boolean;
  data?: TikTokVideoData;
  error?: string;
}

interface ParseResponse {
  success: boolean;
  data?: {
    recipe: ParsedRecipeData;
    tiktokAuthor?: {
      uniqueId: string;
      nickname: string;
      avatarThumb: string;
    };
    tiktokVideoMetadata?: {
      videoId: string;
      videoUrl: string;
      coverUrl: string;
      dynamicCoverUrl: string;
      description: string;
      suggestedWords: string[];
      musicTitle: string;
      musicAuthor: string;
      playCount: number;
      likeCount: number;
      shareCount: number;
      commentCount: number;
      videoDuration: number;
    };
  };
  error?: string;
}

export default function RecipeForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // TikTok import state
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [tiktokData, setTiktokData] = useState<TikTokVideoData | null>(null);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipeData | null>(
    null
  );
  const [tiktokMetadata, setTiktokMetadata] = useState<any>(null);
  const [importStep, setImportStep] = useState<
    "idle" | "scraping" | "parsing" | "complete"
  >("idle");

  // Tag management functions
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  // Form refs for programmatic updates
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const ingredientsRef = useRef<HTMLTextAreaElement>(null);
  const instructionsRef = useRef<HTMLTextAreaElement>(null);
  const cookingTimeRef = useRef<HTMLInputElement>(null);

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

  const downloadAndUploadTikTokImage = async (
    imageUrl: string
  ): Promise<{ url: string; path: string } | null> => {
    try {
      // Download the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error("Failed to download TikTok image:", response.statusText);
        return null;
      }

      const blob = await response.blob();
      const file = new File([blob], "tiktok-cover.jpg", { type: "image/jpeg" });

      // Upload to Supabase storage
      const fileExt = "jpg";
      const fileName = `tiktok-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading TikTok image:", uploadError);
        return null;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("recipe-images").getPublicUrl(filePath);

      return { url: publicUrl, path: filePath };
    } catch (error) {
      console.error("Error downloading TikTok image:", error);
      return null;
    }
  };

  const handleImportFromTikTok = async () => {
    if (!tiktokUrl.trim()) {
      setImportError("Please enter a TikTok URL");
      return;
    }

    // Validate TikTok URL format
    const tiktokUrlPatterns = [
      /^https?:\/\/(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/[\d]+/,
      /^https?:\/\/(?:www\.)?tiktok\.com\/t\/[\w]+/,
      /^https?:\/\/(?:www\.)?tiktok\.com\/v\/[\d]+/,
    ];

    if (!tiktokUrlPatterns.some((pattern) => pattern.test(tiktokUrl))) {
      setImportError("Invalid TikTok URL format");
      return;
    }

    setImporting(true);
    setImportError("");
    setTiktokData(null);
    setParsedRecipe(null);
    setImportStep("scraping");

    try {
      // Step 1: Scrape TikTok video data
      const scrapeResponse = await fetch("/api/tiktok/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tiktokUrl }),
      });

      const scrapeData: ScrapeResponse = await scrapeResponse.json();

      if (!scrapeData.success || !scrapeData.data) {
        throw new Error(scrapeData.error || "Failed to scrape TikTok video");
      }

      setTiktokData(scrapeData.data);

      // Step 2: Parse recipe data using AI
      setImportStep("parsing");
      const parseResponse = await fetch("/api/tiktok/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoData: scrapeData.data }),
      });

      const parseData: ParseResponse = await parseResponse.json();

      if (!parseData.success || !parseData.data) {
        throw new Error(parseData.error || "Failed to parse recipe data");
      }

      // Extract recipe data from the new nested structure
      const recipeData = (parseData.data as any).recipe || parseData.data;

      setParsedRecipe(recipeData);

      // Store TikTok metadata for later use when saving
      setTiktokMetadata(parseData.data);

      setImportStep("complete");

      // Populate form fields with parsed data
      populateFormFields(recipeData);
    } catch (err) {
      console.error("TikTok import error:", err);
      setImportError(
        err instanceof Error ? err.message : "Failed to import from TikTok"
      );
      setImportStep("idle");
    } finally {
      setImporting(false);
    }
  };

  const populateFormFields = (recipeData: ParsedRecipeData) => {
    // Populate title
    if (titleRef.current && recipeData.title) {
      titleRef.current.value = recipeData.title;
    }

    // Populate description
    if (descriptionRef.current && recipeData.description) {
      descriptionRef.current.value = recipeData.description;
    }

    // Populate ingredients (format as "quantity unit name" per line)
    if (ingredientsRef.current && recipeData.ingredients) {
      const ingredientsText = recipeData.ingredients
        .map((ing) => {
          const parts = [ing.quantity, ing.unit, ing.name].filter(Boolean);
          return parts.join(" ");
        })
        .join("\n");
      ingredientsRef.current.value = ingredientsText;
    }

    // Populate instructions (format as numbered list)
    if (instructionsRef.current && recipeData.instructions) {
      const instructionsText = recipeData.instructions
        .map((inst, idx) => `${idx + 1}. ${inst}`)
        .join("\n");
      instructionsRef.current.value = instructionsText;
    }

    // Parse and populate cooking time (combine prep and cook time)
    if (
      cookingTimeRef.current &&
      (recipeData.prepTime || recipeData.cookTime)
    ) {
      const totalMinutes =
        parseTimeToMinutes(recipeData.prepTime) +
        parseTimeToMinutes(recipeData.cookTime);
      if (totalMinutes > 0) {
        cookingTimeRef.current.value = totalMinutes.toString();
      }
    }

    // Populate tags
    if (recipeData.tags && recipeData.tags.length > 0) {
      setTags(recipeData.tags);
    }
  };

  const parseTimeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const hours = timeStr.match(/(\d+)\s*hour/i)?.[1];
    const minutes = timeStr.match(/(\d+)\s*min/i)?.[1];
    return parseInt(hours || "0") * 60 + parseInt(minutes || "0");
  };

  const clearTikTokImport = () => {
    setTiktokUrl("");
    setTiktokData(null);
    setParsedRecipe(null);
    setTiktokMetadata(null);
    setImportError("");
    setTags([]);
    setImportStep("idle");
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

      // If no images uploaded but TikTok metadata is available, download the cover image
      if (uploadedImages.length === 0 && tiktokMetadata?.tiktokVideoMetadata) {
        const tiktokImage = await downloadAndUploadTikTokImage(
          tiktokMetadata.tiktokVideoMetadata.dynamicCoverUrl ||
            tiktokMetadata.tiktokVideoMetadata.coverUrl
        );
        if (tiktokImage) {
          uploadedImages.push(tiktokImage);
        }
      }

      // Prepare recipe data
      const recipeInsertData: any = {
        user_id: user.id,
        title,
        description: description || null,
        ingredients: ingredientsArray,
        instructions,
        cooking_time: cookingTime ? parseInt(cookingTime) : null,
      };

      // Add source_id if TikTok metadata is available
      if (tiktokMetadata) {
        // Get TikTok source ID
        const { data: sourceData } = await supabase
          .from("recipe_sources")
          .select("id")
          .eq("source_type", "tiktok")
          .single();

        if (sourceData) {
          recipeInsertData.source_id = sourceData.id;
        }
      }

      // Create recipe
      const { data: recipeData, error: insertError } = await supabase
        .from("recipes")
        .insert(recipeInsertData)
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

      // Create TikTok metadata if available
      if (tiktokMetadata && recipeData) {
        try {
          // Get or create TikTok author
          const { data: authorData } = await supabase.rpc(
            "get_or_create_tiktok_author",
            {
              p_unique_id: tiktokMetadata.tiktokAuthor?.uniqueId || "",
              p_nickname: tiktokMetadata.tiktokAuthor?.nickname || "",
              p_avatar_thumb: tiktokMetadata.tiktokAuthor?.avatarThumb || "",
            }
          );

          // Create video metadata
          const { data: sourceData } = await supabase
            .from("recipe_sources")
            .select("id")
            .eq("source_type", "tiktok")
            .single();

          if (sourceData && authorData && tiktokMetadata.tiktokVideoMetadata) {
            await supabase.from("tiktok_video_metadata").insert({
              recipe_id: recipeData.id,
              source_id: sourceData.id,
              author_id: authorData,
              video_id: tiktokMetadata.tiktokVideoMetadata.videoId,
              video_url: tiktokMetadata.tiktokVideoMetadata.videoUrl,
              cover_image_url: tiktokMetadata.tiktokVideoMetadata.coverUrl,
              dynamic_cover_url:
                tiktokMetadata.tiktokVideoMetadata.dynamicCoverUrl,
              description: tiktokMetadata.tiktokVideoMetadata.description,
              suggested_words:
                tiktokMetadata.tiktokVideoMetadata.suggestedWords,
              music_title: tiktokMetadata.tiktokVideoMetadata.musicTitle,
              music_author: tiktokMetadata.tiktokVideoMetadata.musicAuthor,
              play_count: tiktokMetadata.tiktokVideoMetadata.playCount,
              like_count: tiktokMetadata.tiktokVideoMetadata.likeCount,
              share_count: tiktokMetadata.tiktokVideoMetadata.shareCount,
              comment_count: tiktokMetadata.tiktokVideoMetadata.commentCount,
              video_duration: tiktokMetadata.tiktokVideoMetadata.videoDuration,
            });
          }
        } catch (metadataError) {
          console.error("Error creating TikTok metadata:", metadataError);
          // Don't fail the whole operation if metadata creation fails
        }
      }

      // Create tags if any
      if (tags.length > 0 && recipeData) {
        try {
          // Get user ID
          const userId = user.id;

          // Create or get tags and link them to the recipe
          for (const tagName of tags) {
            // Check if tag already exists
            const { data: existingTag } = await supabase
              .from("tags")
              .select("id")
              .eq("user_id", userId)
              .eq("name", tagName)
              .single();

            let tagId: string;

            if (existingTag) {
              tagId = existingTag.id;
            } else {
              // Create new tag
              const { data: newTag } = await supabase
                .from("tags")
                .insert({
                  user_id: userId,
                  name: tagName,
                  color: "#10b981", // Default green color
                })
                .select()
                .single();

              if (newTag) {
                tagId = newTag.id;
              } else {
                continue;
              }
            }

            // Link tag to recipe
            await supabase.from("recipe_tags").insert({
              recipe_id: recipeData.id,
              tag_id: tagId,
            });
          }
        } catch (tagError) {
          console.error("Error saving tags:", tagError);
          // Don't fail the whole operation if tag creation fails
        }
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
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-xs sm:text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      {/* TikTok Import Section */}
      <div className="space-y-4 p-4 sm:p-6 bg-muted/50 rounded-lg border-2 border-dashed">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Import from TikTok</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Paste a TikTok video URL to automatically import recipe data
            </p>
          </div>
          {tiktokData && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearTikTokImport}
              disabled={loading || importing}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        {importing && importStep === "scraping" ? (
          <div className="bg-background border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="absolute inset-0 h-5 w-5 animate-ping rounded-full bg-primary/20" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Scraping TikTok video...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fetching video information from TikTok...
                </p>
              </div>
            </div>
          </div>
        ) : tiktokData && (importing || !parsedRecipe) ? (
          /* TikTok Preview + Loading during parsing */
          <div className="space-y-4">
            {/* Loading indicator for parsing */}
            {importing && (
              <div className="bg-background border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <div className="absolute inset-0 h-5 w-5 animate-ping rounded-full bg-primary/20" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {importStep === "parsing" && "Parsing recipe with AI..."}
                      {importStep === "complete" && "Almost done..."}
                    </p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            importStep === "parsing" ||
                            importStep === "complete"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {(importStep === "parsing" ||
                            importStep === "complete") && (
                            <span className="text-xs">✓</span>
                          )}
                        </div>
                        <span>Scrape video data</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            importStep === "parsing" ||
                            importStep === "complete"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {importStep === "complete" && (
                            <span className="text-xs">✓</span>
                          )}
                          {importStep === "parsing" && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                        </div>
                        <span>Parse recipe data</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {importStep === "parsing" &&
                    "Analyzing video content to extract recipe details... This may take a moment."}
                  {importStep === "complete" && "Finalizing import..."}
                </p>
              </div>
            )}

            {/* TikTok Preview */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Video Preview */}
              <div className="flex-shrink-0">
                <div className="relative w-32 h-56 sm:w-40 sm:h-64 bg-black rounded-lg overflow-hidden">
                  <img
                    src={tiktokData.dynamicCoverUrl || tiktokData.coverUrl}
                    alt="TikTok video cover"
                    className="w-full h-full object-cover"
                  />
                  <a
                    href={tiktokData.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="h-6 w-6 text-white" />
                  </a>
                </div>
              </div>

              {/* Author Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={tiktokData.author.avatarThumb}
                    alt={tiktokData.author.nickname}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-sm">
                      {tiktokData.author.nickname}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{tiktokData.author.uniqueId}
                    </p>
                  </div>
                </div>

                {tiktokData.suggestedWords &&
                  tiktokData.suggestedWords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tiktokData.suggestedWords
                        .slice(0, 5)
                        .map((word, idx) => {
                          const isAdded = tags.includes(word);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (!isAdded) {
                                  addTag(word);
                                } else {
                                  removeTag(word);
                                }
                              }}
                              disabled={loading}
                              className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                isAdded
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-primary/10 text-primary hover:bg-primary/20"
                              }`}
                            >
                              {word}
                            </button>
                          );
                        })}
                    </div>
                  )}

                {tiktokData.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {tiktokData.description}
                  </p>
                )}

                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View original video
                </a>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-background p-3 rounded-md">
              <p className="font-medium mb-1">
                {importing
                  ? "Video data loaded. Parsing recipe details..."
                  : "✓ Recipe data imported successfully"}
              </p>
              <p>
                {importing
                  ? "Review the preview above while we extract recipe information."
                  : "Review and edit the form below before saving."}
              </p>
            </div>
          </div>
        ) : !tiktokData ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="url"
              placeholder="https://www.tiktok.com/@username/video/123456789"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              disabled={loading || importing}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleImportFromTikTok}
              disabled={loading || importing || !tiktokUrl.trim()}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>
        ) : (
          /* TikTok Preview */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Video Preview */}
              <div className="flex-shrink-0">
                <div className="relative w-32 h-56 sm:w-40 sm:h-64 bg-black rounded-lg overflow-hidden">
                  <img
                    src={tiktokData.dynamicCoverUrl || tiktokData.coverUrl}
                    alt="TikTok video cover"
                    className="w-full h-full object-cover"
                  />
                  <a
                    href={tiktokData.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="h-6 w-6 text-white" />
                  </a>
                </div>
              </div>

              {/* Author Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={tiktokData.author.avatarThumb}
                    alt={tiktokData.author.nickname}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-sm">
                      {tiktokData.author.nickname}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{tiktokData.author.uniqueId}
                    </p>
                  </div>
                </div>

                {tiktokData.suggestedWords &&
                  tiktokData.suggestedWords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tiktokData.suggestedWords
                        .slice(0, 5)
                        .map((word, idx) => {
                          const isAdded = tags.includes(word);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (!isAdded) {
                                  addTag(word);
                                } else {
                                  removeTag(word);
                                }
                              }}
                              disabled={loading}
                              className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                isAdded
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-primary/10 text-primary hover:bg-primary/20"
                              }`}
                            >
                              {word}
                            </button>
                          );
                        })}
                    </div>
                  )}

                {tiktokData.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {tiktokData.description}
                  </p>
                )}

                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View original video
                </a>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-background p-3 rounded-md">
              <p className="font-medium mb-1 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                  ✓
                </span>
                Recipe data imported successfully
              </p>
              <p>Review and edit the form below before saving.</p>
            </div>
          </div>
        )}

        {importError && (
          <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-md">
            {importError}
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          ref={titleRef}
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
          ref={descriptionRef}
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
          ref={ingredientsRef}
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
          ref={instructionsRef}
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
          ref={cookingTimeRef}
          type="number"
          placeholder="e.g., 30"
          min="0"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Type a tag and press Enter"
            disabled={loading}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => addTag(tagInput)}
            disabled={loading || !tagInput.trim()}
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  disabled={loading}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Press Enter or click + button to add a tag
        </p>
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
              Save Recipe
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
