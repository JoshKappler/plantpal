# PlantPal Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the scaffold, the unit-tested pure logic core (adaptive intervals, due-dates, weather model, library lookup), and a runnable local-data PWA prototype (plant grid, add/detail/confirm, calendar, settings) that works on Windows with no external API keys.

**Architecture:** Next.js (App Router, TS) + Tailwind. All care logic lives in pure, dependency-free functions in `lib/` and is Vitest-tested. Data goes through a `PlantRepo` interface; this plan ships a `localStorage`/in-memory implementation so the prototype runs with zero backend. Plan 2 adds a Postgres `PlantRepo` behind the same interface.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Vitest, date-fns, idb-keyval (for localStorage-ish async store), Next PWA manifest + service worker.

## Global Constraints

- Single-user app; data scoped to one local profile in this plan (no auth yet).
- Pure logic in `lib/**` must not import React, Next, or do I/O — only takes explicit args (no `Date.now()` inside; callers pass `now`).
- Units default IMPERIAL; reminder default hour 9; safe-default interval 7 days when library misses.
- Adaptive DAMPING = 0.5; interval clamp [1, 120] days.
- Weather shift capped at ±40% of interval; indoor plants skip weather entirely.
- Botanical visual direction: soft greens/cream, rounded cards, photo-forward.
- All constants centralized in `lib/config.ts`.
- Frequent commits — one per task.

---

### Task 1: Scaffold Next.js + Tailwind + Vitest

**Files:**
- Create: project via `create-next-app` (App Router, TS, Tailwind, ESLint, no src dir, import alias `@/*`)
- Create: `vitest.config.ts`, `lib/.gitkeep`
- Modify: `package.json` (add test script + deps)

**Interfaces:**
- Produces: a running dev server (`npm run dev`) and `npm test` wired to Vitest.

- [ ] **Step 1:** Scaffold in place (the repo dir already exists with `docs/`):
  `npx create-next-app@latest . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --yes`
- [ ] **Step 2:** Add deps: `npm i date-fns idb-keyval` and `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`
- [ ] **Step 3:** Create `vitest.config.ts` with jsdom env + `@` alias; add `"test": "vitest run"` and `"test:watch": "vitest"` to package.json scripts.
- [ ] **Step 4:** Add a trivial `lib/sanity.test.ts` (`expect(1+1).toBe(2)`); run `npm test`; expect PASS.
- [ ] **Step 5:** Verify `npm run build` succeeds. Commit: `chore: scaffold next.js + tailwind + vitest`.

---

### Task 2: Config constants

**Files:**
- Create: `lib/config.ts`

**Interfaces:**
- Produces: `export const CARE = { DAMPING:0.5, MIN_INTERVAL:1, MAX_INTERVAL:120, DEFAULT_INTERVAL:7, DEFAULT_REMINDER_HOUR:9 }` and `export const WEATHER = { ET0_REF:3.8, RAIN_EFFECT:0.9, MAX_SHIFT_FRAC:0.4, LIGHT_MULT:{LOW:0.7, MEDIUM:0.9, BRIGHT_INDIRECT:1.1, DIRECT_SUN:1.35} }`

- [ ] **Step 1:** Write `lib/config.ts` exporting the two frozen objects above with `as const`.
- [ ] **Step 2:** Commit: `feat: central care/weather config constants`.

---

### Task 3: Domain types

**Files:**
- Create: `lib/types.ts`

**Interfaces:**
- Produces:
```ts
export type LightLevel = "LOW" | "MEDIUM" | "BRIGHT_INDIRECT" | "DIRECT_SUN";
export type PlantLocation = "INDOOR" | "OUTDOOR";
export type CareType = "WATER" | "FERTILIZE";
export interface Plant {
  id: string; name: string; species: string; speciesSci?: string; photoUrl?: string;
  location: PlantLocation; room?: string; lightLevel: LightLevel;
  waterBaseInterval: number; waterInterval: number; waterLastAt: string; waterNextDueAt: string; waterLastRemindedOn?: string;
  fertEnabled: boolean; fertBaseInterval?: number; fertInterval?: number; fertLastAt?: string; fertNextDueAt?: string; fertLastRemindedOn?: string;
  notes?: string; archived: boolean; createdAt: string;
}
export interface CareEvent {
  id: string; plantId: string; type: CareType; occurredAt: string; scheduledFor: string;
  daysLate: number; intervalBefore: number; intervalAfter: number; note?: string;
}
export interface DailyWeather { dateISO: string; et0: number; precip: number; }
```
(All dates are ISO strings.)

