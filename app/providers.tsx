"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { makeLocalRepo } from "@/lib/repo/localRepo";
import { applyCare, createPlant } from "@/lib/plantOps";
import type { ApplyCareInput, CreatePlantInput } from "@/lib/plantOps";
import { demoSeed } from "@/lib/demoSeed";
import type { CareEvent, Plant } from "@/lib/types";

const repo = makeLocalRepo();

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

type NewPlant = Omit<CreatePlantInput, "id" | "createdAt">;
type CareOpts = Omit<ApplyCareInput, "eventId">;

interface AppState {
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
  const [ready, setReady] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [events, setEvents] = useState<CareEvent[]>([]);

  const refresh = useCallback(async () => {
    const [p, e] = await Promise.all([repo.listPlants(), repo.listEvents()]);
    setPlants(p);
    setEvents(e);
  }, []);

  useEffect(() => {
    (async () => {
      const existing = await repo.listPlants();
      if (existing.length === 0) {
        for (const p of demoSeed(new Date().toISOString())) {
          await repo.savePlant(p);
        }
      }
      await refresh();
      setReady(true);
    })();
  }, [refresh]);

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
    [refresh],
  );

  const updatePlant = useCallback(
    async (plant: Plant) => {
      await repo.savePlant(plant);
      await refresh();
    },
    [refresh],
  );

  const recordCare = useCallback(
    async (plantId: string, opts: CareOpts) => {
      const plant = await repo.getPlant(plantId);
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
    [refresh],
  );

  const removePlant = useCallback(
    async (id: string) => {
      await repo.deletePlant(id);
      await refresh();
    },
    [refresh],
  );

  return (
    <AppContext.Provider
      value={{ ready, plants, events, addPlant, updatePlant, recordCare, removePlant }}
    >
      {children}
    </AppContext.Provider>
  );
}
