import {
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { CareEvent, Plant } from "../types";
import type { Settings } from "../settingsStore";

/**
 * Storage is intentionally thin: plants/events/settings are kept as JSONB blobs
 * keyed by (userId, id), so the domain types in lib/types.ts stay the single
 * source of truth. The server PlantRepo (lib/repo/pgRepo.ts) is a pass-through;
 * payloads are validated with Zod (lib/db/validation.ts) before they land here.
 */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const plants = pgTable(
  "plants",
  {
    userId: text("user_id").notNull(),
    id: text("id").notNull(),
    data: jsonb("data").notNull().$type<Plant>(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);

export const careEvents = pgTable(
  "care_events",
  {
    userId: text("user_id").notNull(),
    id: text("id").notNull(),
    plantId: text("plant_id").notNull(),
    data: jsonb("data").notNull().$type<CareEvent>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    index("care_events_user_plant_idx").on(t.userId, t.plantId),
  ],
);

export const settings = pgTable("settings", {
  userId: text("user_id").primaryKey(),
  data: jsonb("data").notNull().$type<Settings>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
