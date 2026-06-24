"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useApp } from "@/app/providers";
import { adjustInterval, daysBetween } from "@/lib/intervalEngine";
import type { CareType, Plant } from "@/lib/types";
import { inputClass } from "./forms";

function dateToISO(d: string): string {
  return new Date(`${d}T12:00:00`).toISOString();
}

export function CareConfirmSheet({
  plant,
  type,
  onClose,
}: {
  plant: Plant;
  type: CareType;
  onClose: () => void;
}) {
  const { recordCare } = useApp();
  const today = format(new Date(), "yyyy-MM-dd");
  const [when, setWhen] = useState(today);
  const [choice, setChoice] = useState<"keep" | "adjust">("keep");
  const [saving, setSaving] = useState(false);

  const isWater = type === "WATER";
  const verb = isWater ? "Watered" : "Fertilized";
  const current = isWater ? plant.waterInterval : plant.fertInterval ?? 30;
  const lastAt = isWater ? plant.waterLastAt : plant.fertLastAt ?? plant.createdAt;
  const scheduledFor = isWater
    ? plant.waterNextDueAt
    : plant.fertNextDueAt ?? plant.createdAt;

  const occurredISO = dateToISO(when);
  const daysLate = daysBetween(scheduledFor, occurredISO);
  const elapsed = daysBetween(lastAt, occurredISO);
  const suggested = adjustInterval(current, elapsed);
  const offSchedule = daysLate !== 0 && suggested !== current;
  const late = daysLate > 0;

  async function confirm() {
    setSaving(true);
    await recordCare(plant.id, {
      type,
      occurredAtISO: occurredISO,
      adjust: offSchedule && choice === "adjust" ? (late ? "lengthen" : "shorten") : "keep",
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-30 mx-auto flex w-full max-w-md items-end">
      <button
        type="button"
        aria-label="Cancel"
        onClick={onClose}
        className="absolute inset-0 bg-moss/40 backdrop-blur-sm"
      />
      <div className="rise relative w-full rounded-t-3xl bg-dew p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-moss/15" />
        <h2 className="font-display text-2xl">
          {verb} <span className="italic text-leaf">{plant.name}</span>
        </h2>

        <div className="mt-4">
          <div className="mb-1.5 text-sm font-semibold text-moss/80">When?</div>
          <input
            type="date"
            value={when}
            max={today}
            onChange={(e) => {
              setWhen(e.target.value);
              setChoice("keep");
            }}
            className={inputClass}
          />
        </div>

        {offSchedule && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-moss/70">
              That&apos;s{" "}
              <strong>
                {Math.abs(daysLate)} {Math.abs(daysLate) === 1 ? "day" : "days"}{" "}
                {late ? "later" : "earlier"}
              </strong>{" "}
              than planned. Update the schedule?
            </p>
            <div className="space-y-2">
              <ChoiceRow
                selected={choice === "keep"}
                onClick={() => setChoice("keep")}
                title={`Keep every ${current} days`}
                subtitle="One-off — don't change anything"
              />
              <ChoiceRow
                selected={choice === "adjust"}
                onClick={() => setChoice("adjust")}
                title={`${late ? "Stretch" : "Tighten"} to every ${suggested} days`}
                subtitle={
                  late
                    ? "It didn't need water that soon"
                    : "It needed water sooner than planned"
                }
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={confirm}
          disabled={saving}
          className="mt-5 w-full rounded-full bg-leaf py-3.5 text-base font-semibold text-dew transition active:scale-[0.98] disabled:opacity-40"
        >
          {saving ? "Saving…" : `Mark ${verb.toLowerCase()}`}
        </button>
      </div>
    </div>
  );
}

function ChoiceRow({
  selected,
  onClick,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition ${
        selected ? "bg-card ring-2 ring-leaf" : "bg-card/60 ring-moss/10"
      }`}
    >
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ring-2 ${
          selected ? "ring-leaf" : "ring-moss/25"
        }`}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-leaf" />}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-moss/50">{subtitle}</span>
      </span>
    </button>
  );
}
