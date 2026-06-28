import type { CareEvent, Plant } from "../types";
import type { PlantRepo } from "./PlantRepo";

/** Thrown when a data request comes back 401 — the session has gone. */
export class Unauthorized extends Error {
  constructor() {
    super("unauthorized");
    this.name = "Unauthorized";
  }
}

async function jsonOrThrow(res: Response) {
  if (res.status === 401) throw new Unauthorized();
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json();
}

const postJson = (url: string, body: unknown) =>
  fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

/** Client-side PlantRepo that talks to the user-scoped /api routes. */
export function makeApiRepo(): PlantRepo {
  return {
    async listPlants(): Promise<Plant[]> {
      return (await jsonOrThrow(await fetch("/api/plants"))).plants;
    },
    async getPlant(id) {
      const plants: Plant[] = (await jsonOrThrow(await fetch("/api/plants"))).plants;
      return plants.find((p) => p.id === id) ?? null;
    },
    async savePlant(p) {
      await jsonOrThrow(await postJson("/api/plants", p));
    },
    async deletePlant(id) {
      await jsonOrThrow(await fetch(`/api/plants/${encodeURIComponent(id)}`, { method: "DELETE" }));
    },
    async listEvents(plantId): Promise<CareEvent[]> {
      const q = plantId ? `?plantId=${encodeURIComponent(plantId)}` : "";
      return (await jsonOrThrow(await fetch(`/api/events${q}`))).events;
    },
    async addEvent(e) {
      await jsonOrThrow(await postJson("/api/events", e));
    },
  };
}
