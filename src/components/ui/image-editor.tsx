"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  GripVertical,
} from "lucide-react";
import { Button } from "./button";
import { createClient } from "@/lib/supabase/client";

interface ExistingImage {
  id: string;
  recipe_id: string;
  image_url: string;
  storage_path: string;
  display_order: number | null;
}

interface ImageEditorProps {
  existingImages: ExistingImage[];
  newImages: File[];
  onExistingImagesChange: (images: ExistingImage[]) => void;
  onNewImagesChange: (images: File[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export default function ImageEditor({
  existingImages,
  newImages,
  onExistingImagesChange,
  onNewImagesChange,
  maxImages = 10,
  disabled = false,
}: ImageEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const supabase = createClient();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (disabled) return;

      const totalImages = existingImages.length + newImages.length;

      // Filter out duplicates
      const newFiles = acceptedFiles.filter(
        (file) =>
          !newImages.some(
            (img) => img.name === file.name && img.size === file.size
          )
      );

      // Check max images limit
      if (totalImages + newFiles.length > maxImages) {
        alert(`You can only have up to ${maxImages} images total`);
        return;
      }

      onNewImagesChange([...newImages, ...newFiles]);
    },
    [existingImages, newImages, onNewImagesChange, maxImages, disabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: maxImages - existingImages.length - newImages.length,
    disabled: disabled || existingImages.length + newImages.length >= maxImages,
  });

  const removeExistingImage = async (imageId: string) => {
    if (disabled) return;

    const imageToRemove = existingImages.find((img) => img.id === imageId);
    if (!imageToRemove) return;

    // Delete from database
    const { error: deleteDbError } = await supabase
      .from("recipe_images")
      .delete()
      .eq("id", imageId);

    if (deleteDbError) {
      console.error("Error deleting image from database:", deleteDbError);
      alert("Failed to delete image record. Please try again.");
      return;
    }

    // Delete from storage
    const { error: deleteStorageError } = await supabase.storage
      .from("recipe-images")
      .remove([imageToRemove.storage_path]);

    if (deleteStorageError) {
      console.error("Error deleting image from storage:", deleteStorageError);
      // Don't return here - we've already deleted from DB, so continue
    }

    // Remove from state
    onExistingImagesChange(existingImages.filter((img) => img.id !== imageId));
  };

  const removeNewImage = (index: number) => {
    if (disabled) return;
    onNewImagesChange(newImages.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (disabled) return;

    const updatedImages = [...existingImages];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);

    // Update display_order for all images
    const imagesWithOrder = updatedImages.map((img, index) => ({
      ...img,
      display_order: index,
    }));

    onExistingImagesChange(imagesWithOrder);
  };

  const uploadNewImages = async (): Promise<string[]> => {
    if (newImages.length === 0) return [];
    if (disabled) return [];

    setUploading(true);
    setUploadProgress(0);

    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];
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

        uploadedUrls.push(publicUrl);

        setUploadProgress(((i + 1) / newImages.length) * 100);
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary hover:bg-muted/50"
        } ${
          disabled || totalImages >= maxImages
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-sm font-medium">Uploading images...</p>
              <div className="w-full max-w-xs bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {uploadProgress.toFixed(0)}% complete
              </p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {isDragActive
                    ? "Drop the images here"
                    : "Drag & drop images here, or click to select"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF, WebP up to 5MB each
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Existing images */}
      {existingImages.length > 0 && (
        <div className="space-y-2">
          <Label>Existing Images</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingImages
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .map((image, index) => (
                <div
                  key={image.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border"
                >
                  <img
                    src={image.image_url}
                    alt={`Recipe image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {!disabled && (
                    <>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-7 w-7 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeExistingImage(image.id)}
                      >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      {existingImages.length > 1 && (
                        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            disabled={index === 0}
                            onClick={() => moveImage(index, index - 1)}
                          >
                            <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            disabled={index === existingImages.length - 1}
                            onClick={() => moveImage(index, index + 1)}
                          >
                            <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* New images */}
      {newImages.length > 0 && (
        <div className="space-y-2">
          <Label>New Images</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {newImages.map((image, index) => (
              <div
                key={`${image.name}-${index}`}
                className="relative group aspect-square rounded-lg overflow-hidden border border-primary"
              >
                <img
                  src={URL.createObjectURL(image)}
                  alt={`New upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {!disabled && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-7 w-7 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeNewImage(index)}
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] sm:text-xs p-1.5 sm:p-2 truncate">
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status indicator */}
      {totalImages > 0 && !uploading && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>
            {totalImages} of {maxImages} images ({existingImages.length}{" "}
            existing, {newImages.length} new)
          </span>
        </div>
      )}
    </div>
  );
}

export { uploadNewImages as uploadNewImagesHelper };

async function uploadNewImages(images: File[]): Promise<string[]> {
  const supabase = createClient();
  const uploadedUrls: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const file = images[i];
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

    uploadedUrls.push(publicUrl);
  }

  return uploadedUrls;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {children}
    </label>
  );
}
