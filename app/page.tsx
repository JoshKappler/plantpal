"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "./providers";
import { PlantCard } from "@/components/PlantCard";
import { LeafGlyph } from "@/components/icons";
import { dueStatus } from "@/lib/dueDate";
import { TONE_RANK } from "@/lib/labels";

export default function HomePage() {
  const { ready, plants } = useApp();
  const [nowISO] = useState(() => new Date().toISOString());

  const sorted = useMemo(
    () =>
      [...plants]
        .filter((p) => !p.archived)
        .map((p) => ({ p, s: dueStatus(p.waterNextDueAt, nowISO) }))
        .sort(
          (a, b) =>
            TONE_RANK[a.s.state] - TONE_RANK[b.s.state] || a.s.days - b.s.days,
        ),
    [plants, nowISO],
  );

  const needWater = sorted.filter((x) => x.s.state !== "ok").length;

  if (!ready) {
    return (
      <p className="mt-16 text-center text-moss/50">Waking up the greenhouse…</p>
    );
  }

  return (
    <>
      <header className="mb-6">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-leaf">
          Your jungle
        </p>
        <h1 className="mt-1 font-display text-3xl leading-tight">
          {needWater > 0 ? (
            <>
              {needWater} {needWater === 1 ? "plant needs" : "plants need"} a{" "}
              <span className="italic text-leaf">drink</span>
            </>
          ) : (
            <>
              Everyone&apos;s <span className="italic text-leaf">happy</span> today
            </>
          )}
        </h1>
        <p className="mt-1 text-sm text-moss/55">
          {plants.length} {plants.length === 1 ? "plant" : "plants"} in your care
        </p>
      </header>

      {sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {sorted.map(({ p }, i) => (
            <PlantCard key={p.id} plant={p} nowISO={nowISO} index={i} />
          ))}
        </div>
      )}
    </>
  );
}

function EmptyState() {
  return (
    <div className="rise mt-10 flex flex-col items-center rounded-3xl bg-card px-6 py-12 text-center ring-1 ring-moss/5">
      <LeafGlyph className="h-14 w-14 text-leaf-soft" />
      <h2 className="mt-4 font-display text-xl italic">No plants yet</h2>
      <p className="mt-1 max-w-xs text-sm text-moss/55">
        Add your first leafy friend and PlantPal will keep its watering on track.
      </p>
      <Link
        href="/add"
        className="mt-5 rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-dew transition active:scale-95"
      >
        Add a plant
      </Link>
    </div>
  );
}
