import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import CategoryCard, { NewCategoryTile } from "../components/CategoryCard";
import CategoryFormSheet from "../components/CategoryFormSheet";
import PlaceCard from "../components/PlaceCard";
import EmptyState from "../components/EmptyState";
import { useData } from "../lib/store";
import { useUI } from "../lib/ui";
import { listVariants } from "../lib/motion";
import { supabase } from "../lib/supabase";

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export default function Home() {
  const { loading, error, categories, places, categoryById, toggleStar, reload } = useData();
  const { openSearch } = useUI();
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of places) map.set(p.category_id, (map.get(p.category_id) ?? 0) + 1);
    return map;
  }, [places]);

  const starred = places.filter((p) => p.starred);

  return (
    <div className="px-5 pt-8 md:pt-16">
      {/* Header */}
      <header>
        <h1 className="text-[32px] leading-tight font-semibold">Wanderlist</h1>
        <p className="mt-1 text-[13px] text-muted">
          {loading
            ? "Opening your journal…"
            : `${plural(places.length, "place")} across ${plural(categories.length, "category").replace("categorys", "categories")}`}
        </p>
      </header>

      {/* Search bar (opens the search sheet) */}
      <button
        type="button"
        onClick={() => openSearch()}
        className="mt-5 w-full h-12 px-4 rounded-field bg-card border border-line shadow-paper flex items-center gap-3 text-left text-[15px] text-muted transition-colors hover:border-muted"
      >
        <Search className="size-4" />
        Search a trail, beach, or city…
      </button>

      {error && (
        <div className="mt-6 rounded-field bg-terracotta-tint text-terracotta-deep px-4 py-3 text-[13px] flex items-center justify-between gap-3">
          <span>Couldn't load your places.</span>
          <button type="button" onClick={reload} className="font-medium underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {places.length === 0 && <EmptyState />}

          {/* Categories */}
          <section className="mt-9">
            <h2 className="text-[20px] font-semibold mb-3">Categories</h2>
            <motion.div variants={listVariants} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
              {categories.map((c) => (
                <CategoryCard key={c.id} category={c} count={counts.get(c.id) ?? 0} />
              ))}
              <NewCategoryTile onClick={() => setNewCategoryOpen(true)} />
            </motion.div>
          </section>

          {/* Starred */}
          {places.length > 0 && (
            <section className="mt-10">
              <h2 className="text-[20px] font-semibold mb-3">Starred</h2>
              {starred.length === 0 ? (
                <p className="text-[14px] text-muted">Tap the star on a place to keep it close.</p>
              ) : (
                <motion.ul variants={listVariants} initial="hidden" animate="show" className="flex flex-col gap-3">
                  {starred.map((p) => (
                    <PlaceCard
                      key={p.id}
                      place={p}
                      category={categoryById(p.category_id)}
                      onToggleStar={() => toggleStar(p.id)}
                      compact
                    />
                  ))}
                </motion.ul>
              )}
            </section>
          )}

          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="md:hidden mt-12 mx-auto block text-[12px] text-muted underline underline-offset-4"
          >
            Sign out
          </button>
        </>
      )}

      <CategoryFormSheet open={newCategoryOpen} onClose={() => setNewCategoryOpen(false)} />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-9" aria-hidden="true">
      <div className="shimmer h-6 w-32" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="shimmer h-[150px] !rounded-card" />
        ))}
      </div>
    </div>
  );
}