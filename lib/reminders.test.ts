import { describe, it, expect } from "vitest";
import { plantsDueForReminder } from "./reminders";
import type { Plant } from "./types";

const base = (over: Partial<Plant>): Plant => ({
  id: "1",
  name: "P",
  species: "x",
  location: "INDOOR",
  lightLevel: "MEDIUM",
  waterBaseInterval: 7,
  waterInterval: 7,
  waterLastAt: "2026-06-01T09:00:00Z",
  waterNextDueAt: "2026-06-08T09:00:00Z",
  fertEnabled: true,
  archived: false,
  createdAt: "2026-06-01T09:00:00Z",
  ...over,
});

const now = "2026-06-08T09:00:00Z";

describe("plantsDueForReminder", () => {
  it("includes due, not reminded today", () => {
    expect(plantsDueForReminder([base({})], now, "WATER").map((p) => p.id)).toEqual([
      "1",
    ]);
  });
  it("excludes when already reminded today", () => {
    expect(
      plantsDueForReminder([base({ waterLastRemindedOn: "2026-06-08" })], now, "WATER"),
    ).toHaveLength(0);
  });
  it("excludes not-due", () => {
    expect(
      plantsDueForReminder([base({ waterNextDueAt: "2026-06-20T09:00:00Z" })], now, "WATER"),
    ).toHaveLength(0);
  });
  it("excludes archived", () => {
    expect(plantsDueForReminder([base({ archived: true })], now, "WATER")).toHaveLength(0);
  });
  it("FERTILIZE respects fertEnabled + fertNextDueAt", () => {
    const on = base({ fertEnabled: true, fertNextDueAt: "2026-06-08T09:00:00Z" });
    expect(plantsDueForReminder([on], now, "FERTILIZE").map((p) => p.id)).toEqual(["1"]);
    const off = base({ fertEnabled: false, fertNextDueAt: "2026-06-08T09:00:00Z" });
    expect(plantsDueForReminder([off], now, "FERTILIZE")).toHaveLength(0);
  });
});
