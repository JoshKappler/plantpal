import { differenceInCalendarDays, parseISO } from "date-fns";
import type { CareType, Plant } from "./types";

/** Date key (YYYY-MM-DD) used to de-dupe one reminder per day. */
export function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function isDue(dueISO: string, nowISO: string): boolean {
  return differenceInCalendarDays(parseISO(dueISO), parseISO(nowISO)) <= 0;
}

/**
 * Plants that should get a reminder right now for the given care type:
 * due (or overdue) and not already reminded today, respecting archived/fertEnabled.
 */
export function plantsDueForReminder(
  plants: Plant[],
  nowISO: string,
  type: CareType,
): Plant[] {
  const today = dateKey(nowISO);
  return plants.filter((p) => {
    if (p.archived) return false;
    if (type === "WATER") {
      return isDue(p.waterNextDueAt, nowISO) && p.waterLastRemindedOn !== today;
    }
    if (!p.fertEnabled || !p.fertNextDueAt) return false;
    return isDue(p.fertNextDueAt, nowISO) && p.fertLastRemindedOn !== today;
  });
}
