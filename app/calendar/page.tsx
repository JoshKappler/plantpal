"use client";

import { useMemo, useState } from "react";
import { addMonths, format, isSameDay, parseISO, startOfMonth, subMonths } from "date-fns";
import { useApp } from "../providers";
import { MonthCalendar } from "@/components/MonthCalendar";
import { ChevronLeft, Droplet, Sprout } from "@/components/icons";

export default function CalendarPage() {
  const { plants, events } = useApp();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(() => new Date());
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.plantId === filter)),
    [events, filter],
  );
  const dayEvents = selected
    ? filtered.filter((e) => isSameDay(parseISO(e.occurredAt), selected))
    : [];
  const nameOf = (id: string) => plants.find((p) => p.id === id)?.name ?? "Plant";

  return (
    <>
      <header className="mb-4">
        <h1 className="font-display text-3xl">Calendar</h1>
        <p className="text-sm text-moss/55">Your watering &amp; feeding rhythm</p>
      </header>

      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4 w-full rounded-2xl bg-card px-4 py-2.5 text-sm font-medium ring-1 ring-moss/10"
      >
        <option value="all">All plants</option>
        {plants.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <div className="rounded-3xl bg-card p-4 ring-1 ring-moss/5">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth(subMonths(month, 1))}
            aria-label="Previous month"
            className="grid h-8 w-8 place-items-center rounded-full bg-mist"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-display text-lg">{format(month, "MMMM yyyy")}</span>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            aria-label="Next month"
            className="grid h-8 w-8 place-items-center rounded-full bg-mist"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </button>
        </div>
        <MonthCalendar
          month={month}
          events={filtered}
          selected={selected}
          onSelect={setSelected}
        />
        <div className="mt-3 flex gap-4 text-xs text-moss/50">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-leaf" />
            Watered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sun" />
            Fertilized
          </span>
        </div>
      </div>

      {selected && (
        <section className="mt-5">
          <h2 className="mb-2 font-display text-lg">
            {format(selected, "EEEE, MMM d")}
          </h2>
          {dayEvents.length === 0 ? (
            <p className="text-sm text-moss/45">Nothing logged this day.</p>
          ) : (
            <ul className="space-y-2">
              {dayEvents.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-moss/5"
                >
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-full bg-mist ${
                      e.type === "WATER" ? "text-leaf" : "text-sun"
                    }`}
                  >
                    {e.type === "WATER" ? (
                      <Droplet className="h-4 w-4" />
                    ) : (
                      <Sprout className="h-4 w-4" />
                    )}
                  </span>
                  <span className="text-sm font-medium">{nameOf(e.plantId)}</span>
                  <span className="ml-auto text-xs text-moss/45">
                    {e.type === "WATER" ? "Watered" : "Fertilized"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
