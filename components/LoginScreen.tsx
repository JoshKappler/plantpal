"use client";

import { useState } from "react";
import { useApp } from "@/app/providers";
import { LeafGlyph } from "@/components/icons";
import { inputClass } from "@/components/forms";

type Mode = "signin" | "signup";

export function LoginScreen() {
  const { refreshAuth } = useApp();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode === "signin" ? "login" : "register"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Try again.");
        setBusy(false);
        return;
      }
      // Cookie is set; flip the app into its signed-in state.
      await refreshAuth();
    } catch {
      setError("Network error — try again.");
      setBusy(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-12">
      <div className="rise flex flex-col items-center text-center">
        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-card ring-1 ring-moss/5">
          <LeafGlyph className="h-9 w-9 text-leaf" />
        </span>
        <h1 className="mt-5 font-display text-3xl">PlantPal</h1>
        <p className="mt-1 text-sm text-moss/55">
          {isSignup
            ? "Create an account to keep your plants safe across devices."
            : "Sign in to your plants and watering history."}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mt-8 space-y-3"
      >
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
        />
        <input
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isSignup ? "Choose a password (8+ characters)" : "Password"}
          className={inputClass}
        />
        {error && <p className="px-1 text-sm text-bloom">{error}</p>}
        <button
          type="submit"
          disabled={busy || !email || !password}
          className="w-full rounded-2xl bg-leaf px-5 py-3.5 text-base font-semibold text-dew transition active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "…" : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-moss/55">
        {isSignup ? "Already have an account?" : "New here?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(isSignup ? "signin" : "signup");
            setError(null);
          }}
          className="font-semibold text-leaf"
        >
          {isSignup ? "Sign in" : "Create one"}
        </button>
      </p>
    </div>
  );
}
