import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import SceneIllustration from "../components/SceneIllustration";
import PlaceCard from "../components/PlaceCard";
import CategoryFormSheet from "../components/CategoryFormSheet";
import { useData } from "../lib/store";
import { useUI } from "../lib/ui";
import { listVariants } from "../lib/motion";
import { family } from "../lib/colors";

type Filter = "all" | "starred";

export default function CategoryScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, places, categoryById, toggleStar } = useData();
  const { openSearch } = useUI();
  const [filter, setFilter] = useState<Filter>("all");
  const [editOpen, setEditOpen] = useState(false);

  const category = categoryById(id);

  function goBack() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/");
  }

  if (loading) {
    return (
      <div aria-hidden="true">
        <div className="shimmer h-[200px] !rounded-none md:!rounded-card md:mx-5 md:mt-16" />
        <div className="px-5 mt-5 shimmer h-8 w-40" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="px-5 pt-16 text-center">
        <h1 className="text-[26px] font-semibold">This category is gone</h1>
        <p className="mt-2 text-[14px] text-muted">It may have been deleted.</p>
        <Link to="/" className="mt-6 inline-block underline underline-offset-4 text-[14px]">
          Back home
        </Link>
      </div>
    );
  }

  const f = family(category.color);
  const inCategory = places.filter((p) => p.category_id === category.id);
  const shown = filter === "starred" ? inCategory.filter((p) => p.starred) : inCategory;

  return (
    <div>
      {/* Illustrated header band */}
      <div className="relative md:mx-5 md:mt-16 md:rounded-card overflow-hidden">
        <SceneIllustration
          scene={category.scene}
          color={category.color}
          seed={category.id}
          className="block w-full h-[200px]"
        />
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="absolute left-4 top-4 size-11 grid place-items-center rounded-full bg-card/95 border border-line text-ink"
        >
          <ArrowLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          aria-label="Edit category"
          className="absolute right-4 top-4 size-11 grid place-items-center rounded-full bg-card/95 border border-line text-ink"
        >
          <Pencil className="size-4" />
        </button>
      </div>

      <div className="px-5">
        <h1 className="mt-5 text-[32px] leading-tight font-semibold">{category.name}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {inCategory.length} saved · {inCategory.filter((p) => p.starred).length} starred
        </p>

        {/* All / Starred segmented control */}
        <div className="mt-5 inline-flex p-1 rounded-full bg-card border border-line">
          {(["all", "starred"] as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className="relative h-9 px-5 rounded-full text-[13px] font-medium"
            >
              {filter === value && (
                <motion.span
                  layoutId="category-filter"
                  className="absolute inset-0 rounded-full"
                  style={{ background: f.tint }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              )}
              <span className="relative" style={{ color: filter === value ? f.deep : "var(--wl-muted)" }}>
                {value === "all" ? "All" : "Starred"}
              </span>
            </button>
          ))}
        </div>

        {/* Places */}
        {shown.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="font-serif text-[20px]">
              {filter === "starred" ? "No stars here yet" : "Nothing here yet"}
            </p>
            <p className="mt-1 text-[14px] text-muted">
              {filter === "starred" ? "Star a place to see it here." : "Tap + to add your first place."}
            </p>
          </div>
        ) : (
          <motion.ul
            key={filter}
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="mt-5 flex flex-col gap-3"
          >
            {shown.map((p) => (
              <PlaceCard key={p.id} place={p} category={category} onToggleStar={() => toggleStar(p.id)} />
            ))}
          </motion.ul>
        )}
      </div>

      {/* Floating add button */}
      <motion.button
        type="button"
        onClick={() => openSearch(category.id)}
        aria-label={`Add a place to ${category.name}`}
        whileTap={{ scale: 0.94 }}
        className="fixed z-30 right-5 bottom-[calc(env(safe-area-inset-bottom)+88px)] md:bottom-8 md:right-8 size-14 rounded-full grid place-items-center text-white shadow-paper"
        style={{ background: f.main }}
      >
        <Plus className="size-6" />
      </motion.button>

      <CategoryFormSheet open={editOpen} onClose={() => setEditOpen(false)} category={category} />
    </div>
  );
}