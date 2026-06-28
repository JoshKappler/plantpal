// Server-backed settings (per account), mirroring the lib/settingsStore API so
// the settings screen swaps over with a one-line import change.
import { DEFAULT_SETTINGS, type Settings } from "./settingsStore";

export async function loadSettings(): Promise<Settings> {
  const res = await fetch("/api/settings");
  if (!res.ok) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(await res.json()).settings };
}

export async function saveSettings(s: Settings): Promise<void> {
  await fetch("/api/settings", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(s),
  });
}
