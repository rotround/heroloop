export type Category = "all" | "universal" | "combat" | "speed" | "blast";
export type Role = "owner" | "admin" | "contributor" | "pending" | "user";

export interface CharacterCatalog {
  id: string;
  name: string;
  slug: string;
  aliases: string[];
  category: Exclude<Category, "all">;
  image_url: string | null;
  recommended_uniform: string | null;
  tier: string | null;
  pve_role: string | null;
  meta_status: "meta" | "good" | "normal" | "outdated";
  is_demo: boolean;
  updated_at: string;
  primary_rotation: string | null;
  youtube_video_id: string | null;
  best_ctp: string | null;
  alternative_ctps: string[] | null;
  ctp_id: string | null;
  ctp_image_url: string | null;
  secondary_ctp_id: string | null;
  secondary_ctp_name: string | null;
  secondary_ctp_image_url: string | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: Role;
  access_requested: boolean;
}

export interface Portrait {
  id: string;
  storage_path: string;
  file_name: string;
  character_key: string;
  variant_number: number;
  public_url: string;
}

export interface Ctp {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  storage_path: string | null;
}

export interface AdminCharacter {
  id: string;
  name: string;
  slug: string;
  category: Exclude<Category, "all">;
  image_url: string | null;
  recommended_uniform: string | null;
  pve_role: string | null;
  meta_status: "meta" | "good" | "normal" | "outdated";
  is_published: boolean;
  rotations: Array<{
    id: string;
    rotation_text: string;
    youtube_url: string | null;
  }> | null;
  ctp_recommendations: Array<{
    id: string;
    ctp_id: string | null;
    best_ctp: string;
    secondary_ctp_id: string | null;
  }> | null;
}

export interface AccessRequest {
  id: string;
  user_id: string;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}
