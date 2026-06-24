import { describe, it, expect } from "vitest";
import { lookupPlant, searchPlants, defaultSeed } from "./library";

describe("lookupPlant", () => {
  it("exact common-name hit", () => {
    expect(lookupPlant("Pothos")?.sciName).toBe("Epipremnum aureum");
  });
  it("alias hit", () => {
    expect(lookupPlant("Devil's Ivy")?.commonName).toBe("Pothos");
  });
  it("scientific-name hit", () => {
    expect(lookupPlant("Epipremnum aureum")?.commonName).toBe("Pothos");
  });
  it("is case-insensitive", () => {
    expect(lookupPlant("pOtHoS")?.commonName).toBe("Pothos");
  });
  it("returns null on miss", () => {
    expect(lookupPlant("Nonexistent Plant XYZ")).toBeNull();
  });
});

describe("searchPlants", () => {
  it("matches partial across the catalog", () => {
    expect(searchPlants("palm").length).toBeGreaterThan(0);
  });
  it("returns nothing for empty query", () => {
    expect(searchPlants("")).toHaveLength(0);
  });
});

describe("defaultSeed", () => {
  it("returns safe fallbacks", () => {
    expect(defaultSeed()).toEqual({
      waterIntervalDays: 7,
      fertIntervalDays: 30,
      suggestedLight: "BRIGHT_INDIRECT",
    });
  });
});
