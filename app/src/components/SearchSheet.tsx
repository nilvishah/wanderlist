import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, MapPin, PenLine, Search, Sparkles, Star, X } from "lucide-react";
import Sheet from "./Sheet";
import PlaceMedia from "./PlaceMedia";
import { useToast } from "./Toast";
import { useUI } from "../lib/ui";
import { useData } from "../lib/store";
import { aiCategorize, searchPlaces, suggestCategoryByType } from "../lib/api";
import { family, STAR_COLOR } from "../lib/colors";
import type { SearchResult } from "../lib/types";

export default function SearchSheet() {
  const { searchOpen, searchCategoryId, closeSearch } = useUI();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [selected, setSelected] = useState<SearchResult | null>(null);

  // Fresh start every time the sheet opens
  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setStatus("idle");
    }
  }, [searchOpen]);

  // Search 300ms after you stop typing
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    const timer = window.setTimeout(async () => {
      try {
        const found = await searchPlaces(q);
        if (!cancelled) {
          setResults(found);
          setStatus("idle");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setStatus("error");
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  function addManually() {
    const name = query.trim();
    if (!name) return;
    setSelected({
      googlePlaceId: "",
      name,
      address: "",
      location: "",
      lat: null,
      lng: null,
      types: [],
      photoUrl: null,
    });
  }

  return (
    <Sheet open={searchOpen} onClose={closeSearch} label="Search places">
      <AnimatePresence mode="wait" initial={false}>
        {selected ? (
          <motion.div
            key="add"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2 }}
          >
            <AddPlaceView
              result={selected}
              presetCategoryId={searchCategoryId}
              onBack={() => setSelected(null)}
              onDone={closeSearch}
            />
          </motion.div>
        ) : (
          <motion.div
            key="search"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-[24px] font-semibold mb-3">Find a place</h2>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="A trail, a beach, a city…"
                className="w-full h-12 pl-11 pr-11 rounded-field bg-card border border-line text-[16px] outline-none focus:border-terracotta transition-colors"
              />
              {status === "loading" ? (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted animate-spin" />
              ) : query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear"
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-8 grid place-items-center text-muted"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>

            <ul className="mt-4 flex flex-col gap-1">
              {results.map((r) => {
                const guess = suggestCategoryByType(r.types, []);
                return (
                  <li key={r.googlePlaceId || r.name}>
                    <button
                      type="button"
                      onClick={() => setSelected(r)}
                      className="w-full flex items-center gap-3 p-2 rounded-field text-left hover:bg-card active:bg-card transition-colors"
                    >
                      <PlaceMedia
                        seed={r.googlePlaceId || r.name}
                        scene={guess?.scene ?? "other"}
                        color={guess?.color ?? "blue"}
                        photoUrl={r.photoUrl}
                        className="size-12 rounded-[12px] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-serif text-[17px] font-semibold leading-tight truncate">{r.name}</p>
                        <p className="text-[12px] text-muted truncate mt-0.5">{r.address}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {status === "error" && (
              <p className="mt-2 text-[13px] text-muted">
                Search isn't connected yet. You can still add the place by hand below.
              </p>
            )}

            {query.trim().length >= 2 && status !== "loading" && (
              <button
                type="button"
                onClick={addManually}
                className="mt-3 w-full flex items-center gap-3 p-3 rounded-field border border-dashed border-line text-left text-[14px] text-muted hover:text-ink transition-colors"
              >
                <PenLine className="size-4 shrink-0" />
                <span className="truncate">
                  Add <span className="text-ink font-medium">“{query.trim()}”</span> without search
                </span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

// ---------- Step 2: choose category and add ----------

function AddPlaceView({
  result,
  presetCategoryId,
  onBack,
  onDone,
}: {
  result: SearchResult;
  presetCategoryId: string | null;
  onBack: () => void;
  onDone: () => void;
}) {
  const { categories, addPlace } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const ruleGuess = suggestCategoryByType(result.types, categories);
  const [categoryId, setCategoryId] = useState<string | undefined>(presetCategoryId ?? ruleGuess?.id);
  const [touched, setTouched] = useState(Boolean(presetCategoryId));
  const [aiPicked, setAiPicked] = useState(false);
  const [location2, setLocation2] = useState(result.location);
  const [starred, setStarred] = useState(false);
  const [saving, setSaving] = useState(false);

  // Ask the AI for a better guess in the background (silently ignored if not set up)
  useEffect(() => {
    if (presetCategoryId || categories.length < 2) return;
    let cancelled = false;
    aiCategorize({ name: result.name, address: result.address, types: result.types, categories })
      .then((id) => {
        if (!cancelled && id && categories.some((c) => c.id === id)) {
          setCategoryId((prev) => (touched ? prev : id));
          if (!touched) setAiPicked(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const category = categories.find((c) => c.id === categoryId);
  const fam = family(category?.color);

  async function add() {
    if (!category) return;
    setSaving(true);
    const place = await addPlace({
      category_id: category.id,
      name: result.name,
      location: location2.trim() || null,
      lat: result.lat,
      lng: result.lng,
      google_place_id: result.googlePlaceId || null,
      photo_url: result.photoUrl,
      starred,
    });
    setSaving(false);
    if (!place) return;
    toast(`Added to ${category.name}`);
    onDone();
    const target = `/category/${category.id}`;
    if (location.pathname !== target) navigate(target);
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-[13px] text-muted -ml-1 mb-3 h-8 px-1"
      >
        <ArrowLeft className="size-4" /> Back to search
      </button>

      <PlaceMedia
        seed={result.googlePlaceId || result.name}
        scene={category?.scene ?? "other"}
        color={category?.color ?? "blue"}
        photoUrl={result.photoUrl}
        alt={result.name}
        className="w-full h-44 rounded-card"
      />

      <h2 className="mt-4 text-[26px] font-semibold leading-tight">{result.name}</h2>

      {result.address ? (
        <p className="mt-1 text-[13px] text-muted flex items-start gap-1">
          <MapPin className="size-3.5 mt-0.5 shrink-0" />
          {result.address}
        </p>
      ) : (
        <div className="relative mt-3">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            value={location2}
            onChange={(e) => setLocation2(e.target.value)}
            placeholder="Where is it? (e.g. Kyoto, Japan)"
            className="w-full h-11 pl-11 pr-4 rounded-field bg-card border border-line text-[16px] outline-none focus:border-terracotta transition-colors"
          />
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-[13px] font-medium">Choose a category</p>
        {aiPicked && !touched && (
          <span className="text-[12px] text-muted flex items-center gap-1">
            <Sparkles className="size-3" /> Suggested
          </span>
        )}
      </div>

      {categories.length === 0 ? (
        <p className="mt-2 text-[13px] text-muted">Create a category on the home screen first.</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((c) => {
            const f = family(c.color);
            const active = c.id === categoryId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategoryId(c.id);
                  setTouched(true);
                }}
                className="h-9 px-3.5 rounded-full text-[14px] font-medium flex items-center gap-2 border transition-colors"
                style={{
                  background: active ? f.main : "var(--wl-card)",
                  borderColor: active ? f.main : "var(--wl-line)",
                  color: active ? "#FFFFFF" : "var(--wl-ink)",
                }}
              >
                <span className="size-2.5 rounded-full" style={{ background: active ? "#FFFFFF" : f.main }} />
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={starred}
        onClick={() => setStarred((s) => !s)}
        className="mt-5 w-full h-12 px-4 rounded-field bg-card border border-line flex items-center justify-between"
      >
        <span className="flex items-center gap-2 text-[15px]">
          <Star className="size-4" fill={starred ? STAR_COLOR : "none"} color={starred ? STAR_COLOR : "currentColor"} />
          Star it
        </span>
        <span
          className={`w-11 h-6 rounded-full p-0.5 flex transition-colors ${starred ? "justify-end" : "justify-start"}`}
          style={{ background: starred ? STAR_COLOR : "var(--wl-line)" }}
        >
          <motion.span layout transition={{ duration: 0.2 }} className="block size-5 rounded-full bg-white" />
        </span>
      </button>

      <button
        type="button"
        onClick={add}
        disabled={!category || saving}
        className="mt-6 w-full h-14 rounded-field text-white font-semibold text-[16px] active:translate-y-px disabled:opacity-60 transition"
        style={{ background: fam.main }}
      >
        {saving ? "Adding…" : "Add to Wanderlist"}
      </button>
    </div>
  );
}