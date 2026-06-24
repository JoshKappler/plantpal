import type { CareEvent, Plant } from "../types";
import type { PlantRepo } from "./PlantRepo";

/** In-memory repo — used for tests and as the contract reference. */
export function makeMemoryRepo(seed?: {
  plants?: Plant[];
  events?: CareEvent[];
}): PlantRepo {
  const plants = new Map<string, Plant>();
  const events: CareEvent[] = [];
  seed?.plants?.forEach((p) => plants.set(p.id, p));
  if (seed?.events) events.push(...seed.events);

  return {
    async listPlants() {
      return [...plants.values()];
    },
    async getPlant(id) {
      return plants.get(id) ?? null;
    },
    async savePlant(p) {
      plants.set(p.id, p);
    },
    async deletePlant(id) {
      plants.delete(id);
    },
    async listEvents(plantId) {
      return plantId ? events.filter((e) => e.plantId === plantId) : [...events];
    },
    async addEvent(e) {
      events.push(e);
    },
  };
}