- [ ] **Step 1:** Write `lib/types.ts` with the above.
- [ ] **Step 2:** Commit: `feat: domain types`.

---

### Task 4: Adaptive interval engine (TDD)

**Files:**
- Create: `lib/intervalEngine.ts`, `lib/intervalEngine.test.ts`

**Interfaces:**
- Consumes: `CARE` from `lib/config.ts`.
- Produces: `daysBetween(aISO, bISO): number` and `adjustInterval(current: number, actualElapsedDays: number): number` (damped EMA, rounded, clamped).

- [ ] **Step 1:** Write failing tests:
```ts
import { describe, it, expect } from "vitest";
import { daysBetween, adjustInterval } from "./intervalEngine";
describe("daysBetween", () => {
  it("counts whole days", () => {
    expect(daysBetween("2026-06-01T09:00:00Z","2026-06-08T09:00:00Z")).toBe(7);
  });
  it("is negative when b precedes a", () => {
    expect(daysBetween("2026-06-08T09:00:00Z","2026-06-01T09:00:00Z")).toBe(-7);
  });
});
describe("adjustInterval", () => {
  it("moves halfway toward observed cadence (DAMPING 0.5)", () => {
    expect(adjustInterval(7, 13)).toBe(10);  // 7 + 0.5*(13-7)=10
  });
  it("shortens when watered early and it needed it", () => {
    expect(adjustInterval(10, 6)).toBe(8);   // 10 + 0.5*(6-10)=8
  });
  it("clamps to MIN_INTERVAL", () => {
    expect(adjustInterval(2, -50)).toBe(1);
  });
  it("clamps to MAX_INTERVAL", () => {
    expect(adjustInterval(100, 1000)).toBe(120);
  });
});
```
- [ ] **Step 2:** Run `npx vitest run lib/intervalEngine.test.ts`; expect FAIL (module missing).
- [ ] **Step 3:** Implement:
```ts
import { differenceInCalendarDays, parseISO } from "date-fns";
import { CARE } from "./config";
export function daysBetween(aISO: string, bISO: string): number {
  return differenceInCalendarDays(parseISO(bISO), parseISO(aISO));
}
export function adjustInterval(current: number, actualElapsedDays: number): number {
  const next = Math.round(current + CARE.DAMPING * (actualElapsedDays - current));
  return Math.min(CARE.MAX_INTERVAL, Math.max(CARE.MIN_INTERVAL, next));
}
```
- [ ] **Step 4:** Run tests; expect PASS.
- [ ] **Step 5:** Commit: `feat: adaptive interval engine`.

---

### Task 5: Due-date engine (TDD)

**Files:**
- Create: `lib/dueDate.ts`, `lib/dueDate.test.ts`

**Interfaces:**
- Consumes: `daysBetween` (not needed), date-fns.
- Produces: `nextDue(lastAtISO: string, intervalDays: number): string` (returns ISO) and `dueStatus(nextDueISO: string, nowISO: string): { state: "ok"|"due"|"overdue"; days: number }` where `days` is days-until-due (negative if overdue).

