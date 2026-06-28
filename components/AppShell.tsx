"use client";

import { useApp } from "@/app/providers";
import { BottomNav } from "@/components/BottomNav";
import { LoginScreen } from "@/components/LoginScreen";

/**
 * Gates the app behind sign-in: a splash while the session is resolving, the
 * login screen for guests (no bottom nav), and the full app shell once signed in.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { auth } = useApp();

  if (auth.status === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <p className="text-moss/50">Waking up the greenhouse…</p>
      </div>
    );
  }

  if (auth.status === "guest") {
    return <LoginScreen />;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className="flex-1 px-5 pb-28 pt-7">{children}</main>
      <BottomNav />
    </div>
  );
}
