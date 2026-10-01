import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Trash2 } from "lucide-react";
import Sheet from "./Sheet";
import SceneIllustration from "./SceneIllustration";
import { useToast } from "./Toast";
import { useData } from "../lib/store";
import { COLOR_ORDER, FAMILIES, SCENES, SCENE_DEFAULT_COLOR } from "../lib/colors";
import type { Category, ColorFamily, Scene } from "../lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  category?: Category; // pass one to edit, leave empty to create
}

export default function CategoryFormSheet({ open, onClose, category }: Props) {
  const { addCategory, updateCategory, deleteCategory, places } = useData();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [color, setColor] = useState<ColorFamily>("terracotta");
  const [scene, setScene] = useState<Scene>("hike");
  const [colorTouched, setColorTouched] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setColor(category?.color ?? "terracotta");
      setScene(category?.scene ?? "hike");
      setColorTouched(Boolean(category));
      setConfirmDelete(false);
    }
  }, [open, category]);

  const editing = Boolean(category);
  const placeCount = category ? places.filter((p) => p.category_id === category.id).length : 0;

  function pickScene(next: Scene) {
    setScene(next);
    if (!colorTouched) setColor(SCENE_DEFAULT_COLOR[next]);
  }

  async function save() {
    const clean = name.trim();
    if (!clean) return;
    if (category) {
      await updateCategory(category.id, { name: clean, color, scene });
      toast("Category updated");
    } else {
      const created = await addCategory({ name: clean, color, scene });
      if (created) toast(`${created.name} created`);
    }
    onClose();
  }

  async function remove() {
    if (!category) return;
    onClose();
    navigate("/", { replace: true });
    await deleteCategory(category.id);
    toast(`${category.name} deleted`);
  }

  return (
    <Sheet open={open} onClose={onClose} label={editing ? "Edit category" : "New category"}>
      <h2 className="text-[24px] font-semibold mb-4">{editing ? "Edit category" : "New category"}</h2>

      <div className="rounded-card overflow-hidden border border-line">
        <SceneIllustration
          scene={scene}
          color={color}
          seed={category?.id ?? "preview"}
          className="block w-full h-28"
        />
      </div>

      <label className="block mt-5 text-[13px] font-medium" htmlFor="cat-name">
        Name
      </label>
      <input
        id="cat-name"
        autoFocus={!editing}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder="Waterfalls, Islands, Food cities…"
        maxLength={40}
        className="mt-2 w-full h-12 px-4 rounded-field bg-card border border-line text-[16px] outline-none focus:border-terracotta transition-colors"
      />

      <p className="mt-5 text-[13px] font-medium">Scene</p>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {SCENES.map((s) => {
          const active = s.value === scene;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => pickScene(s.value)}
              aria-pressed={active}
              className="flex flex-col items-center gap-1"
            >
              <span
                className="block w-full aspect-[4/3] rounded-[12px] overflow-hidden border-2 transition-colors"
                style={{ borderColor: active ? FAMILIES[color].main : "transparent" }}
              >
                <SceneIllustration scene={s.value} color={color} seed="picker" className="block w-full h-full" />
              </span>
              <span className={`text-[11px] ${active ? "text-ink font-medium" : "text-muted"}`}>{s.label}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-[13px] font-medium">Color</p>
      <div className="mt-2 flex gap-3">
        {COLOR_ORDER.map((c) => {
          const active = c === color;
          return (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                setColorTouched(true);
              }}
              aria-label={FAMILIES[c].label}
              aria-pressed={active}
              className="size-10 rounded-full grid place-items-center transition-transform active:scale-95"
              style={{ background: FAMILIES[c].main }}
            >
              {active && <Check className="size-5 text-white" />}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={!name.trim()}
        className="mt-7 w-full h-14 rounded-field text-white font-semibold text-[16px] active:translate-y-px disabled:opacity-60 transition"
        style={{ background: FAMILIES[color].main }}
      >
        {editing ? "Save changes" : "Create category"}
      </button>

      {editing &&
        (confirmDelete ? (
          <div className="mt-4 rounded-field bg-terracotta-tint p-4">
            <p className="text-[14px] text-terracotta-deep">
              Delete <strong>{category!.name}</strong>
              {placeCount > 0 ? ` and its ${placeCount} place${placeCount === 1 ? "" : "s"}` : ""}? This can't be undone.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={remove}
                className="flex-1 h-11 rounded-field bg-terracotta-deep text-white text-[14px] font-medium"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 h-11 rounded-field bg-card border border-line text-[14px]"
              >
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-4 w-full h-11 flex items-center justify-center gap-2 text-[14px] text-muted hover:text-terracotta-deep transition-colors"
          >
            <Trash2 className="size-4" /> Delete category
          </button>
        ))}
    </Sheet>
  );
}