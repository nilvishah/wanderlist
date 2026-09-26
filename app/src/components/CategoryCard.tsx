import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { Category } from "../lib/types";
import { itemVariants } from "../lib/motion";
import SceneIllustration from "./SceneIllustration";

export default function CategoryCard({ category, count }: { category: Category; count: number }) {
  return (
    <motion.div variants={itemVariants}>
      <Link
        to={`/category/${category.id}`}
        className="block rounded-card bg-card border border-line shadow-paper overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 active:-translate-y-0.5"
      >
        <SceneIllustration
          scene={category.scene}
          color={category.color}
          seed={category.id}
          className="block w-full h-[90px]"
        />
        <div className="px-4 pt-3 pb-4">
          <h3 className="text-[19px] leading-tight font-semibold truncate">{category.name}</h3>
          <p className="text-[12px] text-muted mt-0.5">{count} saved</p>
        </div>
      </Link>
    </motion.div>
  );
}

export function NewCategoryTile({ onClick }: { onClick: () => void }) {
  return (
    <motion.div variants={itemVariants}>
      <button
        type="button"
        onClick={onClick}
        className="w-full h-full min-h-[150px] rounded-card border-2 border-dashed border-line text-muted flex flex-col items-center justify-center gap-2 transition-colors hover:text-ink hover:border-muted"
      >
        <Plus className="size-5" />
        <span className="text-[13px] font-medium">New category</span>
      </button>
    </motion.div>
  );
}