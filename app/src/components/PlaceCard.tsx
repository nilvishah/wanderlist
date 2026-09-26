import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import type { Category, Place } from "../lib/types";
import { itemVariants } from "../lib/motion";
import PlaceMedia from "./PlaceMedia";
import StarToggle from "./StarToggle";

interface Props {
  place: Place;
  category?: Category;
  onToggleStar: () => void;
  compact?: boolean;
}

export default function PlaceCard({ place, category, onToggleStar, compact = false }: Props) {
  return (
    <motion.li
      variants={itemVariants}
      layout
      className="list-none flex items-center gap-2 rounded-card bg-card border border-line shadow-paper pr-1 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <Link to={`/place/${place.id}`} className="flex items-center gap-4 flex-1 min-w-0 p-3">
        <PlaceMedia
          seed={place.id}
          scene={category?.scene ?? "other"}
          color={category?.color ?? "terracotta"}
          photoUrl={place.photo_url}
          alt={place.name}
          className={compact ? "size-14 rounded-[14px] shrink-0" : "size-[76px] rounded-[16px] shrink-0"}
        />
        <div className="min-w-0 flex-1">
          <p className={`font-serif font-semibold leading-tight truncate ${compact ? "text-[18px]" : "text-[22px]"}`}>
            {place.name}
          </p>
          {place.location && (
            <p className="text-[13px] text-muted truncate mt-1 flex items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              {place.location}
            </p>
          )}
        </div>
      </Link>
      <StarToggle starred={place.starred} onToggle={onToggleStar} />
    </motion.li>
  );
}