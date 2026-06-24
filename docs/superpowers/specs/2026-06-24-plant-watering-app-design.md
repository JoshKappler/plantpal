# PlantPal — Design Spec

**Date:** 2026-06-24
**Status:** Approved (architecture/stack confirmed by user; remaining detail finalized autonomously per user instruction to "develop autonomously, no check-back after spec").
**Working name:** PlantPal (placeholder)

## 1. Purpose & scope

A personal plant-care tracker for a single client with ~30 plants on different watering schedules. She photographs each plant, the app identifies the species and seeds a sensible starting schedule, and from then on it sends a once-a-day phone reminder when a plant is due — repeating until she confirms she watered it ("med-style"). When she confirms late (or early), it offers to adjust that plant's interval, so the schedule self-tunes over time. It tracks fertilizing on a parallel schedule, nudges outdoor plants by local weather, and shows a calendar of each plant's history so she can see seasonal patterns.

**Delivery:** Installable PWA (Progressive Web App) — she opens a URL once, "Add to Home Screen," and it becomes a fullscreen home-screen icon. No App Store, no Xcode, no Mac. Built and shipped from Windows.

**Users:** One (the client). Not multi-tenant, but data is scoped to a user record so auth + push subscriptions work cleanly and a second user could be added later without a rewrite.

### In scope (v1)
- Photo → species identification (Plant.id), with confirm/pick-from-alternatives.
- Curated plant library (starting watering + fertilizing intervals + suggested light) with Perenual API fallback.
- Per-plant attributes: nickname, species, photo, indoor/outdoor, room, light level.
- User-set **last-watered date** at add-time so the schedule starts from reality, not scan date.
- Adaptive watering interval that self-tunes from her confirmations.
- Parallel fertilizing schedule + adaptive tuning.
- Once-a-day push reminders that repeat until confirmed.
- Weather-adjusted due dates for **outdoor** plants (Open-Meteo); indoor plants ignore weather.
- Calendar / history view (per-plant and all-plants).
- Magic-link (passwordless) login; city/ZIP captured once for weather.
- "Pretty" botanical UI.

### Out of scope (v1, noted for later)
- Multi-user / accounts marketplace.
- AI plant-health/disease assessment (Claude vision is the back-pocket option here).
- Native app store distribution.

## 2. Architecture & tech stack

Single Next.js (App Router, TypeScript) app on Vercel that is simultaneously the PWA, the API, and the reminder engine.

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router, TS) on Vercel | PWA + API routes + cron in one deployable |
| Styling | Tailwind CSS | fast path to a clean botanical look |
| DB | Neon Postgres via Prisma | relational fits plants + event history + calendar |
| Photo storage | Vercel Blob | one image per plant |
| Plant ID | Plant.id API | photo → ranked species matches |
| Library fallback | Perenual API | when species not in curated list |
| Weather | Open-Meteo | free, no key; provides daily ET0 + precipitation |
| Auth | Auth.js (NextAuth) Email provider + Resend | passwordless magic link |
| Push | Web Push (VAPID) + service worker | iOS 16.4+ supports push for installed PWAs |
| Scheduling | Vercel Cron (hourly) | sends each user's reminders at their local reminder hour |
| Tests | Vitest (pure logic) + Playwright (flows) | engines are pure + unit-tested |

**Running cost:** ~$0/month for one user — every dependency has a sufficient free tier. Plant.id is the only one that could ever need a paid plan, and only under heavy use.

## 3. Data model (Prisma / Postgres)

