export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string;
  cooking_time: number | null;
  view_count: number;
  source_id: string | null;
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

export interface TikTokAuthor {
  id: string;
  unique_id: string;
  avatar_thumb: string | null;
  nickname: string | null;
  verified: boolean;
  follower_count: number;
  created_at: string;
}

export interface TikTokVideoMetadata {
  id: string;
  recipe_id: string;
  source_id: string;
  author_id: string;
  video_id: string;
  description: string | null;
  cover_url: string | null;
  dynamic_cover_url: string | null;
  video_url: string | null;
  suggested_words: string[] | null;
  music_title: string | null;
  music_author: string | null;
  play_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  video_duration: number;
  created_at: string;
}

export interface RecipeSource {
  id: string;
  name: string;
  url: string | null;
  created_at: string;
}

export interface RecipeWithTikTokData extends Recipe {
  tiktok_author?: TikTokAuthor;
  tiktok_video_metadata?: TikTokVideoMetadata;
}
