import { differenceInCalendarDays, parseISO } from "date-fns";
import { CARE } from "./config";

/** Whole calendar days from a -> b (negative if b precedes a). */
export function daysBetween(aISO: string, bISO: string): number {
  return differenceInCalendarDays(parseISO(bISO), parseISO(aISO));
}

/**
 * Damped EMA of the interval toward the observed cadence, so a single odd
 * watering nudges rather than whipsaws the schedule. Rounded + clamped.
 */
export function adjustInterval(current: number, actualElapsedDays: number): number {
  const next = Math.round(current + CARE.DAMPING * (actualElapsedDays - current));
  return Math.min(CARE.MAX_INTERVAL, Math.max(CARE.MIN_INTERVAL, next));
}
