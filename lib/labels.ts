import type { DueState } from "./dueDate";

/** Human "in 3 days / due today / 2 days late" copy. */
export function dueLabel(state: DueState, days: number): string {
  if (state === "ok") return days === 1 ? "in 1 day" : `in ${days} days`;
  if (state === "due") return "due today";
  const late = Math.abs(days);
  return late === 1 ? "1 day late" : `${late} days late`;
}

/** Icon/accent color per status. */
export const TONE_DOT: Record<DueState, string> = {
  ok: "text-leaf",
  due: "text-sun",
  overdue: "text-bloom",
};

/** Urgency ordering: overdue first, then due, then ok. */
export const TONE_RANK: Record<DueState, number> = {
  overdue: 0,
  due: 1,
  ok: 2,
};
