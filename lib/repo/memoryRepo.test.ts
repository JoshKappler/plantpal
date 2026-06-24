import { describe, it, expect } from "vitest";
import { makeMemoryRepo } from "./memoryRepo";
import { createPlant } from "../plantOps";
import type { CareEvent } from "../types";

const mk = (id: string) =>
  createPlant({
    id,
    createdAt: "2026-06-01T09:00:00Z",
    name: `Plant ${id}`,
    species: "Pothos",
    location: "INDOOR",
    waterLastAt: "2026-06-01T09:00:00Z",
  });

const ev = (id: string, plantId: string): CareEvent => ({
  id,
  plantId,
  type: "WATER",
  occurredAt: "2026-06-08T09:00:00Z",
  scheduledFor: "2026-06-08T09:00:00Z",
  daysLate: 0,
  intervalBefore: 7,
  intervalAfter: 7,
});

describe("memoryRepo", () => {
  it("saves, lists, gets, and deletes plants", async () => {
    const repo = makeMemoryRepo();
    await repo.savePlant(mk("a"));
    await repo.savePlant(mk("b"));
    expect((await repo.listPlants()).map((p) => p.id).sort()).toEqual(["a", "b"]);
    expect((await repo.getPlant("a"))?.id).toBe("a");
    await repo.deletePlant("a");
    expect(await repo.getPlant("a")).toBeNull();
    expect(await repo.listPlants()).toHaveLength(1);
  });

  it("overwrites a plant saved with the same id", async () => {
    const repo = makeMemoryRepo();
    await repo.savePlant(mk("a"));
    const edited = { ...mk("a"), name: "Renamed" };
    await repo.savePlant(edited);
    expect((await repo.listPlants())).toHaveLength(1);
    expect((await repo.getPlant("a"))?.name).toBe("Renamed");
  });

  it("adds and filters events by plant", async () => {
    const repo = makeMemoryRepo();
    await repo.addEvent(ev("e1", "a"));
    await repo.addEvent(ev("e2", "a"));
    await repo.addEvent(ev("e3", "b"));
    expect(await repo.listEvents()).toHaveLength(3);
    expect((await repo.listEvents("a")).map((e) => e.id)).toEqual(["e1", "e2"]);
  });

  it("accepts seed data", async () => {
    const repo = makeMemoryRepo({ plants: [mk("seed")], events: [ev("se", "seed")] });
    expect(await repo.listPlants()).toHaveLength(1);
    expect(await repo.listEvents("seed")).toHaveLength(1);
  });
});
