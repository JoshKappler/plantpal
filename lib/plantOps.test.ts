import { describe, it, expect } from "vitest";
import { createPlant, applyCare } from "./plantOps";

const baseInput = {
  id: "p1",
  createdAt: "2026-06-01T09:00:00Z",
  name: "Big Pothos",
  species: "Pothos",
  location: "INDOOR" as const,
  waterLastAt: "2026-06-01T09:00:00Z",
};

describe("createPlant", () => {
  it("seeds intervals + light from the library", () => {
    const p = createPlant(baseInput);
    expect(p.waterInterval).toBe(7);
    expect(p.waterBaseInterval).toBe(7);
    expect(p.fertInterval).toBe(30);
    expect(p.lightLevel).toBe("BRIGHT_INDIRECT");
    expect(p.speciesSci).toBe("Epipremnum aureum");
  });
  it("computes next-due from the user-set last-watered date", () => {
    const p = createPlant(baseInput);
    expect(p.waterNextDueAt.startsWith("2026-06-08")).toBe(true);
  });
  it("falls back to safe defaults for unknown species", () => {
    const p = createPlant({ ...baseInput, species: "Mystery Plant" });
    expect(p.waterInterval).toBe(7);
    expect(p.fertInterval).toBe(30);
  });
  it("honors explicit interval overrides", () => {
    const p = createPlant({ ...baseInput, waterIntervalDays: 10 });
    expect(p.waterInterval).toBe(10);
    expect(p.waterNextDueAt.startsWith("2026-06-11")).toBe(true);
  });
});

describe("applyCare", () => {
  it("WATER + keep rolls the schedule forward without changing interval", () => {
    const p = createPlant(baseInput);
    const { plant, event } = applyCare(p, {
      eventId: "e1",
      type: "WATER",
      occurredAtISO: "2026-06-08T09:00:00Z",
      adjust: "keep",
    });
    expect(plant.waterInterval).toBe(7);
    expect(plant.waterNextDueAt.startsWith("2026-06-15")).toBe(true);
    expect(event.daysLate).toBe(0);
    expect(event.intervalBefore).toBe(7);
    expect(event.intervalAfter).toBe(7);
  });
  it("WATER + lengthen bumps the interval when watered late", () => {
    const p = createPlant(baseInput);
    const { plant, event } = applyCare(p, {
      eventId: "e2",
      type: "WATER",
      occurredAtISO: "2026-06-14T09:00:00Z", // 13 days after last, 6 late
      adjust: "lengthen",
    });
    expect(event.daysLate).toBe(6);
    expect(plant.waterInterval).toBe(10); // adjustInterval(7, 13)
  });
  it("FERTILIZE updates the fertilizing schedule", () => {
    const p = createPlant(baseInput);
    const { plant, event } = applyCare(p, {
      eventId: "e3",
      type: "FERTILIZE",
      occurredAtISO: "2026-07-01T09:00:00Z",
      adjust: "keep",
    });
    expect(event.type).toBe("FERTILIZE");
    expect(plant.fertLastAt).toBe("2026-07-01T09:00:00Z");
    expect(plant.fertNextDueAt?.startsWith("2026-07-31")).toBe(true);
  });
});
