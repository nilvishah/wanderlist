import { useEffect, useState } from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import { GripVertical, Trash2 } from "lucide-react";
import type { ChecklistItem as Item } from "../lib/types";

interface Props {
  item: Item;
  color: string;
  onToggle: () => void;
  onChangeText: (text: string) => void;
  onDelete: () => void;
  onReorderEnd: () => void;
}

export default function ChecklistItem({ item, color, onToggle, onChangeText, onDelete, onReorderEnd }: Props) {
  const controls = useDragControls();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);

  useEffect(() => {
    if (!editing) setDraft(item.text);
  }, [item.text, editing]);

  function commit() {
    setEditing(false);
    const text = draft.trim();
    if (!text) return onDelete();
    if (text !== item.text) onChangeText(text);
  }

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onReorderEnd}
      className="relative list-none"
    >
      {/* Revealed when swiping left */}
      <div className="absolute inset-0 rounded-[14px] bg-terracotta-tint flex items-center justify-end pr-4 text-terracotta-deep">
        <Trash2 className="size-4" />
      </div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.6, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -90) onDelete();
        }}
        style={{ touchAction: "pan-y" }}
        className="group relative flex items-center gap-3 bg-card rounded-[14px] pl-1 pr-2 py-2"
      >
        <button
          type="button"
          aria-label="Drag to reorder"
          onPointerDown={(e) => controls.start(e)}
          style={{ touchAction: "none" }}
          className="text-muted/60 cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical className="size-4" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-label={item.is_checked ? "Mark not done" : "Mark done"}
          aria-pressed={item.is_checked}
          className="size-6 shrink-0 rounded-[8px] border-2 grid place-items-center transition-colors duration-200"
          style={{
            borderColor: item.is_checked ? color : "var(--wl-line)",
            background: item.is_checked ? color : "transparent",
          }}
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ pathLength: item.is_checked ? 1 : 0, opacity: item.is_checked ? 1 : 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </svg>
        </button>

        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setDraft(item.text);
                setEditing(false);
              }
            }}
            className="flex-1 min-w-0 bg-transparent outline-none text-[16px] py-1"
          />
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="flex-1 min-w-0 text-left py-1">
            <span
              className={`relative inline-block max-w-full truncate align-middle text-[15px] transition-colors duration-300 ${
                item.is_checked ? "text-muted" : ""
              }`}
            >
              {item.text}
              <motion.span
                aria-hidden="true"
                className="absolute left-0 right-0 top-1/2 h-px bg-current origin-left"
                initial={false}
                animate={{ scaleX: item.is_checked ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete item"
          className="hidden md:grid place-items-center size-8 rounded-full text-muted opacity-0 group-hover:opacity-100 hover:text-terracotta-deep transition-opacity"
        >
          <Trash2 className="size-4" />
        </button>
      </motion.div>
    </Reorder.Item>
  );
}