- [ ] **Step 1:** Write failing tests:
```ts
import { describe, it, expect } from "vitest";
import { nextDue, dueStatus } from "./dueDate";
it("nextDue adds interval days", () => {
  expect(nextDue("2026-06-01T09:00:00Z", 7).startsWith("2026-06-08")).toBe(true);
});
it("dueStatus ok in future", () => {
  expect(dueStatus("2026-06-10T09:00:00Z","2026-06-07T09:00:00Z")).toEqual({ state:"ok", days:3 });
});
it("dueStatus due today", () => {
  expect(dueStatus("2026-06-07T09:00:00Z","2026-06-07T12:00:00Z")).toEqual({ state:"due", days:0 });
});
it("dueStatus overdue", () => {
  expect(dueStatus("2026-06-05T09:00:00Z","2026-06-07T09:00:00Z")).toEqual({ state:"overdue", days:-2 });
});
```
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Implement using `date-fns` `addDays`, `differenceInCalendarDays`, `parseISO`, `formatISO`. `state`: days>0 → ok, days===0 → due, days<0 → overdue.
- [ ] **Step 4:** Run; expect PASS.
- [ ] **Step 5:** Commit: `feat: due-date engine`.

---

### Task 6: Weather model (TDD)

**Files:**
- Create: `lib/weatherModel.ts`, `lib/weatherModel.test.ts`

**Interfaces:**
- Consumes: `WEATHER` config, `LightLevel`, `DailyWeather`.
- Produces: `weatherShiftDays(opts: { interval: number; light: LightLevel; days: DailyWeather[] }): number` — bounded ± (MAX_SHIFT_FRAC*interval), 0 when `days` empty.

- [ ] **Step 1:** Write failing tests:
```ts
import { describe, it, expect } from "vitest";
import { weatherShiftDays } from "./weatherModel";
const day = (et0:number, precip=0) => ({ dateISO:"2026-06-01", et0, precip });
it("returns 0 with no weather data", () => {
  expect(weatherShiftDays({ interval:7, light:"MEDIUM", days:[] })).toBe(0);
});
it("neutral weather (≈ET0_REF) yields ~0 shift", () => {
  const days = Array.from({length:7}, () => day(3.8));
  expect(Math.abs(weatherShiftDays({ interval:7, light:"MEDIUM", days }))).toBeLessThanOrEqual(1);
});
it("hot & dry pulls due date EARLIER (negative shift)", () => {
  const days = Array.from({length:7}, () => day(8));
  expect(weatherShiftDays({ interval:7, light:"DIRECT_SUN", days })).toBeLessThan(0);
});
it("rainy pushes due date LATER (positive shift)", () => {
  const days = Array.from({length:7}, () => day(1, 20));
  expect(weatherShiftDays({ interval:7, light:"MEDIUM", days })).toBeGreaterThan(0);
});
it("shift is clamped to ±40% of interval", () => {
  const days = Array.from({length:30}, () => day(50));
  expect(weatherShiftDays({ interval:10, light:"DIRECT_SUN", days })).toBe(-4);
});
```
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Implement per spec §4.3:
```ts
import { WEATHER } from "./config";
import type { DailyWeather, LightLevel } from "./types";
export function weatherShiftDays({ interval, light, days }:
  { interval:number; light:LightLevel; days:DailyWeather[] }): number {
  if (!days.length) return 0;
  const mult = WEATHER.LIGHT_MULT[light];
  const cum = days.reduce((s,d) => s + Math.max(0, d.et0*mult - WEATHER.RAIN_EFFECT*d.precip), 0);
  const expected = interval * WEATHER.ET0_REF * mult;
  const ratio = expected === 0 ? 1 : cum/expected;
  const raw = Math.round((1 - ratio) * interval);
  const cap = Math.round(WEATHER.MAX_SHIFT_FRAC * interval);
  return Math.min(cap, Math.max(-cap, raw));
}
```
- [ ] **Step 4:** Run; expect PASS.
- [ ] **Step 5:** Commit: `feat: weather adjustment model`.

---

### Task 7: Reminder selection (TDD)

**Files:**
- Create: `lib/reminders.ts`, `lib/reminders.test.ts`

**Interfaces:**
- Produces: `plantsDueForReminder(plants: Plant[], nowISO: string, type: CareType): Plant[]` — returns plants whose `*NextDueAt <= now` and `*LastRemindedOn !=` today's date (YYYY-MM-DD), respecting `fertEnabled`/`archived`.

