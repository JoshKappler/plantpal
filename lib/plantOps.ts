import { CARE } from "./config";
import { nextDue } from "./dueDate";
import { adjustInterval, daysBetween } from "./intervalEngine";
import { defaultSeed, lookupPlant } from "./library";
import type { CareEvent, CareType, LightLevel, Plant, PlantLocation } from "./types";

export interface CreatePlantInput {
  id: string;
  createdAt: string; // ISO "now" supplied by the caller (keeps this pure)
  name: string;
  species: string;
  speciesSci?: string;
  photoUrl?: string;
  location: PlantLocation;
  room?: string;
  lightLevel?: LightLevel; // falls back to the library suggestion
  waterLastAt: string; // user-set last-watered date — schedule starts here
  fertEnabled?: boolean;
  fertLastAt?: string;
  notes?: string;
  waterIntervalDays?: number; // explicit override (editable in the form)
  fertIntervalDays?: number;
}

/** Build a Plant, seeding intervals/light from the library (or safe defaults). */
export function createPlant(input: CreatePlantInput): Plant {
  const lib = lookupPlant(input.species);
  const seed = defaultSeed();
  const waterInterval =
    input.waterIntervalDays ?? lib?.waterIntervalDays ?? seed.waterIntervalDays;
  const fertInterval =
    input.fertIntervalDays ?? lib?.fertIntervalDays ?? seed.fertIntervalDays;
  const lightLevel = input.lightLevel ?? lib?.suggestedLight ?? seed.suggestedLight;
  const fertEnabled = input.fertEnabled ?? true;
  const fertAnchor = input.fertLastAt ?? input.createdAt;

  return {
    id: input.id,
    name: input.name,
    species: input.species,
    speciesSci: input.speciesSci ?? lib?.sciName,
    photoUrl: input.photoUrl,
    location: input.location,
    room: input.room,
    lightLevel,
    waterBaseInterval: waterInterval,
    waterInterval,
    waterLastAt: input.waterLastAt,
    waterNextDueAt: nextDue(input.waterLastAt, waterInterval),
    fertEnabled,
    fertBaseInterval: fertInterval,
    fertInterval,
    fertLastAt: input.fertLastAt,
    fertNextDueAt: fertEnabled ? nextDue(fertAnchor, fertInterval) : undefined,
    notes: input.notes,
    archived: false,
    createdAt: input.createdAt,
  };
}

export interface ApplyCareInput {
  eventId: string;
  type: CareType;
  occurredAtISO: string;
  /** "keep" leaves the interval; otherwise it eases toward observed cadence. */
  adjust: "lengthen" | "shorten" | "keep";
  note?: string;
}

/** Record a care event and roll the plant's schedule forward. */
export function applyCare(
  plant: Plant,
  input: ApplyCareInput,
): { plant: Plant; event: CareEvent } {
  const isWater = input.type === "WATER";
  const lastAt = isWater ? plant.waterLastAt : plant.fertLastAt ?? plant.createdAt;
  const scheduledFor = isWater
    ? plant.waterNextDueAt
    : plant.fertNextDueAt ?? plant.createdAt;
  const intervalBefore = isWater
    ? plant.waterInterval
    : plant.fertInterval ?? CARE.DEFAULT_FERT_INTERVAL;

  const actualElapsed = daysBetween(lastAt, input.occurredAtISO);
  const intervalAfter =
    input.adjust === "keep"
      ? intervalBefore
      : adjustInterval(intervalBefore, actualElapsed);
  const daysLate = daysBetween(scheduledFor, input.occurredAtISO);

  const event: CareEvent = {
    id: input.eventId,
    plantId: plant.id,
    type: input.type,
    occurredAt: input.occurredAtISO,
    scheduledFor,
    daysLate,
    intervalBefore,
    intervalAfter,
    note: input.note,
  };

  const newNextDue = nextDue(input.occurredAtISO, intervalAfter);
  const updated: Plant = isWater
    ? {
        ...plant,
        waterInterval: intervalAfter,
        waterLastAt: input.occurredAtISO,
        waterNextDueAt: newNextDue,
        waterLastRemindedOn: undefined,
      }
    : {
        ...plant,
        fertInterval: intervalAfter,
        fertLastAt: input.occurredAtISO,
        fertNextDueAt: newNextDue,
        fertLastRemindedOn: undefined,
      };

  return { plant: updated, event };
}
