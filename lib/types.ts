// Domain types for PlantPal. All dates are ISO 8601 strings.

export type LightLevel = "LOW" | "MEDIUM" | "BRIGHT_INDIRECT" | "DIRECT_SUN";
export type PlantLocation = "INDOOR" | "OUTDOOR";
export type CareType = "WATER" | "FERTILIZE";

export interface Plant {
  id: string;
  name: string;
  species: string;
  speciesSci?: string;
  photoUrl?: string;
  location: PlantLocation;
  room?: string;
  lightLevel: LightLevel;

  // watering
  waterBaseInterval: number; // library seed, kept as a reference
  waterInterval: number; // current adaptive value
  waterLastAt: string;
  waterNextDueAt: string;
  waterLastRemindedOn?: string; // YYYY-MM-DD

  // fertilizing (parallel, optional per plant)
  fertEnabled: boolean;
  fertBaseInterval?: number;
  fertInterval?: number;
  fertLastAt?: string;
  fertNextDueAt?: string;
  fertLastRemindedOn?: string; // YYYY-MM-DD

  notes?: string;
  archived: boolean;
  createdAt: string;
}

export interface CareEvent {
  id: string;
  plantId: string;
  type: CareType;
  occurredAt: string;
  scheduledFor: string;
  daysLate: number; // occurredAt - scheduledFor; negative = early
  intervalBefore: number;
  intervalAfter: number; // === intervalBefore when no adjustment
  note?: string;
}

export interface DailyWeather {
  dateISO: string;
  et0: number; // reference evapotranspiration, mm
  precip: number; // precipitation, mm
}