- [ ] **Step 1:** Write failing tests covering: due+not-reminded-today → included; due-but-reminded-today → excluded; not-due → excluded; archived → excluded; FERTILIZE respects `fertEnabled`.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Implement (date key = `nowISO.slice(0,10)`).
- [ ] **Step 4:** Run; expect PASS.
- [ ] **Step 5:** Commit: `feat: reminder selection logic`.

---

### Task 8: Curated plant library + lookup (TDD)

**Files:**
- Create: `data/plant-library.json` (start with ~40 common houseplants; structure supports growth to 150–300), `lib/library.ts`, `lib/library.test.ts`

**Interfaces:**
- Produces:
```ts
export interface LibraryEntry { commonName:string; sciName:string; aliases:string[]; waterIntervalDays:number; fertIntervalDays:number; suggestedLight:LightLevel; }
export function lookupPlant(query:string): LibraryEntry | null;  // case-insensitive match on commonName/sciName/aliases
export function defaultSeed(): { waterIntervalDays:number; fertIntervalDays:number; suggestedLight:LightLevel }; // 7 / 30 / BRIGHT_INDIRECT
```

- [ ] **Step 1:** Write failing tests: exact common-name hit ("Pothos"), alias hit ("Devil's Ivy" → Pothos), scientific hit ("Epipremnum aureum"), case-insensitivity, miss → null.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Create the JSON (Pothos, Snake Plant, Monstera, ZZ Plant, Fiddle Leaf Fig, Peace Lily, Spider Plant, Aloe, etc. — ~40 entries with sensible intervals) and implement `lookupPlant`/`defaultSeed`.
- [ ] **Step 4:** Run; expect PASS.
- [ ] **Step 5:** Commit: `feat: curated plant library + lookup`.

---

### Task 9: Plant factory / care application (TDD)

**Files:**
- Create: `lib/plantOps.ts`, `lib/plantOps.test.ts`

**Interfaces:**
- Consumes: types, config, intervalEngine, dueDate, library.
- Produces:
  - `createPlant(input): Plant` — seeds intervals from library lookup (fallback `defaultSeed`), computes initial `waterNextDueAt`/`fertNextDueAt` from `waterLastAt` (the user-set last-watered date) + interval. `id`/`createdAt` passed in (no impurity).
  - `applyCare(plant, ev: { type; occurredAtISO; adjust: "lengthen"|"shorten"|"keep" }): { plant: Plant; event: CareEvent }` — records event, optionally adjusts interval via `adjustInterval`, recomputes next-due, clears `*LastRemindedOn`.

- [ ] **Step 1:** Write failing tests: createPlant seeds from library + computes due from last-watered date; applyCare WATER with "keep" recomputes due and writes event with `intervalAfter===intervalBefore`; applyCare with "lengthen" when watered late bumps interval; FERTILIZE path.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Implement (weather shift applied later at read time for outdoor — keep this pure/weather-free; `createPlant`/`applyCare` compute the base due date).
- [ ] **Step 4:** Run; expect PASS.
- [ ] **Step 5:** Commit: `feat: plant create + care-application ops`.

---

### Task 10: Repository interface + local store (TDD on in-memory)

**Files:**
- Create: `lib/repo/PlantRepo.ts` (interface), `lib/repo/memoryRepo.ts`, `lib/repo/memoryRepo.test.ts`, `lib/repo/localRepo.ts` (idb-keyval-backed, browser)

**Interfaces:**
- Produces:
```ts
export interface PlantRepo {
  listPlants(): Promise<Plant[]>;
  getPlant(id:string): Promise<Plant|null>;
  savePlant(p:Plant): Promise<void>;
  deletePlant(id:string): Promise<void>;
  listEvents(plantId?:string): Promise<CareEvent[]>;
  addEvent(e:CareEvent): Promise<void>;
}
export function makeMemoryRepo(seed?:{plants?:Plant[];events?:CareEvent[]}): PlantRepo;
export function makeLocalRepo(): PlantRepo;  // idb-keyval
```

