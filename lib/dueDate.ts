import { addDays, differenceInCalendarDays, formatISO, parseISO } from "date-fns";

export type DueState = "ok" | "due" | "overdue";

/** ISO timestamp `interval` days after `lastAtISO`. */
export function nextDue(lastAtISO: string, intervalDays: number): string {
  return formatISO(addDays(parseISO(lastAtISO), intervalDays));
}

/**
 * Where a plant stands relative to now. `days` is calendar-days-until-due
 * (0 = due today, negative = overdue).
 */
export function dueStatus(
  nextDueISO: string,
  nowISO: string,
): { state: DueState; days: number } {
  const days = differenceInCalendarDays(parseISO(nextDueISO), parseISO(nowISO));
  const state: DueState = days > 0 ? "ok" : days === 0 ? "due" : "overdue";
  return { state, days };
}
