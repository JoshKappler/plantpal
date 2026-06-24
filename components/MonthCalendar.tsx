"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CareEvent } from "@/lib/types";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthCalendar({
  month,
  events,
  selected,
  onSelect,
}: {
  month: Date;
  events: CareEvent[];
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 text-center text-xs font-semibold text-moss/40">
        {WEEKDAYS.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const evs = events.filter((e) => isSameDay(parseISO(e.occurredAt), d));
          const hasWater = evs.some((e) => e.type === "WATER");
          const hasFert = evs.some((e) => e.type === "FERTILIZE");
          const inMonth = isSameMonth(d, month);
          const isSel = selected !== null && isSameDay(d, selected);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelect(d)}
              className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition ${
                isSel
                  ? "bg-leaf text-dew"
                  : inMonth
                    ? "text-moss hover:bg-mist"
                    : "text-moss/25"
              }`}
            >
              <span>{format(d, "d")}</span>
              <span className="mt-0.5 flex h-1.5 gap-0.5">
                {hasWater && (
                  <span className={`h-1.5 w-1.5 rounded-full ${isSel ? "bg-dew" : "bg-leaf"}`} />
                )}
                {hasFert && (
                  <span className={`h-1.5 w-1.5 rounded-full ${isSel ? "bg-dew" : "bg-sun"}`} />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
