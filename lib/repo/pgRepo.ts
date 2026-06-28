import { and, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { careEvents, plants, settings as settingsTable } from "../db/schema";
import { DEFAULT_SETTINGS, type Settings } from "../settingsStore";
import type { PlantRepo } from "./PlantRepo";

/**
 * Postgres-backed PlantRepo, scoped to a single user. This is the "Plan 2"
 * implementation the PlantRepo interface was designed for — same contract as the
 * local IndexedDB repo, so no consumer changes are needed beyond which repo is
 * constructed.
 */
export function makePgRepo(userId: string): PlantRepo {
  const db = getDb();
  return {
    async listPlants() {
      const rows = await db
        .select({ data: plants.data })
        .from(plants)
        .where(eq(plants.userId, userId));
      return rows.map((r) => r.data);
    },

    async getPlant(id) {
      const rows = await db
        .select({ data: plants.data })
        .from(plants)
        .where(and(eq(plants.userId, userId), eq(plants.id, id)));
      return rows[0]?.data ?? null;
    },

    async savePlant(p) {
      await db
        .insert(plants)
        .values({ userId, id: p.id, data: p })
        .onConflictDoUpdate({
          target: [plants.userId, plants.id],
          set: { data: p, updatedAt: new Date() },
        });
    },

    async deletePlant(id) {
      await db
        .delete(plants)
        .where(and(eq(plants.userId, userId), eq(plants.id, id)));
    },

    async listEvents(plantId) {
      const where = plantId
        ? and(eq(careEvents.userId, userId), eq(careEvents.plantId, plantId))
        : eq(careEvents.userId, userId);
      const rows = await db.select({ data: careEvents.data }).from(careEvents).where(where);
      return rows.map((r) => r.data);
    },

    async addEvent(e) {
      await db
        .insert(careEvents)
        .values({ userId, id: e.id, plantId: e.plantId, data: e })
        .onConflictDoUpdate({
          target: [careEvents.userId, careEvents.id],
          set: { data: e, plantId: e.plantId },
        });
    },
  };
}

export async function getServerSettings(userId: string): Promise<Settings> {
  const db = getDb();
  const rows = await db
    .select({ data: settingsTable.data })
    .from(settingsTable)
    .where(eq(settingsTable.userId, userId));
  return { ...DEFAULT_SETTINGS, ...(rows[0]?.data ?? {}) };
}

export async function saveServerSettings(userId: string, s: Settings): Promise<void> {
  const db = getDb();
  await db
    .insert(settingsTable)
    .values({ userId, data: s })
    .onConflictDoUpdate({
      target: settingsTable.userId,
      set: { data: s, updatedAt: new Date() },
    });
}
