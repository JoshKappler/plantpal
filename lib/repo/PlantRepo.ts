import type { CareEvent, Plant } from "../types";

/**
 * Storage contract for plants + care history. Plan 1 ships memory/local
 * implementations; Plan 2 adds a Postgres implementation behind this same
 * interface (no consumer changes needed).
 */
export interface PlantRepo {
  listPlants(): Promise<Plant[]>;
  getPlant(id: string): Promise<Plant | null>;
  savePlant(p: Plant): Promise<void>;
  deletePlant(id: string): Promise<void>;
  listEvents(plantId?: string): Promise<CareEvent[]>;
  addEvent(e: CareEvent): Promise<void>;
}
