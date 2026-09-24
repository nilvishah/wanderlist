import { useAnimate, useReducedMotion } from "framer-motion";
import { STAR_COLOR } from "../lib/colors";

const STAR_PATH =
  "M12 2.8l2.83 5.74 6.34.92-4.59 4.47 1.08 6.31L12 17.27l-5.66 2.97 1.08-6.31-4.59-4.47 6.34-.92z";

interface Props {
  starred: boolean;
  onToggle: () => void;
  size?: number;
  floating?: boolean;
  className?: string;
}

export default function StarToggle({ starred, onToggle, size = 22, floating = false, className = "" }: Props) {
  const [scope, animate] = useAnimate();
  const reduce = useReducedMotion();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!starred && !reduce && scope.current) {
      animate(scope.current, { scale: [1, 1.3, 1] }, { duration: 0.32, ease: "easeOut" });
    }
    onToggle();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={starred}
      aria-label={starred ? "Unstar" : "Star"}
      className={`grid place-items-center shrink-0 rounded-full transition-colors ${
        floating ? "size-11 bg-card/95 border border-line shadow-paper" : "size-11 hover:bg-line/50"
      } ${starred ? "" : "text-muted"} ${className}`}
    >
      <svg ref={scope} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d={STAR_PATH}
          fill={starred ? STAR_COLOR : "none"}
          stroke={starred ? STAR_COLOR : "currentColor"}
          strokeWidth={1.8}
          strokeLinejoin="round"
          style={{ transition: "fill 200ms ease, stroke 200ms ease" }}
        />
      </svg>
    </button>
  );
}