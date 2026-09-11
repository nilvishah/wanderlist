import type { ColorFamily, Scene } from "./types";

export interface Family {
  main: string;
  deep: string;
  tint: string;
  label: string;
}

export const FAMILIES: Record<ColorFamily, Family> = {
  terracotta: { main: "#D85A30", deep: "#993C1D", tint: "#FAECE7", label: "Terracotta" },
  teal:       { main: "#1D9E75", deep: "#0F6E56", tint: "#E1F5EE", label: "Teal" },
  amber:      { main: "#BA7517", deep: "#854F0B", tint: "#FAEEDA", label: "Amber" },
  pink:       { main: "#D4537E", deep: "#993556", tint: "#FBEAF0", label: "Dusty pink" },
  blue:       { main: "#378ADD", deep: "#185FA5", tint: "#E6F1FB", label: "Sky" },
};

export const COLOR_ORDER: ColorFamily[] = ["terracotta", "teal", "amber", "pink", "blue"];

export const SCENES: { value: Scene; label: string }[] = [
  { value: "hike", label: "Mountains" },
  { value: "beach", label: "Beach" },
  { value: "city", label: "City" },
  { value: "culture", label: "Landmark" },
  { value: "other", label: "Open road" },
];

export const SCENE_DEFAULT_COLOR: Record<Scene, ColorFamily> = {
  hike: "terracotta",
  beach: "teal",
  city: "amber",
  culture: "pink",
  other: "blue",
};

export const STAR_COLOR = "#E8A317";

export function family(color?: string | null): Family {
  return FAMILIES[(color as ColorFamily) ?? "terracotta"] ?? FAMILIES.terracotta;
}