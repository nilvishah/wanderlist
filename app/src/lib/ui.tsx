import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface UIState {
  searchOpen: boolean;
  searchCategoryId: string | null;
  openSearch: (categoryId?: string) => void;
  closeSearch: () => void;
}

const UIContext = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchCategoryId, setSearchCategoryId] = useState<string | null>(null);

  const openSearch = useCallback((categoryId?: string) => {
    setSearchCategoryId(categoryId ?? null);
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const value = useMemo(
    () => ({ searchOpen, searchCategoryId, openSearch, closeSearch }),
    [searchOpen, searchCategoryId, openSearch, closeSearch]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}