import { motion } from "framer-motion";
import PlaceCard from "../components/PlaceCard";
import EmptyState from "../components/EmptyState";
import { useData } from "../lib/store";
import { listVariants } from "../lib/motion";

export default function Starred() {
  const { loading, places, categoryById, toggleStar } = useData();
  const starred = places.filter((p) => p.starred);

  return (
    <div className="px-5 pt-8 md:pt-16">
      <h1 className="text-[32px] leading-tight font-semibold">Starred</h1>
      <p className="mt-1 text-[13px] text-muted">
        {loading ? "Gathering your favorites…" : `${starred.length} place${starred.length === 1 ? "" : "s"} you care about most`}
      </p>

      {!loading && starred.length === 0 ? (
        <EmptyState
          title="No stars yet"
          line="Tap the star on any place and it'll show up here and on your widgets."
          arrow={false}
        />
      ) : (
        <motion.ul variants={listVariants} initial="hidden" animate="show" className="mt-6 flex flex-col gap-3">
          {starred.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              category={categoryById(p.category_id)}
              onToggleStar={() => toggleStar(p.id)}
            />
          ))}
        </motion.ul>
      )}
    </div>
  );
}