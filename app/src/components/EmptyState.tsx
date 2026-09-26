import { motion } from "framer-motion";

export default function EmptyState({
  title = "Where to first?",
  line = "Search for a place above to start your list.",
  arrow = true,
}: {
  title?: string;
  line?: string;
  arrow?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative flex flex-col items-center text-center pt-14 pb-10"
    >
      {arrow && (
        <svg viewBox="0 0 80 60" className="absolute top-0 left-[18%] w-20 text-muted" aria-hidden="true">
          <path
            d="M60 56 C 40 50, 20 38, 16 8"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="4 5"
          />
          <path
            d="M8 16 L16 6 L24 15"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Suitcase */}
      <svg viewBox="0 0 160 130" className="w-40" aria-hidden="true">
        <ellipse cx="80" cy="122" rx="56" ry="6" fill="#EADFCB" />
        <path
          d="M60 30 V20 a8 8 0 0 1 8-8 h24 a8 8 0 0 1 8 8 v10"
          fill="none"
          stroke="#993C1D"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <rect x="22" y="30" width="116" height="88" rx="16" fill="#D85A30" />
        <rect x="22" y="58" width="116" height="8" fill="#993C1D" />
        <rect x="50" y="30" width="8" height="88" fill="#993C1D" />
        <rect x="102" y="30" width="8" height="88" fill="#993C1D" />
        <circle cx="80" cy="92" r="12" fill="#1D9E75" />
        <rect x="114" y="80" width="18" height="12" rx="3" fill="#E8A317" transform="rotate(-12 123 86)" />
        <circle cx="38" cy="96" r="7" fill="#FBEAF0" />
      </svg>

      <h2 className="mt-6 text-[26px] font-semibold">{title}</h2>
      <p className="mt-1 text-[14px] text-muted max-w-[240px]">{line}</p>
    </motion.div>
  );
}