export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string;
  cooking_time: number | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeWithRelations extends Recipe {
  images?: RecipeImage[];
  tags?: Tag[];
  category?: Category;
  collections?: Collection[];
}

export interface RecipeImage {
  id: string;
  recipe_id: string;
  image_url: string;
  storage_path: string;
  display_order: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
