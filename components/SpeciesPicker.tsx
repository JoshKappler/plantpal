"use client";

import { useState } from "react";
import { searchPlants } from "@/lib/library";
import type { LibraryEntry } from "@/lib/library";

/**
 * Species text field with library autocomplete. Free text is allowed —
 * if nothing is picked, createPlant falls back to safe defaults.
 */
export function SpeciesPicker({
  value,
  onChange,
  onPick,
}: {
  value: string;
  onChange: (text: string) => void;
  onPick: (entry: LibraryEntry) => void;
}) {
  const [open, setOpen] = useState(false);
  const matches = open ? searchPlants(value) : [];

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder="Start typing — e.g. Pothos"
        className="w-full rounded-2xl bg-card px-4 py-3 text-base ring-1 ring-moss/10 placeholder:text-moss/35 focus:ring-2 focus:ring-leaf"
      />
      {matches.length > 0 && (
        <ul className="absolute z-10 mt-1.5 max-h-60 w-full overflow-auto rounded-2xl bg-card p-1.5 shadow-lg ring-1 ring-moss/10">
          {matches.map((m) => (
            <li key={m.sciName}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(m);
                  setOpen(false);
                }}
                className="flex w-full items-baseline justify-between gap-3 rounded-xl px-3 py-2 text-left hover:bg-mist"
              >
                <span className="font-medium">{m.commonName}</span>
                <span className="truncate text-xs italic text-moss/45">
                  {m.sciName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
