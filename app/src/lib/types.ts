export type ColorFamily = "terracotta" | "teal" | "amber" | "pink" | "blue";
export type Scene = "hike" | "beach" | "city" | "culture" | "other";

export interface Category {
  id: string;
  name: string;
  color: ColorFamily;
  scene: Scene;
  sort_order: number;
  created_at: string;
}

export interface Place {
  id: string;
  category_id: string;
  name: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  google_place_id: string | null;
  starred: boolean;
  description: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  place_id: string;
  text: string;
  is_checked: boolean;
  sort_order: number;
  created_at: string;
}

export interface SearchResult {
  googlePlaceId: string;
  name: string;
  address: string;
  location: string;
  lat: number | null;
  lng: number | null;
  types: string[];
  photoUrl: string | null;
}