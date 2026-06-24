import { describe, it, expect } from "vitest";
import { weatherShiftDays } from "./weatherModel";

const day = (et0: number, precip = 0) => ({ dateISO: "2026-06-01", et0, precip });

describe("weatherShiftDays", () => {
  it("returns 0 with no weather data", () => {
    expect(weatherShiftDays({ interval: 7, light: "MEDIUM", days: [] })).toBe(0);
  });
  it("neutral weather (~ET0_REF) yields ~0 shift", () => {
    const days = Array.from({ length: 7 }, () => day(3.8));
    expect(
      Math.abs(weatherShiftDays({ interval: 7, light: "MEDIUM", days })),
    ).toBeLessThanOrEqual(1);
  });
  it("hot & dry pulls due date EARLIER (negative shift)", () => {
    const days = Array.from({ length: 7 }, () => day(8));
    expect(weatherShiftDays({ interval: 7, light: "DIRECT_SUN", days })).toBeLessThan(0);
  });
  it("rainy pushes due date LATER (positive shift)", () => {
    const days = Array.from({ length: 7 }, () => day(1, 20));
    expect(weatherShiftDays({ interval: 7, light: "MEDIUM", days })).toBeGreaterThan(0);
  });
  it("shift is clamped to ±40% of interval", () => {
    const days = Array.from({ length: 30 }, () => day(50));
    expect(weatherShiftDays({ interval: 10, light: "DIRECT_SUN", days })).toBe(-4);
  });
});
