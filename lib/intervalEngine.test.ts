import { describe, it, expect } from "vitest";
import { daysBetween, adjustInterval } from "./intervalEngine";

describe("daysBetween", () => {
  it("counts whole days", () => {
    expect(daysBetween("2026-06-01T09:00:00Z", "2026-06-08T09:00:00Z")).toBe(7);
  });
  it("is negative when b precedes a", () => {
    expect(daysBetween("2026-06-08T09:00:00Z", "2026-06-01T09:00:00Z")).toBe(-7);
  });
});

describe("adjustInterval", () => {
  it("moves halfway toward observed cadence (DAMPING 0.5)", () => {
    expect(adjustInterval(7, 13)).toBe(10); // 7 + 0.5*(13-7)
  });
  it("shortens when watered early and it needed it", () => {
    expect(adjustInterval(10, 6)).toBe(8); // 10 + 0.5*(6-10)
  });
  it("clamps to MIN_INTERVAL", () => {
    expect(adjustInterval(2, -50)).toBe(1);
  });
  it("clamps to MAX_INTERVAL", () => {
    expect(adjustInterval(100, 1000)).toBe(120);
  });
});
