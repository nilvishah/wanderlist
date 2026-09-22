import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

const EMAIL_KEY = "wanderlist:email";

function readSavedEmail() {
  try {
    return localStorage.getItem(EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

function friendlyError(message: string) {
  if (/invalid login credentials/i.test(message)) return "Email or password doesn't match.";
  if (/rate|too many|429/i.test(message)) return "Too many tries. Give it a little while.";
  return message;
}

export default function Login() {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState(readSavedEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate(from, { replace: true });
  }, [session, from, navigate]);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const clean = email.trim().toLowerCase();
    try {
      localStorage.setItem(EMAIL_KEY, clean);
    } catch {}
    const { error } = await supabase.auth.signInWithPassword({ email: clean, password });
    setBusy(false);
    if (error) setError(friendlyError(error.message));
  }

  const field =
    "w-full h-12 pl-11 pr-4 rounded-field bg-card border border-line text-[16px] outline-none focus:border-terracotta transition-colors";

  return (
    <div className="min-h-dvh flex flex-col px-6 pt-[max(env(safe-area-inset-top),48px)] pb-[max(env(safe-area-inset-bottom),24px)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center"
      >
        <div className="rounded-card overflow-hidden border border-line shadow-paper mb-10">
          <svg viewBox="0 0 320 140" className="block w-full h-auto" aria-hidden="true">
            <rect width="320" height="140" fill="#FAECE7" />
            <circle cx="232" cy="52" r="20" fill="#E8A317" />
            <path d="M0 112 L70 52 L118 92 L168 44 L240 104 L320 70 L320 140 L0 140 Z" fill="#D85A30" />
            <path d="M0 128 L58 96 L120 124 L190 90 L262 126 L320 108 L320 140 L0 140 Z" fill="#993C1D" />
          </svg>
        </div>

        <h1 className="text-[32px] leading-tight font-semibold">Wanderlist</h1>
        <p className="mt-1 text-muted text-[15px]">Your quiet list of someday places.</p>

        <form onSubmit={signIn} className="mt-8 flex flex-col gap-3">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted" />
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email"
              className={field}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted" />
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-label="Password"
              className={field}
            />
          </div>
          <button
            type="submit"
            disabled={busy || !email.trim() || !password}
            className="h-12 mt-1 rounded-field bg-terracotta text-white font-medium text-[15px] active:translate-y-px disabled:opacity-60 transition"
          >
            {busy ? "Opening…" : "Open my journal"}
          </button>
        </form>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-[13px] text-terracotta-deep bg-terracotta-tint rounded-field px-4 py-3"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}