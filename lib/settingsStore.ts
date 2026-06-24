import { get, set } from "idb-keyval";
import { CARE } from "./config";

export interface Settings {
  displayName: string;
  location: string; // city or ZIP, used by the weather engine in Plan 2
  reminderHour: number; // 0-23, local
  units: "IMPERIAL" | "METRIC";
}

const KEY = "plantpal:settings";

export const DEFAULT_SETTINGS: Settings = {
  displayName: "",
  location: "",
  reminderHour: CARE.DEFAULT_REMINDER_HOUR,
  units: "IMPERIAL",
};

export async function loadSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...((await get<Settings>(KEY)) ?? {}) };
}

export async function saveSettings(s: Settings): Promise<void> {
  await set(KEY, s);
}
