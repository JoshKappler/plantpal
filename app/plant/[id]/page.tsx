"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { useApp } from "@/app/providers";
import { CareConfirmSheet } from "@/components/CareConfirmSheet";
import { ChevronLeft, Droplet, PlantGlyph, Sprout } from "@/components/icons";
import { StatusMeter } from "@/components/StatusMeter";
import { dueStatus } from "@/lib/dueDate";
import type { CareEvent, CareType, Plant } from "@/lib/types";

const LIGHT_LABEL: Record<string, string> = {
  LOW: "Low light",
  MEDIUM: "Medium light",
  BRIGHT_INDIRECT: "Bright indirect",
  DIRECT_SUN: "Direct sun",
};

export default function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, plants, events, removePlant } = useApp();
  const [nowISO] = useState(() => new Date().toISOString());
  const [sheet, setSheet] = useState<CareType | null>(null);

  const plant = plants.find((p) => p.id === id);
  const history = useMemo(
    () =>
      events
        .filter((e) => e.plantId === id)
        .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)),
    [events, id],
  );

  if (!ready) return <p className="mt-16 text-center text-moss/50">Loading…</p>;
  if (!plant)
    return (
      <div className="mt-16 text-center">
        <p className="text-moss/55">That plant isn&apos;t here anymore.</p>
        <Link href="/" className="mt-3 inline-block font-semibold text-leaf">
          Back to your jungle
        </Link>
      </div>
    );

  async function remove() {
    if (window.confirm(`Remove ${plant!.name}? This can't be undone.`)) {
      await removePlant(plant!.id);
      router.push("/");
    }
  }

  return (
    <>
      <header className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full bg-card ring-1 ring-moss/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href={`/plant/${plant.id}/edit`}
            className="text-sm font-semibold text-leaf"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={remove}
            className="text-sm font-semibold text-bloom/80"
          >
            Remove
          </button>
        </div>
      </header>

      <div className="overflow-hidden rounded-3xl bg-card ring-1 ring-moss/5">
        <div className="aspect-[3/2] w-full bg-mist">
          {plant.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={plant.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-leaf-soft">
              <PlantGlyph className="h-20 w-24" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h1 className="font-display text-3xl italic leading-tight">{plant.name}</h1>
          <p className="mt-0.5 text-sm text-moss/55">
            {plant.species}
            {plant.speciesSci ? ` · ${plant.speciesSci}` : ""}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-moss/45">
            {plant.location === "INDOOR" ? "Indoor" : "Outdoor"}
            {plant.room ? ` · ${plant.room}` : ""} · {LIGHT_LABEL[plant.lightLevel]}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <ScheduleCard
          kind="water"
          plant={plant}
          nowISO={nowISO}
          onLog={() => setSheet("WATER")}
        />
        {plant.fertEnabled && (
          <ScheduleCard
            kind="fert"
            plant={plant}
            nowISO={nowISO}
            onLog={() => setSheet("FERTILIZE")}
          />
        )}
      </div>

      <section className="mt-6">
        <h2 className="mb-2 font-display text-xl">History</h2>
        {history.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-sm text-moss/50 ring-1 ring-moss/5">
            Nothing logged yet. Tap a button above when you water or feed it.
          </p>
        ) : (
          <ul className="space-y-2">
            {history.map((e) => (
              <HistoryRow key={e.id} event={e} />
            ))}
          </ul>
        )}
      </section>

      {sheet && (
        <CareConfirmSheet plant={plant} type={sheet} onClose={() => setSheet(null)} />
      )}
    </>
  );
}

function ScheduleCard({
  kind,
  plant,
  nowISO,
  onLog,
}: {
  kind: "water" | "fert";
  plant: Plant;
  nowISO: string;
  onLog: () => void;
}) {
  const isWater = kind === "water";
  const interval = isWater ? plant.waterInterval : plant.fertInterval ?? 30;
  const lastAt = isWater ? plant.waterLastAt : plant.fertLastAt;
  const nextDue = isWater ? plant.waterNextDueAt : plant.fertNextDueAt;
  const status = nextDue ? dueStatus(nextDue, nowISO) : null;
  const Icon = isWater ? Droplet : Sprout;

  return (
    <div className="rounded-3xl bg-card p-4 ring-1 ring-moss/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${isWater ? "text-leaf" : "text-sun"}`} />
          <h3 className="font-semibold">{isWater ? "Watering" : "Fertilizing"}</h3>
        </div>
        {status && <StatusMeter state={status.state} days={status.days} kind={kind} />}
      </div>
      <p className="mt-2 text-sm text-moss/60">
        Every {interval} days
        {lastAt ? ` · last on ${format(parseISO(lastAt), "MMM d")}` : " · not logged yet"}
      </p>
      <button
        type="button"
        onClick={onLog}
        className={`mt-3 w-full rounded-full py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
          isWater ? "bg-leaf text-dew" : "bg-sun text-moss"
        }`}
      >
        {isWater ? "I watered it" : "I fertilized it"}
      </button>
    </div>
  );
}

function HistoryRow({ event }: { event: CareEvent }) {
  const isWater = event.type === "WATER";
  const Icon = isWater ? Droplet : Sprout;
  const changed = event.intervalAfter !== event.intervalBefore;
  const lateLabel =
    event.daysLate === 0
      ? "on time"
      : event.daysLate > 0
        ? `${event.daysLate}d late`
        : `${Math.abs(event.daysLate)}d early`;

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-moss/5">
      <span className={`grid h-9 w-9 place-items-center rounded-full bg-mist ${isWater ? "text-leaf" : "text-sun"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {format(parseISO(event.occurredAt), "EEE, MMM d")}
        </p>
        <p className="text-xs text-moss/50">
          {isWater ? "Watered" : "Fertilized"} · {lateLabel}
          {changed && ` · now every ${event.intervalAfter}d`}
        </p>
      </div>
    </li>
  );
}
