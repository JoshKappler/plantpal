# 🌿 PlantPal

A calm, personal plant-care tracker. Photograph a plant, get a starting watering
schedule, and PlantPal nudges you (once a day, until you confirm) when each plant
is due — adapting the interval to how you actually care for it. Tracks fertilizing
on a parallel schedule, nudges outdoor plants by local weather, and shows a calendar
of each plant's history.

Built as an installable **PWA** — no App Store, no Xcode, no Mac. Open the link on a
phone, "Add to Home Screen," and it behaves like a native app.

## Status

**Plan 1 (this repo) is complete: a runnable, local-data prototype.** Everything works
on this machine with no external accounts — plants and history are saved on-device
(IndexedDB). Photo identification, reminders, weather, and login are wired in **Plan 2**
once API keys exist (see below). The data layer sits behind a `PlantRepo` interface, so
Plan 2 swaps in Postgres without touching the UI.

## Run it (Windows / anywhere)

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 40 unit tests (care engines, library, repo)
npm run build    # production build + typecheck
```

It ships with four demo plants on first load (one overdue, one due today, one happy,
one outdoor) so it isn't empty. Add your own from the **+** button; remove a plant from
its detail screen to clear the demo set.

## What's here (Plan 1)

- **Tested logic core** (`lib/`, pure + Vitest): adaptive interval (damped EMA),
  due-date/status, bounded weather shift, daily reminder selection, curated
  43-plant library + lookup, create/care operations.
- **PWA UI** (`app/`, `components/`): home grid sorted by urgency, add-plant flow
  (species autocomplete, photo, **user-set last-watered date**), plant detail with
  the **confirm + "adjust the schedule?"** flow, month calendar, settings, offline
  app shell, installable manifest + icons.
- Design: "Glasshouse" direction — dewy greenhouse palette, Fraunces display /
  Hanken Grotesk body, specimen-label plant cards with a dewdrop status meter.

See `docs/superpowers/specs/` and `docs/superpowers/plans/` for the full spec and plan.

## Plan 2 — production wiring (needs your accounts/keys)

These can't be automated; they require accounts and a deploy. Add as env vars:

| Key | For |
| --- | --- |
| `DATABASE_URL` | Neon Postgres (Vercel Marketplace) — replaces the on-device store |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob — plant photo storage |
| `PLANT_ID_API_KEY` | Plant.id — photo → species identification |
| `PERENUAL_API_KEY` | Perenual — library fallback for uncommon species |
| `RESEND_API_KEY` + verified sender | magic-link login email |
| `AUTH_SECRET` | Auth.js session secret |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push (generated, not signed up for) |

Open-Meteo (weather) needs **no key**. Also required for Plan 2: a Vercel project to
deploy to, and a real iPhone to verify push notifications end-to-end.

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · date-fns ·
idb-keyval · Vitest. Deploys to Vercel.