- [ ] **Step 1:** Write failing tests against `makeMemoryRepo`: save/list/get/delete plant; add/list events; list events filtered by plantId.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Implement memoryRepo (Map-backed) and localRepo (idb-keyval get/set arrays). localRepo not unit-tested here (browser-only); memoryRepo covers the contract.
- [ ] **Step 4:** Run; expect PASS.
- [ ] **Step 5:** Commit: `feat: PlantRepo interface + memory/local stores`.

---

### Task 11: App data context + seed demo data

**Files:**
- Create: `app/providers.tsx` (RepoContext + React state hook `usePlants`), `lib/demoSeed.ts`
- Modify: `app/layout.tsx` (wrap with provider; PWA meta)

**Interfaces:**
- Produces: `useRepo()`, `usePlants()` hook returning `{ plants, events, refresh, addPlant, recordCare, removePlant }`. On first load with empty store, seed `demoSeed()` (~4 sample plants incl. 1 outdoor) so the prototype isn't blank.

- [ ] **Step 1:** Implement provider using `makeLocalRepo()` in browser; expose hook.
- [ ] **Step 2:** Add `demoSeed()` (uses `createPlant`).
- [ ] **Step 3:** Manual check: `npm run dev`, confirm no console errors. Commit: `feat: app data provider + demo seed`.

---

### Task 12: Plant grid (home screen)

**Files:**
- Create: `app/page.tsx`, `components/PlantCard.tsx`, `components/StatusPill.tsx`, `components/EmptyState.tsx`

**Interfaces:**
- Consumes: `usePlants`, `dueStatus`, `weatherShiftDays` (outdoor; weather data stubbed to `[]` in this plan → 0 shift).
- Produces: a responsive card grid; each card shows photo (or leafy placeholder), nickname, room, water status pill + fert status pill, quick "✓ Water" button.

- [ ] **Step 1:** Build `StatusPill` (ok=green "in Nd", due=amber "today", overdue=red "Nd late").
- [ ] **Step 2:** Build `PlantCard` + grid in `page.tsx`; "✓ Water" calls `recordCare(plant,'WATER','keep')`.
- [ ] **Step 3:** Manual check in browser. Commit: `feat: plant grid home screen`.

---

### Task 13: Add-plant flow (manual; photo-ID stubbed)

**Files:**
- Create: `app/add/page.tsx`, `components/SpeciesPicker.tsx`, `components/AddPlantForm.tsx`

**Interfaces:**
- Consumes: `lookupPlant`, `createPlant`, `usePlants.addPlant`.
- Produces: a form: photo upload (stored as object URL for now), species text with library autocomplete (`SpeciesPicker`), nickname, indoor/outdoor, room, light level, **last-watered date picker (defaults today)**, fert on/off + last-fertilized. On submit → `createPlant` → save → route home. (Plant.id photo-ID is Plan 2; here species is typed/picked.)

- [ ] **Step 1:** Build `SpeciesPicker` (filters library entries as you type; choosing one pre-fills suggested light + intervals, shown as editable).
- [ ] **Step 2:** Build `AddPlantForm` + page; wire submit.
- [ ] **Step 3:** Manual check: add a plant, see it on home. Commit: `feat: add-plant flow (manual)`.

---

### Task 14: Plant detail + confirm/adjust

**Files:**
- Create: `app/plant/[id]/page.tsx`, `components/CareConfirmSheet.tsx`, `components/IntervalAdjustPrompt.tsx`

**Interfaces:**
- Consumes: `usePlants`, `applyCare` (via `recordCare`), `daysBetween`.
- Produces: detail screen (photo, schedule, history list, edit, archive). "I watered it" opens `CareConfirmSheet` with date (default now); if off-schedule, `IntervalAdjustPrompt` offers lengthen/shorten/keep with a plain-language explanation and the resulting new interval preview.

- [ ] **Step 1:** Build detail page reading the plant + its events.
- [ ] **Step 2:** Build confirm sheet + adjust prompt; wire to `recordCare`.
- [ ] **Step 3:** Manual check: water late → prompt appears → choose lengthen → interval updates. Commit: `feat: plant detail + confirm/adjust`.

