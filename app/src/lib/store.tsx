import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import type { Category, ColorFamily, Place, Scene } from "./types";
import { useToast } from "../components/Toast";

// ---------- Helpers ----------

export function uuid(): string {
  const c = globalThis.crypto;
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export interface NewPlace {
  category_id: string;
  name: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  google_place_id: string | null;
  photo_url: string | null;
  starred: boolean;
  description?: string | null;
}

export interface NewCategory {
  name: string;
  color: ColorFamily;
  scene: Scene;
}

interface DataState {
  loading: boolean;
  error: string | null;
  categories: Category[];
  places: Place[];
  categoryById: (id: string | undefined) => Category | undefined;
  reload: () => Promise<void>;
  updatePlace: (id: string, patch: Partial<Place>) => Promise<boolean>;
  toggleStar: (id: string) => Promise<void>;
  addPlace: (input: NewPlace) => Promise<Place | null>;
  deletePlace: (id: string) => Promise<void>;
  addCategory: (input: NewCategory) => Promise<Category | null>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const DataContext = createContext<DataState | null>(null);

// ---------- Provider ----------

export function DataProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  // Refs always hold the latest lists, so optimistic updates can roll back safely.
  const placesRef = useRef(places);
  const categoriesRef = useRef(categories);
  placesRef.current = places;
  categoriesRef.current = categories;

  const fail = useCallback(() => toast("Couldn't save that. Try again."), [toast]);

  const reload = useCallback(async () => {
    const [c, p] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order").order("created_at"),
      supabase.from("places").select("*").order("created_at", { ascending: false }),
    ]);
    if (c.error || p.error) {
      setError((c.error ?? p.error)!.message);
    } else {
      setCategories(c.data as Category[]);
      setPlaces(p.data as Place[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  // Load on start, and refresh when you come back to the app
  // (so changes from your other device show up).
  useEffect(() => {
    reload();
    const onVisible = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  const categoryById = useCallback(
    (id: string | undefined) => categories.find((c) => c.id === id),
    [categories]
  );

  // ----- Places -----

  const updatePlace = useCallback(
    async (id: string, patch: Partial<Place>) => {
      const before = placesRef.current.find((p) => p.id === id);
      if (!before) return false;
      setPlaces((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      const { error } = await supabase.from("places").update(patch).eq("id", id);
      if (error) {
        setPlaces((ps) => ps.map((p) => (p.id === id ? before : p)));
        fail();
        return false;
      }
      return true;
    },
    [fail]
  );

  const toggleStar = useCallback(
    async (id: string) => {
      const current = placesRef.current.find((p) => p.id === id);
      if (current) await updatePlace(id, { starred: !current.starred });
    },
    [updatePlace]
  );

  const addPlace = useCallback(
    async (input: NewPlace) => {
      const row: Place = {
        id: uuid(),
        created_at: new Date().toISOString(),
        description: null,
        notes: null,
        ...input,
      };
      setPlaces((ps) => [row, ...ps]);
      const { error } = await supabase.from("places").insert(row);
      if (error) {
        setPlaces((ps) => ps.filter((p) => p.id !== row.id));
        fail();
        return null;
      }
      return row;
    },
    [fail]
  );

  const deletePlace = useCallback(
    async (id: string) => {
      const snapshot = placesRef.current;
      setPlaces((ps) => ps.filter((p) => p.id !== id));
      const { error } = await supabase.from("places").delete().eq("id", id);
      if (error) {
        setPlaces(snapshot);
        fail();
      }
    },
    [fail]
  );

  // ----- Categories -----

  const addCategory = useCallback(
    async (input: NewCategory) => {
      const maxOrder = Math.max(-1, ...categoriesRef.current.map((c) => c.sort_order));
      const row: Category = {
        id: uuid(),
        created_at: new Date().toISOString(),
        sort_order: maxOrder + 1,
        ...input,
      };
      setCategories((cs) => [...cs, row]);
      const { error } = await supabase.from("categories").insert(row);
      if (error) {
        setCategories((cs) => cs.filter((c) => c.id !== row.id));
        fail();
        return null;
      }
      return row;
    },
    [fail]
  );

  const updateCategory = useCallback(
    async (id: string, patch: Partial<Category>) => {
      const before = categoriesRef.current.find((c) => c.id === id);
      if (!before) return;
      setCategories((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      const { error } = await supabase.from("categories").update(patch).eq("id", id);
      if (error) {
        setCategories((cs) => cs.map((c) => (c.id === id ? before : c)));
        fail();
      }
    },
    [fail]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const catSnap = categoriesRef.current;
      const placeSnap = placesRef.current;
      setCategories((cs) => cs.filter((c) => c.id !== id));
      setPlaces((ps) => ps.filter((p) => p.category_id !== id));
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) {
        setCategories(catSnap);
        setPlaces(placeSnap);
        fail();
      }
    },
    [fail]
  );

  const value = useMemo<DataState>(
    () => ({
      loading,
      error,
      categories,
      places,
      categoryById,
      reload,
      updatePlace,
      toggleStar,
      addPlace,
      deletePlace,
      addCategory,
      updateCategory,
      deleteCategory,
    }),
    [loading, error, categories, places, categoryById, reload, updatePlace, toggleStar, addPlace, deletePlace, addCategory, updateCategory, deleteCategory]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}