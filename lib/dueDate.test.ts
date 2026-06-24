import { describe, it, expect } from "vitest";
import { nextDue, dueStatus } from "./dueDate";

describe("nextDue", () => {
  it("adds interval days", () => {
    expect(nextDue("2026-06-01T09:00:00Z", 7).startsWith("2026-06-08")).toBe(true);
  });
});

describe("dueStatus", () => {
  it("ok in the future", () => {
    expect(dueStatus("2026-06-10T09:00:00Z", "2026-06-07T09:00:00Z")).toEqual({
      state: "ok",
      days: 3,
    });
  });
  it("due today", () => {
    expect(dueStatus("2026-06-07T09:00:00Z", "2026-06-07T12:00:00Z")).toEqual({
      state: "due",
      days: 0,
    });
  });
  it("overdue", () => {
    expect(dueStatus("2026-06-05T09:00:00Z", "2026-06-07T09:00:00Z")).toEqual({
      state: "overdue",
      days: -2,
    });
  });
});
