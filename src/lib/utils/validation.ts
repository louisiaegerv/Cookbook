import { z } from "zod";

export const recipeSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  ingredients: z
    .array(z.string().min(1, "Ingredient cannot be empty"))
    .min(1, "At least one ingredient is required"),
  instructions: z.string().min(1, "Instructions are required"),
  cooking_time: z.number().min(0, "Cooking time must be positive").optional(),
  category_id: z.string().uuid("Invalid category ID").optional(),
  collection_ids: z.array(z.string().uuid("Invalid collection ID")).optional(),
  tag_ids: z.array(z.string().uuid("Invalid tag ID")).optional(),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
  color: z
    .string()
    .regex(
      /^#[0-9A-F]{6}$/i,
      "Invalid color format. Use hex format like #6366f1"
    ),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const collectionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

export type CollectionFormData = z.infer<typeof collectionSchema>;

export const tagSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
  color: z
    .string()
    .regex(
      /^#[0-9A-F]{6}$/i,
      "Invalid color format. Use hex format like #10b981"
    ),
});

export type TagFormData = z.infer<typeof tagSchema>;