---

### Task 15: Calendar / history view

**Files:**
- Create: `app/calendar/page.tsx`, `components/MonthCalendar.tsx`

**Interfaces:**
- Consumes: `usePlants` (events).
- Produces: month grid (date-fns), water=blue dot, fertilize=amber dot; all-plants by default, filter to one plant; tap a day → list of that day's events; prev/next month.

- [ ] **Step 1:** Build `MonthCalendar` from events.
- [ ] **Step 2:** Build page + plant filter. Commit: `feat: calendar/history view`.

---

### Task 16: Settings + PWA install shell

**Files:**
- Create: `app/settings/page.tsx`, `public/manifest.webmanifest`, `public/sw.js` (offline shell only here; push in Plan 2), `components/BottomNav.tsx`, app icons in `public/icons/`
- Modify: `app/layout.tsx` (link manifest, apple-touch-icon, theme color, register SW, BottomNav)

**Interfaces:**
- Produces: settings (display name, city/ZIP [stored, used in Plan 2], reminder hour, units); installable PWA (manifest + maskable icons + SW caching the app shell); bottom nav (Home / Calendar / Add / Settings).

- [ ] **Step 1:** Write manifest + minimal SW (cache-first app shell); register in layout.
- [ ] **Step 2:** Generate simple botanical app icons (192/512 + maskable) into `public/icons/`.
- [ ] **Step 3:** Build settings page + BottomNav.
- [ ] **Step 4:** Verify `npm run build`; Lighthouse "installable" check in dev. Commit: `feat: settings + installable PWA shell`.

---

### Task 17: Visual polish + README

**Files:**
- Modify: Tailwind theme (`app/globals.css`/config) — botanical palette, fonts, card styling
- Create: `README.md` (run instructions + Plan 2 handoff/keys checklist)

- [ ] **Step 1:** Apply the frontend-design skill: palette (greens/cream), a characterful display font for headings, consistent rounded cards, spacing, empty/placeholder art.
- [ ] **Step 2:** Pass over each screen for cohesion on mobile widths.
- [ ] **Step 3:** Write README (how to run on Windows; the Plan 2 keys/handoff list from spec §10).
- [ ] **Step 4:** Full `npm test` + `npm run build` green. Commit: `feat: visual polish + README`.

---

## Plan 2 (separate, requires keys — outline only)

Written when the user provides accounts/keys. Adds, behind the existing interfaces:
- Prisma schema + Neon Postgres `PlantRepo` (swap `makeLocalRepo`).
- Plant.id photo identification in the add flow (replaces typed species); Perenual fallback in `lib/library.ts`.
- Vercel Blob photo upload.
- Auth.js magic-link (Resend) + per-user scoping; city/ZIP geocode → lat/lon.
- Open-Meteo fetch → real `DailyWeather[]` feeding `weatherShiftDays` for outdoor plants.
- Web Push (VAPID) + service-worker push handlers + Vercel Cron hourly reminder route using `plantsDueForReminder`.
- Playwright flow tests (mocked external APIs).
- Vercel deploy config.

## Self-Review

- **Spec coverage:** adaptive interval (T4,T9), due-date (T5), weather (T6, wired T12/Plan2), reminders (T7, delivered Plan2), library hybrid (T8 curated; Perenual=Plan2), add-plant incl. last-watered date (T13), confirm/adjust (T14), calendar (T15), settings/city-ZIP (T16), PWA install (T16), auth/push/DB/Plant.id/Blob (Plan 2 — keys-gated). All spec items mapped.
- **Placeholder scan:** none ("Plan 2" items are explicitly deferred, not TBD within Plan 1).
- **Type consistency:** `Plant`/`CareEvent`/`LibraryEntry`/`PlantRepo` names used consistently across T3–T16; `adjustInterval`, `nextDue`, `dueStatus`, `weatherShiftDays`, `plantsDueForReminder`, `lookupPlant`, `createPlant`, `applyCare` signatures stable.
