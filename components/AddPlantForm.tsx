"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { useApp } from "@/app/providers";
import { lookupPlant } from "@/lib/library";
import type { LibraryEntry } from "@/lib/library";
import type { LightLevel, PlantLocation } from "@/lib/types";
import { SpeciesPicker } from "./SpeciesPicker";
import { ChipGroup, Field, inputClass, Segmented, Stepper, Toggle } from "./forms";
import { PlantGlyph } from "./icons";

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

function dateToISO(d: string): string {
  return new Date(`${d}T12:00:00`).toISOString();
}

interface Suggestion {
  commonName: string;
  sciName: string;
  confidence: number;
}

/** Read a File and downscale to a JPEG data URL (keeps the upload small + cheap to identify). */
function downscale(file: File, max = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas context"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AddPlantForm() {
  const router = useRouter();
  const { addPlant } = useApp();
  const today = format(new Date(), "yyyy-MM-dd");

  const [species, setSpecies] = useState("");
  const [picked, setPicked] = useState<LibraryEntry | null>(null);
  const [sciName, setSciName] = useState<string | undefined>();
  const [identifying, setIdentifying] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [idNote, setIdNote] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState<PlantLocation>("INDOOR");
  const [room, setRoom] = useState("");
  const [light, setLight] = useState<LightLevel>("BRIGHT_INDIRECT");
  const [waterInterval, setWaterInterval] = useState(7);
  const [fertInterval, setFertInterval] = useState(30);
  const [fertEnabled, setFertEnabled] = useState(true);
  const [lastWatered, setLastWatered] = useState(today);
  const [photo, setPhoto] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  function pick(e: LibraryEntry) {
    setSpecies(e.commonName);
    setPicked(e);
    setSciName(e.sciName);
    setLight(e.suggestedLight);
    setWaterInterval(e.waterIntervalDays);
    setFertInterval(e.fertIntervalDays);
    setSuggestions([]);
  }

  function onSpeciesText(t: string) {
    setSpecies(t);
    const m = lookupPlant(t);
    setPicked(m);
    setSciName(m?.sciName);
    if (m) {
      setLight(m.suggestedLight);
      setWaterInterval(m.waterIntervalDays);
      setFertInterval(m.fertIntervalDays);
    }
  }

  /** Apply an identified species: prefer a library match (auto-fills schedule), else keep the name + sci name. */
  function applySuggestion(s: Suggestion) {
    const m = lookupPlant(s.commonName) ?? (s.sciName ? lookupPlant(s.sciName) : null);
    setSpecies(s.commonName);
    if (m) {
      setPicked(m);
      setSciName(m.sciName);
      setLight(m.suggestedLight);
      setWaterInterval(m.waterIntervalDays);
      setFertInterval(m.fertIntervalDays);
    } else {
      setPicked(null);
      setSciName(s.sciName || undefined);
    }
    setSuggestions([]);
    setIdNote(null);
  }

  async function identify(image: string) {
    setIdentifying(true);
    setSuggestions([]);
    setIdNote(null);
    try {
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIdNote(data.error ?? "Couldn't identify that one.");
        return;
      }
      const found: Suggestion[] = data.suggestions ?? [];
      setSuggestions(found);
      if (found.length === 0) setIdNote(data.note || "Couldn't identify that one — type it below.");
    } catch {
      setIdNote("Couldn't reach the identifier — type the species below.");
    } finally {
      setIdentifying(false);
    }
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await downscale(file);
      setPhoto(dataUrl);
      identify(dataUrl);
    } catch {
      // Fall back to the raw file if canvas downscaling fails for some reason.
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        setPhoto(url);
        identify(url);
      };
      reader.readAsDataURL(file);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!species.trim() || saving) return;
    setSaving(true);
    await addPlant({
      name: name.trim() || species.trim(),
      species: species.trim(),
      speciesSci: sciName ?? picked?.sciName,
      photoUrl: photo,
      location,
      room: room.trim() || undefined,
      lightLevel: light,
      waterLastAt: dateToISO(lastWatered),
      fertEnabled,
      waterIntervalDays: waterInterval,
      fertIntervalDays: fertInterval,
    });
    router.push("/");
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-4">
      <label className="flex cursor-pointer items-center gap-4 rounded-3xl bg-card p-3 ring-1 ring-moss/10">
        <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-mist text-leaf-soft">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <PlantGlyph className="h-10 w-12" />
          )}
        </span>
        <span className="text-sm font-semibold text-leaf">
          {photo ? "Change photo" : "Add a photo"}
          <span className="mt-0.5 block text-xs font-normal text-moss/45">
            Optional — helps you spot it at a glance
          </span>
        </span>
        <input type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
      </label>

      {(identifying || suggestions.length > 0 || idNote) && (
        <div className="-mt-2 rounded-2xl bg-mist/60 p-3 text-sm ring-1 ring-moss/10">
          {identifying ? (
            <span className="text-moss/60">Identifying your plant…</span>
          ) : suggestions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-moss/60">Is it one of these?</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={`${s.commonName}|${s.sciName}`}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="rounded-full bg-card px-3 py-1.5 text-left ring-1 ring-moss/15 transition active:scale-95"
                  >
                    <span className="font-semibold text-leaf">{s.commonName}</span>
                    {s.sciName && (
                      <span className="ml-1 text-xs italic text-moss/50">{s.sciName}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <span className="text-moss/60">{idNote}</span>
          )}
        </div>
      )}

      <Field label="Species" hint="Snap a photo above to identify it, or pick from the list to auto-fill a schedule.">
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

      <Field
        label="Watering"
        hint={picked ? `Suggested for ${picked.commonName} — adjust if you like.` : undefined}
      >
        <Stepper value={waterInterval} onChange={setWaterInterval} />
      </Field>

      <Field
        label="Last watered"
        hint="So the schedule starts from reality, not today."
      >
        <input
          type="date"
          value={lastWatered}
          max={today}
          onChange={(e) => setLastWatered(e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="space-y-3">
        <Toggle checked={fertEnabled} onChange={setFertEnabled} label="Track fertilizing too" />
        {fertEnabled && <Stepper value={fertInterval} onChange={setFertInterval} max={365} />}
      </div>

      <button
        type="submit"
        disabled={!species.trim() || saving}
        className="w-full rounded-full bg-leaf py-3.5 text-base font-semibold text-dew transition active:scale-[0.98] disabled:opacity-40"
      >
        {saving ? "Planting…" : "Add to my jungle"}
      </button>
    </form>
  );
}
