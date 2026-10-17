import { useState } from "react";
import { NavLink, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Home, LogOut, Search, Star } from "lucide-react";
import { ToastProvider } from "./Toast";
import SearchSheet from "./SearchSheet";
import { DataProvider } from "../lib/store";
import { UIProvider, useUI } from "../lib/ui";
import { supabase } from "../lib/supabase";

export default function AppShell() {
  return (
    <ToastProvider>
      <DataProvider>
        <UIProvider>
          <Shell />
        </UIProvider>
      </DataProvider>
    </ToastProvider>
  );
}

// Keeps the old page on screen while it fades out
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return <>{frozen}</>;
}

function Shell() {
  const location = useLocation();

  return (
    <div className="min-h-dvh">
      <DesktopNav />

      <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          className="mx-auto w-full max-w-2xl pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+96px)] md:pb-16"
        >
          <FrozenOutlet />
        </motion.main>
      </AnimatePresence>

      <BottomNav />
      <SearchSheet />
    </div>
  );
}

// ---------- Mobile: bottom bar ----------

function BottomNav() {
  const { openSearch } = useUI();
  const item = "flex-1 flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-medium transition-colors";

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-paper border-t border-line pb-[env(safe-area-inset-bottom)]"
      aria-label="Main"
    >
      <div className="mx-auto max-w-md flex">
        <NavLink to="/" end className={({ isActive }) => `${item} ${isActive ? "text-ink" : "text-muted"}`}>
          <Home className="size-[22px]" />
          Home
        </NavLink>

        <button type="button" onClick={() => openSearch()} className={`${item} text-muted`}>
          <span className="grid place-items-center size-10 -my-1 rounded-full bg-terracotta text-white">
            <Search className="size-[18px]" />
          </span>
          Search
        </button>

        <NavLink to="/starred" className={({ isActive }) => `${item} ${isActive ? "text-ink" : "text-muted"}`}>
          <Star className="size-[22px]" />
          Starred
        </NavLink>
      </div>
    </nav>
  );
}

// ---------- Desktop: small top-right links ----------

function DesktopNav() {
  const { openSearch } = useUI();
  const link = "h-9 px-3.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 transition-colors";

  return (
    <nav className="hidden md:flex fixed top-5 right-6 z-40 gap-1 bg-card border border-line rounded-full p-1 shadow-paper" aria-label="Main">
      <NavLink to="/" end className={({ isActive }) => `${link} ${isActive ? "bg-paper text-ink" : "text-muted hover:text-ink"}`}>
        <Home className="size-4" /> Home
      </NavLink>
      <button type="button" onClick={() => openSearch()} className={`${link} text-muted hover:text-ink`}>
        <Search className="size-4" /> Search
      </button>
      <NavLink to="/starred" className={({ isActive }) => `${link} ${isActive ? "bg-paper text-ink" : "text-muted hover:text-ink"}`}>
        <Star className="size-4" /> Starred
      </NavLink>
      <button
        type="button"
        onClick={() => supabase.auth.signOut()}
        aria-label="Sign out"
        className={`${link} text-muted hover:text-ink`}
      >
        <LogOut className="size-4" />
      </button>
    </nav>
  );
}