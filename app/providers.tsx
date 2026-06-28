"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { makeApiRepo, Unauthorized } from "@/lib/repo/apiRepo";
import { bootstrapAccount } from "@/lib/repo/bootstrap";
import { applyCare, createPlant } from "@/lib/plantOps";
import type { ApplyCareInput, CreatePlantInput } from "@/lib/plantOps";
import type { CareEvent, Plant } from "@/lib/types";

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

type NewPlant = Omit<CreatePlantInput, "id" | "createdAt">;
type CareOpts = Omit<ApplyCareInput, "eventId">;

type AuthStatus = "loading" | "authed" | "guest";
interface Auth {
  status: AuthStatus;
  email: string | null;
}

interface AppState {
  auth: Auth;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  ready: boolean;
  plants: Plant[];
  events: CareEvent[];
  addPlant: (input: NewPlant) => Promise<Plant>;
  updatePlant: (plant: Plant) => Promise<void>;
  recordCare: (plantId: string, opts: CareOpts) => Promise<CareEvent | null>;
  removePlant: (id: string) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside <AppProvider>");
  return value;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const repo = useMemo(() => makeApiRepo(), []);
  const [auth, setAuth] = useState<Auth>({ status: "loading", email: null });
  const [ready, setReady] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [events, setEvents] = useState<CareEvent[]>([]);

  const toGuest = useCallback(() => {
    setAuth({ status: "guest", email: null });
    setReady(false);
    setPlants([]);
    setEvents([]);
  }, []);

  const refresh = useCallback(async () => {
    const [p, e] = await Promise.all([repo.listPlants(), repo.listEvents()]);
    setPlants(p);
    setEvents(e);
  }, [repo]);

  // Re-read the current session from the server. Called on mount, and by the
  // login screen after a successful sign-in / sign-up.
  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const { email } = await res.json();
        setAuth({ status: "authed", email });
      } else {
        setAuth({ status: "guest", email: null });
      }
    } catch {
      setAuth({ status: "guest", email: null });
    }
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  // Once signed in: bootstrap the account (first-login migration / seed), then load.
  useEffect(() => {
    if (auth.status !== "authed") return;
    let cancelled = false;
    (async () => {
      setReady(false);
      try {
        await bootstrapAccount(repo);
        if (cancelled) return;
        await refresh();
        if (!cancelled) setReady(true);
      } catch (err) {
        if (err instanceof Unauthorized && !cancelled) toGuest();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.status, repo, refresh, toGuest]);

  const addPlant = useCallback(
    async (input: NewPlant) => {
      const plant = createPlant({
        ...input,
        id: newId(),
        createdAt: new Date().toISOString(),
      });
      await repo.savePlant(plant);
      await refresh();
      return plant;
    },
    [repo, refresh],
  );

  const updatePlant = useCallback(
    async (plant: Plant) => {
      await repo.savePlant(plant);
      await refresh();
    },
    [repo, refresh],
  );

  const recordCare = useCallback(
    async (plantId: string, opts: CareOpts) => {
      const plant = plants.find((p) => p.id === plantId) ?? (await repo.getPlant(plantId));
      if (!plant) return null;
      const { plant: updated, event } = applyCare(plant, {
        ...opts,
        eventId: newId(),
      });
      await repo.savePlant(updated);
      await repo.addEvent(event);
      await refresh();
      return event;
    },
    [repo, refresh, plants],
  );

  const removePlant = useCallback(
    async (id: string) => {
      await repo.deletePlant(id);
      await refresh();
    },
    [repo, refresh],
  );

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // best-effort; clear local state regardless
    }
    toGuest();
  }, [toGuest]);

  return (
    <AppContext.Provider
      value={{
        auth,
        refreshAuth,
        signOut,
        ready,
        plants,
        events,
        addPlant,
        updatePlant,
        recordCare,
        removePlant,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
