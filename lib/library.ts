import libraryData from "@/data/plant-library.json";
import { CARE } from "./config";
import type { LightLevel } from "./types";

export interface LibraryEntry {
  commonName: string;
  sciName: string;
  aliases: string[];
  waterIntervalDays: number;
  fertIntervalDays: number;
  suggestedLight: LightLevel;
}

const LIBRARY = libraryData as LibraryEntry[];

export function allLibraryPlants(): LibraryEntry[] {
  return LIBRARY;
}

/** Exact (case-insensitive) match on common name, scientific name, or an alias. */
export function lookupPlant(query: string): LibraryEntry | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  for (const e of LIBRARY) {
    if (e.commonName.toLowerCase() === q) return e;
    if (e.sciName.toLowerCase() === q) return e;
    if (e.aliases.some((a) => a.toLowerCase() === q)) return e;
  }
  return null;
}

/** Fuzzy "contains" search for the add-plant autocomplete. */
export function searchPlants(query: string, limit = 8): LibraryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return LIBRARY.filter(
    (e) =>
      e.commonName.toLowerCase().includes(q) ||
      e.sciName.toLowerCase().includes(q) ||
      e.aliases.some((a) => a.toLowerCase().includes(q)),
  ).slice(0, limit);
}

export function defaultSeed(): {
  waterIntervalDays: number;
  fertIntervalDays: number;
  suggestedLight: LightLevel;
} {
  return {
    waterIntervalDays: CARE.DEFAULT_INTERVAL,
    fertIntervalDays: CARE.DEFAULT_FERT_INTERVAL,
    suggestedLight: "BRIGHT_INDIRECT",
  };
}
