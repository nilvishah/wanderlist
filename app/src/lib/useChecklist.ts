import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { uuid } from "./store";
import type { ChecklistItem } from "./types";
import { useToast } from "../components/Toast";

export function useChecklist(placeId: string | undefined) {
  const toast = useToast();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const fail = useCallback(() => toast("Couldn't save that. Try again."), [toast]);

  // Load this place's items
  useEffect(() => {
    if (!placeId) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from("checklist_items")
      .select("*")
      .eq("place_id", placeId)
      .order("sort_order")
      .order("created_at")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setItems(data as ChecklistItem[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  const addMany = useCallback(
    async (texts: string[]) => {
      if (!placeId) return;
      const clean = texts.map((t) => t.trim()).filter(Boolean);
      if (!clean.length) return;
      const start = Math.max(-1, ...itemsRef.current.map((i) => i.sort_order)) + 1;
      const now = Date.now();
      const rows: ChecklistItem[] = clean.map((text, i) => ({
        id: uuid(),
        place_id: placeId,
        text,
        is_checked: false,
        sort_order: start + i,
        created_at: new Date(now + i).toISOString(),
      }));
      setItems((prev) => [...prev, ...rows]);
      const { error } = await supabase.from("checklist_items").insert(rows);
      if (error) {
        const ids = new Set(rows.map((r) => r.id));
        setItems((prev) => prev.filter((i) => !ids.has(i.id)));
        fail();
      }
    },
    [placeId, fail]
  );

  const add = useCallback((text: string) => addMany([text]), [addMany]);

  const patch = useCallback(
    async (id: string, changes: Partial<ChecklistItem>) => {
      const before = itemsRef.current.find((i) => i.id === id);
      if (!before) return;
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));
      const { error } = await supabase.from("checklist_items").update(changes).eq("id", id);
      if (error) {
        setItems((prev) => prev.map((i) => (i.id === id ? before : i)));
        fail();
      }
    },
    [fail]
  );

  const toggle = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((i) => i.id === id);
      if (item) patch(id, { is_checked: !item.is_checked });
    },
    [patch]
  );

  const updateText = useCallback((id: string, text: string) => patch(id, { text }), [patch]);

  const remove = useCallback(
    async (id: string) => {
      const snapshot = itemsRef.current;
      setItems((prev) => prev.filter((i) => i.id !== id));
      const { error } = await supabase.from("checklist_items").delete().eq("id", id);
      if (error) {
        setItems(snapshot);
        fail();
      }
    },
    [fail]
  );

  // While dragging: just reorder on screen
  const setOrder = useCallback((next: ChecklistItem[]) => setItems(next), []);

  // When the drag ends: save the new order
  const persistOrder = useCallback(async () => {
    const current = itemsRef.current;
    const changed = current
      .map((item, index) => ({ ...item, sort_order: index }))
      .filter((item, index) => current[index].sort_order !== item.sort_order);
    if (!changed.length) return;
    setItems(current.map((item, index) => ({ ...item, sort_order: index })));
    const { error } = await supabase.from("checklist_items").upsert(changed);
    if (error) fail();
  }, [fail]);

  const doneCount = items.filter((i) => i.is_checked).length;

  return { items, loading, doneCount, add, addMany, toggle, updateText, remove, setOrder, persistOrder };
}