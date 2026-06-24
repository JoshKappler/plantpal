import { get, set } from "idb-keyval";
import type { CareEvent, Plant } from "../types";
import type { PlantRepo } from "./PlantRepo";

const PLANTS_KEY = "plantpal:plants";
const EVENTS_KEY = "plantpal:events";

async function loadPlants(): Promise<Plant[]> {
  return (await get<Plant[]>(PLANTS_KEY)) ?? [];
}
async function loadEvents(): Promise<CareEvent[]> {
  return (await get<CareEvent[]>(EVENTS_KEY)) ?? [];
}

/** Browser-backed repo using IndexedDB (idb-keyval). */
export function makeLocalRepo(): PlantRepo {
  return {
    async listPlants() {
      return loadPlants();
    },
    async getPlant(id) {
      return (await loadPlants()).find((p) => p.id === id) ?? null;
    },
    async savePlant(p) {
      const all = await loadPlants();
      const idx = all.findIndex((x) => x.id === p.id);
      if (idx >= 0) all[idx] = p;
      else all.push(p);
      await set(PLANTS_KEY, all);
    },
    async deletePlant(id) {
      await set(
        PLANTS_KEY,
        (await loadPlants()).filter((p) => p.id !== id),
      );
    },
    async listEvents(plantId) {
      const all = await loadEvents();
      return plantId ? all.filter((e) => e.plantId === plantId) : all;
    },
    async addEvent(e) {
      const all = await loadEvents();
      all.push(e);
      await set(EVENTS_KEY, all);
    },
  };
}
