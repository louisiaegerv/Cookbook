import { Recipe, RecipeImage, Tag } from "./recipe";

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionWithRecipes extends Collection {
  recipe_collections?: {
    recipes: RecipeWithCollectionImages;
  }[];
  recipe_count?: number;
}

export interface RecipeWithCollectionImages {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string;
  cooking_time?: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  recipe_images?: {
    id: string;
    image_url: string;
  }[];
  recipe_tags?: {
    tags: Tag;
  }[];
}

export interface CollectionFormData {
  name: string;
  description?: string;
}
