"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/app/providers";
import { nextDue } from "@/lib/dueDate";
import { lookupPlant } from "@/lib/library";
import type { LibraryEntry } from "@/lib/library";
import type { LightLevel, Plant, PlantLocation } from "@/lib/types";
import { SpeciesPicker } from "./SpeciesPicker";
import { ChipGroup, Field, inputClass, Segmented, Stepper, Toggle } from "./forms";

const LIGHT_OPTS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "BRIGHT_INDIRECT", label: "Bright indirect" },
  { value: "DIRECT_SUN", label: "Direct sun" },
] as const;

const LOCATION_OPTS = [
  { value: "INDOOR", label: "Indoor" },
  { value: "OUTDOOR", label: "Outdoor" },
] as const;

/** Edit an existing plant's details. Schedule next-due dates are recomputed from the
 *  plant's last-care dates whenever an interval changes, so adjustments take effect now. */
export function EditPlantForm({ plant }: { plant: Plant }) {
  const router = useRouter();
  const { updatePlant } = useApp();

  const [species, setSpecies] = useState(plant.species);
  const [sciName, setSciName] = useState<string | undefined>(plant.speciesSci);
  const [name, setName] = useState(plant.name);
  const [location, setLocation] = useState<PlantLocation>(plant.location);
  const [room, setRoom] = useState(plant.room ?? "");
  const [light, setLight] = useState<LightLevel>(plant.lightLevel);
  const [waterInterval, setWaterInterval] = useState(plant.waterInterval);
  const [fertEnabled, setFertEnabled] = useState(plant.fertEnabled);
  const [fertInterval, setFertInterval] = useState(plant.fertInterval ?? 30);
  const [saving, setSaving] = useState(false);

  function pick(e: LibraryEntry) {
    setSpecies(e.commonName);
    setSciName(e.sciName);
    setLight(e.suggestedLight);
    setWaterInterval(e.waterIntervalDays);
    setFertInterval(e.fertIntervalDays);
  }

  function onSpeciesText(t: string) {
    setSpecies(t);
    const m = lookupPlant(t);
    if (m) setSciName(m.sciName);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!species.trim() || saving) return;
    setSaving(true);

    const fertAnchor = plant.fertLastAt ?? plant.createdAt;
    const updated: Plant = {
      ...plant,
      name: name.trim() || species.trim(),
      species: species.trim(),
      speciesSci: sciName,
      location,
      room: room.trim() || undefined,
      lightLevel: light,
      waterInterval,
      waterNextDueAt: nextDue(plant.waterLastAt, waterInterval),
      fertEnabled,
      fertInterval,
      fertNextDueAt: fertEnabled ? nextDue(fertAnchor, fertInterval) : undefined,
    };

    await updatePlant(updated);
    router.push(`/plant/${plant.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-4">
      <Field label="Species" hint="Pick from the list to auto-fill a suggested schedule.">
        <SpeciesPicker value={species} onChange={onSpeciesText} onPick={pick} />
      </Field>

      <Field label="Nickname" hint="What you call it. Leave blank to use the species.">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Gerald"
          className={inputClass}
        />
      </Field>

      <Field label="Where does it live?">
        <Segmented options={LOCATION_OPTS} value={location} onChange={setLocation} />
      </Field>

      <Field label="Room">
        <input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="e.g. Living room"
          className={inputClass}
        />
      </Field>

      <Field label="Light">
        <ChipGroup options={LIGHT_OPTS} value={light} onChange={setLight} />
      </Field>

      <Field label="Watering" hint="How often it needs water. Changing this reschedules the next due date.">
        <Stepper value={waterInterval} onChange={setWaterInterval} />
      </Field>

      <div className="space-y-3">
        <Toggle checked={fertEnabled} onChange={setFertEnabled} label="Track fertilizing too" />
        {fertEnabled && <Stepper value={fertInterval} onChange={setFertInterval} max={365} />}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push(`/plant/${plant.id}`)}
          className="flex-1 rounded-full bg-card py-3.5 text-base font-semibold text-moss/70 ring-1 ring-moss/10 transition active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!species.trim() || saving}
          className="flex-1 rounded-full bg-leaf py-3.5 text-base font-semibold text-dew transition active:scale-[0.98] disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
