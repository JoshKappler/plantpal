import { formatISO, parseISO, subDays } from "date-fns";
import { createPlant } from "./plantOps";
import type { Plant } from "./types";

/**
 * A small, varied starter set so a brand-new install isn't an empty screen:
 * one overdue, one due today, one comfortable, and one outdoor plant.
 * Pure: the caller passes "now" so this stays deterministic/testable.
 */
export function demoSeed(nowISO: string): Plant[] {
  const now = parseISO(nowISO);
  const ago = (d: number) => formatISO(subDays(now, d));
  return [
    createPlant({
      id: "demo-monstera",
      createdAt: nowISO,
      name: "Gerald",
      species: "Monstera",
      location: "INDOOR",
      room: "Living room",
      waterLastAt: ago(9), // 7-day interval → ~2 days overdue
    }),
    createPlant({
      id: "demo-aloe",
      createdAt: nowISO,
      name: "Spike",
      species: "Aloe Vera",
      location: "INDOOR",
      room: "Kitchen",
      waterLastAt: ago(14), // 14-day interval → due today
    }),
    createPlant({
      id: "demo-fern",
      createdAt: nowISO,
      name: "Fern Bundy",
      species: "Boston Fern",
      location: "INDOOR",
      room: "Bathroom",
      waterLastAt: ago(1), // 3-day interval → comfortable
    }),
    createPlant({
      id: "demo-geranium",
      createdAt: nowISO,
      name: "Sunny",
      species: "Geranium",
      location: "OUTDOOR",
      room: "Balcony",
      waterLastAt: ago(3), // 5-day interval, outdoor
    }),
  ];
}
