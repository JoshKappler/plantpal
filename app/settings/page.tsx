"use client";

import { useEffect, useState } from "react";
import { Field, inputClass, Segmented } from "@/components/forms";
import { loadSettings, saveSettings } from "@/lib/settingsApi";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settingsStore";
import { useApp } from "../providers";

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
  const { auth, signOut } = useApp();
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

      <div className="mt-8 border-t border-moss/10 pt-6">
        <div className="mb-1.5 text-sm font-semibold text-moss/80">Account</div>
        <div className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 ring-1 ring-moss/10">
          <span className="truncate text-sm text-moss/70">
            {auth.email ?? "Signed in"}
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="shrink-0 rounded-full bg-mist px-4 py-2 text-sm font-semibold text-moss/70 transition active:scale-95"
          >
            Sign out
          </button>
        </div>
        <p className="mt-1 text-xs text-moss/45">
          Your plants and history are saved to your account, so they&apos;re safe
          across devices and reinstalls.
        </p>
      </div>
    </>
  );
}
