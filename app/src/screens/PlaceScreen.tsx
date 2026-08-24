import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import { ArrowLeft, ExternalLink, FolderInput, MapPin, Plus, Sparkles, Trash2 } from "lucide-react";
import PlaceMedia from "../components/PlaceMedia";
import StarToggle from "../components/StarToggle";
import ChecklistItem from "../components/ChecklistItem";
import ProgressBar from "../components/ProgressBar";
import Sheet from "../components/Sheet";
import { useToast } from "../components/Toast";
import { useData } from "../lib/store";
import { useChecklist } from "../lib/useChecklist";
import { aiDescribe, aiPlan } from "../lib/api";
import { family } from "../lib/colors";

export default function PlaceScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { loading, places, categories, categoryById, toggleStar, updatePlace, deletePlace } = useData();
  const place = places.find((p) => p.id === id);
  const category = categoryById(place?.category_id);
  const f = family(category?.color);
  const checklist = useChecklist(place?.id);

  // ----- Description -----
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [descBusy, setDescBusy] = useState(false);
  const [descSuggestion, setDescSuggestion] = useState<string | null>(null);

  // ----- Plan -----
  const [newItem, setNewItem] = useState("");
  const [planBusy, setPlanBusy] = useState(false);

  // ----- Notes (auto-save) -----
  const [notes, setNotes] = useState("");
  const [notesState, setNotesState] = useState<"idle" | "saving" | "saved">("idle");
  const pendingNotes = useRef<string | null>(null);

  // ----- Footer actions -----
  const [moveOpen, setMoveOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load notes when the place changes
  useEffect(() => {
    setNotes(place?.notes ?? "");
    setNotesState("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.id]);

  // Save notes 800ms after you stop typing
  useEffect(() => {
    if (!place || notes === (place.notes ?? "")) return;
    pendingNotes.current = notes;
    setNotesState("saving");
    const timer = window.setTimeout(async () => {
      pendingNotes.current = null;
      const ok = await updatePlace(place.id, { notes });
      setNotesState(ok ? "saved" : "idle");
    }, 800);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  // If you leave the page mid-typing, save what's left
  const placeIdRef = useRef(place?.id);
  placeIdRef.current = place?.id;
  useEffect(() => {
    return () => {
      if (pendingNotes.current !== null && placeIdRef.current) {
        updatePlace(placeIdRef.current, { notes: pendingNotes.current });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goBack() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(place ? `/category/${place.category_id}` : "/");
  }

  // ----- Loading / not found -----
  if (loading) {
    return (
      <div aria-hidden="true">
        <div className="shimmer h-[260px] !rounded-none md:!rounded-card md:mx-5 md:mt-16" />
        <div className="px-5 mt-6 shimmer h-9 w-56" />
        <div className="px-5 mt-3 shimmer h-4 w-32" />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="px-5 pt-16 text-center">
        <h1 className="text-[26px] font-semibold">This place is gone</h1>
        <p className="mt-2 text-[14px] text-muted">It may have been deleted or moved.</p>
        <Link to="/" className="mt-6 inline-block underline underline-offset-4 text-[14px]">
          Back home
        </Link>
      </div>
    );
  }

  // ----- Actions -----

  async function saveDescription(text: string) {
    setEditingDesc(false);
    const clean = text.trim();
    if (clean !== (place!.description ?? "")) await updatePlace(place!.id, { description: clean || null });
  }

  async function writeWithAI() {
    setDescBusy(true);
    setDescSuggestion(null);
    try {
      const sentence = await aiDescribe({ name: place!.name, location: place!.location, category: category?.name });
      if (place!.description?.trim()) setDescSuggestion(sentence); // never overwrite without asking
      else await updatePlace(place!.id, { description: sentence });
    } catch {
      toast("AI isn't connected yet");
    } finally {
      setDescBusy(false);
    }
  }

  async function suggestPlan() {
    setPlanBusy(true);
    try {
      const items = await aiPlan({ name: place!.name, location: place!.location, category: category?.name });
      const existing = new Set(checklist.items.map((i) => i.text.toLowerCase()));
      await checklist.addMany(items.filter((t) => !existing.has(t.toLowerCase())));
    } catch {
      toast("AI isn't connected yet");
    } finally {
      setPlanBusy(false);
    }
  }

  function addItem() {
    if (!newItem.trim()) return;
    checklist.add(newItem);
    setNewItem("");
  }

  async function moveTo(categoryId: string) {
    setMoveOpen(false);
    if (categoryId === place!.category_id) return;
    const target = categoryById(categoryId);
    const ok = await updatePlace(place!.id, { category_id: categoryId });
    if (ok && target) toast(`Moved to ${target.name}`);
  }

  async function remove() {
    const back = `/category/${place!.category_id}`;
    const name = place!.name;
    navigate(back, { replace: true });
    await deletePlace(place!.id);
    toast(`${name} deleted`);
  }

  const mapsUrl =
    place.lat != null && place.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}${
          place.google_place_id ? `&query_place_id=${place.google_place_id}` : ""
        }`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [place.name, place.location].filter(Boolean).join(", ")
        )}`;

  const total = checklist.items.length;

  return (
    <div>
      {/* Hero */}
      <div className="relative md:mx-5 md:mt-16 md:rounded-card overflow-hidden">
        <PlaceMedia
          seed={place.id}
          scene={category?.scene ?? "other"}
          color={category?.color ?? "terracotta"}
          photoUrl={place.photo_url}
          alt={place.name}
          className="w-full h-[260px]"
        />
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="absolute left-4 top-4 size-11 grid place-items-center rounded-full bg-card/95 border border-line text-ink"
        >
          <ArrowLeft className="size-5" />
        </button>
        <StarToggle
          starred={place.starred}
          onToggle={() => toggleStar(place.id)}
          floating
          size={22}
          className="absolute right-4 top-4"
        />
      </div>

      <div className="px-5">
        {/* Name + location */}
        {category && (
          <Link
            to={`/category/${category.id}`}
            className="mt-5 inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-medium"
            style={{ background: f.tint, color: f.deep }}
          >
            {category.name}
          </Link>
        )}
        <h1 className="mt-3 text-[28px] leading-tight font-semibold">{place.name}</h1>
        {place.location && (
          <p className="mt-1.5 text-[14px] text-muted flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0" />
            {place.location}
          </p>
        )}

        {/* Description */}
        <div className="mt-4">
          {descBusy ? (
            <div className="shimmer h-6 w-4/5" />
          ) : editingDesc ? (
            <input
              autoFocus
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={() => saveDescription(descDraft)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditingDesc(false);
              }}
              placeholder="One line about why you want to go…"
              maxLength={140}
              className="w-full bg-transparent outline-none border-b border-line font-serif italic text-[18px] text-muted py-1"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setDescDraft(place.description ?? "");
                setEditingDesc(true);
              }}
              className="w-full text-left font-serif italic text-[18px] text-muted leading-snug"
            >
              {place.description || <span className="opacity-60">Add a line about why you want to go…</span>}
            </button>
          )}

          <AnimatePresence>
            {descSuggestion && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 rounded-field border border-line bg-card p-3"
              >
                <p className="text-[12px] text-muted flex items-center gap-1">
                  <Sparkles className="size-3" /> Suggestion
                </p>
                <p className="mt-1 font-serif italic text-[16px]">{descSuggestion}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updatePlace(place.id, { description: descSuggestion });
                      setDescSuggestion(null);
                    }}
                    className="h-9 px-4 rounded-full text-white text-[13px] font-medium"
                    style={{ background: f.main }}
                  >
                    Use this
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescSuggestion(null)}
                    className="h-9 px-4 rounded-full border border-line text-[13px]"
                  >
                    Keep mine
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={writeWithAI}
            disabled={descBusy}
            className="mt-2 inline-flex items-center gap-1.5 h-8 text-[13px] font-medium disabled:opacity-60"
            style={{ color: f.deep }}
          >
            <Sparkles className="size-3.5" /> Write with AI
          </button>
        </div>

        {/* Plan */}
        <section className="mt-8 rounded-card bg-card border border-line shadow-paper p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[20px] font-semibold">Plan</h2>
            <span className="text-[12px] text-muted">
              {total === 0 ? "Nothing yet" : `${checklist.doneCount} of ${total} done`}
            </span>
          </div>
          {total > 0 && (
            <div className="mt-3">
              <ProgressBar value={total ? checklist.doneCount / total : 0} color={f.main} />
            </div>
          )}

          {checklist.loading ? (
            <div className="mt-4 flex flex-col gap-3" aria-hidden="true">
              <div className="shimmer h-8" />
              <div className="shimmer h-8 w-4/5" />
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={checklist.items}
              onReorder={checklist.setOrder}
              className="mt-3 flex flex-col gap-1"
            >
              {checklist.items.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  color={f.main}
                  onToggle={() => checklist.toggle(item.id)}
                  onChangeText={(text) => checklist.updateText(item.id, text)}
                  onDelete={() => checklist.remove(item.id)}
                  onReorderEnd={checklist.persistOrder}
                />
              ))}
            </Reorder.Group>
          )}

          {planBusy && (
            <div className="mt-2 flex flex-col gap-2 px-2" aria-hidden="true">
              {[0.9, 0.7, 0.8, 0.6].map((w, i) => (
                <div key={i} className="shimmer h-7" style={{ width: `${w * 100}%` }} />
              ))}
            </div>
          )}

          {/* Add item */}
          <div className="mt-2 flex items-center gap-3 pl-2 pr-1">
            <Plus className="size-4 text-muted shrink-0" />
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              onBlur={addItem}
              placeholder="Add item"
              className="flex-1 h-11 bg-transparent outline-none text-[16px] placeholder:text-muted"
            />
          </div>

          <button
            type="button"
            onClick={suggestPlan}
            disabled={planBusy}
            className="mt-2 w-full h-10 rounded-field border border-dashed border-line flex items-center justify-center gap-1.5 text-[13px] font-medium disabled:opacity-60"
            style={{ color: f.deep }}
          >
            <Sparkles className="size-3.5" />
            {planBusy ? "Thinking…" : "Suggest a plan"}
          </button>
        </section>

        {/* Notes */}
        <section className="mt-6 rounded-card bg-card border border-line shadow-paper p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[20px] font-semibold">Notes</h2>
            <span className="text-[12px] text-muted">
              {notesState === "saving" ? "Saving…" : notesState === "saved" ? "Saved" : ""}
            </span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Who told you about it, what to eat, the view you're chasing…"
            rows={6}
            className="ruled mt-2 w-full min-h-[192px] bg-transparent outline-none resize-y text-[16px] placeholder:text-muted"
          />
        </section>

        {/* Footer actions */}
        <div className="mt-8 flex flex-col gap-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="h-12 rounded-field flex items-center justify-center gap-2 text-white font-medium text-[15px]"
            style={{ background: f.main }}
          >
            <ExternalLink className="size-4" /> Open in Maps
          </a>
          <button
            type="button"
            onClick={() => setMoveOpen(true)}
            className="h-12 rounded-field bg-card border border-line flex items-center justify-center gap-2 text-[15px]"
          >
            <FolderInput className="size-4" /> Move to another category
          </button>

          {confirmDelete ? (
            <div className="rounded-field bg-terracotta-tint p-4">
              <p className="text-[14px] text-terracotta-deep">
                Delete <strong>{place.name}</strong> and its plan and notes? This can't be undone.
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
              className="h-11 flex items-center justify-center gap-2 text-[14px] text-muted hover:text-terracotta-deep transition-colors"
            >
              <Trash2 className="size-4" /> Delete place
            </button>
          )}
        </div>
      </div>

      {/* Move sheet */}
      <Sheet open={moveOpen} onClose={() => setMoveOpen(false)} label="Move to category">
        <h2 className="text-[22px] font-semibold mb-4">Move to…</h2>
        <div className="flex flex-col gap-2">
          {categories.map((c) => {
            const cf = family(c.color);
            const current = c.id === place.category_id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => moveTo(c.id)}
                className="h-12 px-4 rounded-field bg-card border border-line flex items-center gap-3 text-left text-[15px]"
              >
                <span className="size-3 rounded-full" style={{ background: cf.main }} />
                <span className="flex-1">{c.name}</span>
                {current && <span className="text-[12px] text-muted">Current</span>}
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}