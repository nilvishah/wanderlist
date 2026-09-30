import { supabase } from "./supabase";
import type { Category, Scene, SearchResult } from "./types";

// ---------- Google Places search (via the places-search Edge Function) ----------

export async function searchPlaces(query: string): Promise<SearchResult[]> {
  const { data, error } = await supabase.functions.invoke("places-search", { body: { query } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return (data?.results ?? []) as SearchResult[];
}

// ---------- AI (via the ai Edge Function) ----------

interface PlaceInfo {
  name: string;
  location?: string | null;
  category?: string | null;
}

async function callAI<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("ai", { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export async function aiDescribe(place: PlaceInfo): Promise<string> {
  const data = await callAI<{ description: string }>({ action: "describe", ...place });
  return data.description;
}

export async function aiPlan(place: PlaceInfo): Promise<string[]> {
  const data = await callAI<{ items: string[] }>({ action: "plan", ...place });
  return data.items ?? [];
}

export async function aiCategorize(input: {
  name: string;
  address: string;
  types: string[];
  categories: Category[];
}): Promise<string | null> {
  const data = await callAI<{ categoryId: string | null }>({
    action: "categorize",
    name: input.name,
    address: input.address,
    types: input.types,
    categories: input.categories.map((c) => ({ id: c.id, name: c.name, scene: c.scene })),
  });
  return data.categoryId;
}

// ---------- Simple rules (instant, no AI needed) ----------

const RULES: { scene: Scene; types: string[] }[] = [
  { scene: "hike", types: ["hiking_area", "natural_feature", "national_park", "campground", "mountain"] },
  { scene: "beach", types: ["beach", "marina"] },
  { scene: "city", types: ["locality", "administrative_area_level_1", "administrative_area_level_2", "sublocality", "neighborhood"] },
  { scene: "culture", types: ["museum", "tourist_attraction", "church", "hindu_temple", "place_of_worship", "art_gallery", "historical_landmark"] },
];

export function suggestCategoryByType(types: string[], categories: Category[]): Category | undefined {
  if (!categories.length) return undefined;
  const set = new Set(types);
  for (const rule of RULES) {
    if (rule.types.some((t) => set.has(t))) {
      const match = categories.find((c) => c.scene === rule.scene);
      if (match) return match;
    }
  }
  return (
    categories.find((c) => c.scene === "other") ??
    categories.find((c) => c.scene === "culture") ??
    categories[0]
  );
}