```
User
  id, email (unique), createdAt
  // Auth.js also manages Account/Session/VerificationToken tables

Settings        // one row per user
  userId (FK, unique)
  reminderHour  Int     // 0..23, local hour to send daily reminders (default 9)
  timezone      String  // IANA tz, e.g. "America/Chicago"
  locationLabel String  // city/ZIP as entered
  lat, lon      Float?  // resolved once via geocode for Open-Meteo
  units         Enum(METRIC, IMPERIAL)  // default IMPERIAL

Plant
  id, userId (FK)
  name          String  // nickname ("Big Fern")
  species       String  // common name
  speciesSci    String? // scientific name
  photoUrl      String? // Vercel Blob URL
  location      Enum(INDOOR, OUTDOOR)
  room          String?
  lightLevel    Enum(LOW, MEDIUM, BRIGHT_INDIRECT, DIRECT_SUN)
  // watering
  waterBaseInterval     Int     // days, from library seed (immutable reference)
  waterInterval         Int     // days, current adaptive value
  waterLastAt           DateTime
  waterNextDueAt        DateTime
  waterLastRemindedOn   Date?   // de-dupes the daily nag
  // fertilizing (parallel, optional per plant)
  fertEnabled           Boolean // default true
  fertBaseInterval      Int?
  fertInterval          Int?
  fertLastAt            DateTime?
  fertNextDueAt         DateTime?
  fertLastRemindedOn    Date?
  notes         String?
  archived      Boolean // default false
  createdAt

CareEvent       // unified history for water + fertilize -> drives calendar
  id, plantId (FK)
  type          Enum(WATER, FERTILIZE)
  occurredAt    DateTime  // when she actually did it
  scheduledFor  DateTime  // what was due at the time
  daysLate      Int       // occurredAt - scheduledFor (can be negative = early)
  intervalBefore Int
  intervalAfter  Int      // == intervalBefore if no adjustment
  note          String?

PushSubscription
  id, userId (FK)
  endpoint (unique), p256dh, auth, createdAt
```

## 4. Core engines (pure, unit-tested)

These are pure functions with no I/O so they can be tested deterministically. All dates passed in explicitly (no `Date.now()` inside the pure layer).

### 4.1 Adaptive interval (EMA toward observed cadence)

When she confirms a care event, compute `actualElapsed = occurredAt - lastAt` (days). If the event is off-schedule (late or early) we offer to adjust:

- **"It was fine / didn't need it sooner"** (late) → lengthen toward actual.
- **"It actually needed it sooner"** (early) → shorten toward actual.
- **"Keep the same"** → no change.

Adjustment is a damped exponential moving average so one odd watering doesn't whipsaw the schedule:

```
newInterval = round( current + DAMPING * (actualElapsed - current) )
DAMPING = 0.5            // tunable
clamp to [MIN_INTERVAL=1, MAX_INTERVAL=120]
```

`waterBaseInterval` (library seed) is preserved as a reference so we can always show drift and reset.

### 4.2 Due-date computation

```
nextDue(lastAt, interval) = lastAt + interval days   // indoor plants stop here
```

For **outdoor** plants the due date is then shifted by the weather factor (4.3).

### 4.3 Weather adjustment (outdoor only, bounded + explainable)

Open-Meteo provides daily reference evapotranspiration (`et0_fao_evapotranspiration`, mm) and precipitation. We compute an **effective dryness** since last watering and compare it to a reference, then shift the due date — clamped so it never surprises her by more than a set amount.

```
For each day d since waterLastAt (outdoor plant):
  dryness_d = ET0_d * lightMultiplier(lightLevel) - RAIN_EFFECT * precip_d
  (dryness_d floored at 0)
cumDryness = sum(dryness_d)
expectedDryness = waterInterval * ET0_REF * lightMultiplier(lightLevel)
weatherRatio = cumDryness / expectedDryness            // >1 drier than normal
shiftDays = clamp( round((1 - weatherRatio) * waterInterval), -MAXSHIFT, +MAXSHIFT )
waterNextDueAt = baseNextDue + shiftDays
```

- `lightMultiplier`: DIRECT_SUN > BRIGHT_INDIRECT > MEDIUM > LOW (sunnier dries faster).
- `ET0_REF`: a seasonal/neutral reference (config constant, ~3.5–4 mm/day) so a "normal" week yields ratio ≈ 1 and ~0 shift.
- `RAIN_EFFECT`, `MAXSHIFT` (e.g. ±40% of interval) are tunable constants.
- Indoor plants skip this entirely.
- The reminder always carries the *reason* ("due early — it's been hot & dry" / "pushed back — lots of rain").

All constants live in one `config/wateringModel.ts` so they're tunable after real-world feel-testing — explicitly expected to need calibration.

## 5. Plant library

Hybrid (confirmed): a curated JSON table of the ~150–300 most common houseplants → `{ commonName, sciName, waterIntervalDays, fertIntervalDays, suggestedLight }`. On add, we match the identified species to the curated table first; if absent, call Perenual and map its coarse watering bucket (frequent/average/minimum) → a starting interval. If both miss, fall back to a safe default (e.g. 7 days) and let her edit. Everything she sets is editable regardless of source.

