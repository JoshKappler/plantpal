"use client";

import { useEffect, useState } from "react";
import { ChipGroup, Field, inputClass, Segmented } from "@/components/forms";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type Settings,
} from "@/lib/settingsStore";

const UNIT_OPTS = [
  { value: "IMPERIAL", label: "°F / in" },
  { value: "METRIC", label: "°C / mm" },
] as const;

const HOURS = Array.from({ length: 24 }, (_, h) => {
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return { value: h, label: `${display}:00 ${period}` };
});

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    void saveSettings(next);
    setSavedAt(true);
    window.setTimeout(() => setSavedAt(false), 1500);
  }

  if (!loaded) return <p className="mt-16 text-center text-moss/50">Loading…</p>;

  return (
    <>
      <header className="mb-5 flex items-baseline justify-between">
        <h1 className="font-display text-3xl">Settings</h1>
        <span
          className={`text-xs font-semibold text-leaf transition-opacity ${
            savedAt ? "opacity-100" : "opacity-0"
          }`}
        >
          Saved ✓
        </span>
      </header>

      <div className="space-y-5">
        <Field label="Your name" hint="Just for a friendly greeting.">
          <input
            value={settings.displayName}
            onChange={(e) => update("displayName", e.target.value)}
            placeholder="e.g. Jamie"
            className={inputClass}
          />
        </Field>

        <Field
          label="Location"
          hint="City or ZIP — powers weather-aware watering for outdoor plants."
        >
          <input
            value={settings.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="e.g. Austin, TX"
            className={inputClass}
          />
        </Field>

        <Field label="Daily reminder time">
          <select
            value={settings.reminderHour}
            onChange={(e) => update("reminderHour", Number(e.target.value))}
            className={inputClass}
          >
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Units">
          <Segmented
            options={UNIT_OPTS}
            value={settings.units}
            onChange={(v) => update("units", v)}
          />
        </Field>
      </div>

      <p className="mt-8 rounded-2xl bg-mist/60 p-4 text-xs leading-relaxed text-moss/55">
        Reminders and weather adjustments turn on once PlantPal is connected to its
        server (added to your Home Screen with notifications allowed). Until then,
        your plants and history are saved right on this device.
      </p>
    </>
  );
}
