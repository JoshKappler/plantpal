"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/app/providers";
import { dueStatus } from "@/lib/dueDate";
import type { Plant } from "@/lib/types";
import { Droplet, PlantGlyph } from "./icons";
import { StatusMeter } from "./StatusMeter";

export function PlantCard({
  plant,
  nowISO,
  index = 0,
}: {
  plant: Plant;
  nowISO: string;
  index?: number;
}) {
  const { recordCare } = useApp();
  const [rippling, setRippling] = useState(false);
  const water = dueStatus(plant.waterNextDueAt, nowISO);

  async function waterNow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setRippling(true);
    await recordCare(plant.id, {
      type: "WATER",
      occurredAtISO: new Date().toISOString(),
      adjust: "keep",
    });
    window.setTimeout(() => setRippling(false), 600);
  }

  return (
    <Link
      href={`/plant/${plant.id}`}
      className="rise group relative flex flex-col overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-moss/5 transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-mist">
        {plant.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plant.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-leaf-soft">
            <PlantGlyph className="h-16 w-20" />
          </div>
        )}
        <span className="absolute left-2 top-2">
          <StatusMeter state={water.state} days={water.days} />
        </span>
      </div>

      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg italic leading-tight">
            {plant.name}
          </h3>
          <p className="truncate text-xs text-moss/55">
            {plant.species}
            {plant.room ? ` · ${plant.room}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={waterNow}
          aria-label={`Mark ${plant.name} watered`}
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf text-dew transition active:scale-90"
        >
          <Droplet className="h-4 w-4" />
          {rippling && (
            <span className="ripple pointer-events-none absolute inset-0 rounded-full bg-leaf" />
          )}
        </button>
      </div>
    </Link>
  );
}