## 6. Key flows

### 6.1 Add a plant
1. Take/upload photo → stored to Vercel Blob.
2. Plant.id returns ranked matches → she confirms top match or picks an alternative (or enters manually).
3. Library lookup (curated → Perenual → default) seeds `waterInterval`, `fertInterval`, suggested light.
4. She sets: nickname, indoor/outdoor, room, light level, **last-watered date** (defaults today, editable), optionally last-fertilized date, fert on/off.
5. Save → compute `waterNextDueAt` (+ weather shift if outdoor), `fertNextDueAt`.

### 6.2 Reminder loop (server)
- Vercel Cron runs hourly. For each user whose local time == `reminderHour`:
  - find plants where `waterNextDueAt <= now` and `waterLastRemindedOn != today` → send one web push "💧 Time to water {name}" (with weather reason for outdoor), set `waterLastRemindedOn = today`.
  - same for fertilizing.
- Because `nextDueAt` stays in the past until she confirms, the reminder re-fires once each day → the "keep nagging until done" behavior, gently.

### 6.3 Confirm care
- Notification deep-links into the app to the plant (with a quick "✓ Watered" action).
- On confirm: create `CareEvent`; if off-schedule, show the adjust prompt (4.1); recompute `nextDueAt` (+ weather for outdoor); clear the reminder flag.

### 6.4 Calendar / history
- Month grid, per-plant and all-plants. Water events = blue dots, fertilize = amber. Tapping a day shows what happened. Lets her see seasonal cadence after a full year.

## 7. Auth & PWA

- **Auth.js Email provider + Resend**: she enters email → magic link → long-lived session. City/ZIP captured at first setup, geocoded once to lat/lon for Open-Meteo.
- **PWA**: `manifest.webmanifest` (standalone, botanical theme color, maskable icons), `apple-touch-icon`, service worker for push + offline app shell. Onboarding explains the one-time "Add to Home Screen + allow notifications" step required for iOS push.

## 8. UI / look & feel

Calm botanical aesthetic — soft greens/cream, rounded cards, plant photos front-and-center. Primary screen: a grid of plant cards showing photo, nickname, and a "due in N days / due today / overdue" status pill (water + fertilize). Secondary: plant detail (history, schedule, edit, adjust), calendar, settings. Polished with the frontend-design skill at build time.

## 9. Testing strategy

- **Vitest (pure):** adaptive EMA, due-date calc, weather factor/shift, cron "who's due now" selection, library lookup/mapping. These are the correctness core.
- **Playwright (flows, mocked external APIs):** add-plant, confirm-water (+adjust prompt), calendar render.
- **Manual:** real iPhone — install to home screen, grant notifications, receive a push, tap-through confirm. (Requires the client's or Josh's iPhone.)

## 10. Handoff checklist (requires the user/accounts — cannot be fully automated)

- Neon Postgres `DATABASE_URL` (Vercel Marketplace integration).
- Vercel Blob `BLOB_READ_WRITE_TOKEN`.
- `PLANT_ID_API_KEY` (Plant.id / Kindwise).
- `PERENUAL_API_KEY`.
- `RESEND_API_KEY` + a verified sender domain/email (for magic-link mail).
- `AUTH_SECRET` (generated).
- VAPID public/private keys (generated by us, stored as env).
- Open-Meteo: nothing (keyless). ✅
- Vercel project + production deploy (Josh's account).
- A real iPhone to verify push end-to-end.

## 11. Build phases (high level)

1. Scaffold Next.js + Tailwind + Prisma + PWA shell; CI-friendly env config.
2. Pure engines + Vitest (adaptive, due-date, weather, cron-selection, library lookup).
3. Data layer (Prisma schema + migrations + repository functions).
4. Auth (magic link) + settings (city/ZIP geocode).
5. Add-plant flow (Plant.id + Blob + library/Perenual).
6. Plant list + detail + confirm/adjust UI.
7. Reminder cron + web push + service worker.
8. Weather integration wired into due dates.
9. Calendar/history view.
10. Visual polish (frontend-design) + Playwright flows.
11. Deploy config + handoff checklist + README.

Assumptions made autonomously (documented for review): IMPERIAL units default; reminder default 9am; safe-default interval 7 days when library+API miss; weather shift capped at ±40% of interval; fertilizing on by default but per-plant toggleable.
