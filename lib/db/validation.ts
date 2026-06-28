import { z } from "zod";

/**
 * Boundary validation for anything a client POSTs to the data routes. The shapes
 * mirror lib/types.ts / lib/settingsStore.ts; pgRepo's columns are typed against
 * those domain types, so TypeScript flags any drift between these schemas and the
 * canonical types where the parsed value is saved.
 */

const lightLevel = z.enum(["LOW", "MEDIUM", "BRIGHT_INDIRECT", "DIRECT_SUN"]);
const plantLocation = z.enum(["INDOOR", "OUTDOOR"]);
const careType = z.enum(["WATER", "FERTILIZE"]);

export const plantSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  species: z.string(),
  speciesSci: z.string().optional(),
  photoUrl: z.string().optional(),
  location: plantLocation,
  room: z.string().optional(),
  lightLevel,

  waterBaseInterval: z.number(),
  waterInterval: z.number(),
  waterLastAt: z.string(),
  waterNextDueAt: z.string(),
  waterLastRemindedOn: z.string().optional(),

  fertEnabled: z.boolean(),
  fertBaseInterval: z.number().optional(),
  fertInterval: z.number().optional(),
  fertLastAt: z.string().optional(),
  fertNextDueAt: z.string().optional(),
  fertLastRemindedOn: z.string().optional(),

  notes: z.string().optional(),
  archived: z.boolean(),
  createdAt: z.string(),
});

export const careEventSchema = z.object({
  id: z.string().min(1),
  plantId: z.string().min(1),
  type: careType,
  occurredAt: z.string(),
  scheduledFor: z.string(),
  daysLate: z.number(),
  intervalBefore: z.number(),
  intervalAfter: z.number(),
  note: z.string().optional(),
});

export const settingsSchema = z.object({
  displayName: z.string(),
  location: z.string(),
  reminderHour: z.number().int().min(0).max(23),
  units: z.enum(["IMPERIAL", "METRIC"]),
});

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));
export const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(200);

export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
