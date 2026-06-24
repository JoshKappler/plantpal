import { WEATHER } from "./config";
import type { DailyWeather, LightLevel } from "./types";

/**
 * Days to shift an OUTDOOR plant's due date based on recent weather.
 * Negative = water sooner (hot/dry), positive = push back (cool/rainy).
 * Bounded to ±(MAX_SHIFT_FRAC * interval). Indoor plants should not call this.
 */
export function weatherShiftDays({
  interval,
  light,
  days,
}: {
  interval: number;
  light: LightLevel;
  days: DailyWeather[];
}): number {
  if (!days.length) return 0;
  const mult = WEATHER.LIGHT_MULT[light];
  const cum = days.reduce(
    (s, d) => s + Math.max(0, d.et0 * mult - WEATHER.RAIN_EFFECT * d.precip),
    0,
  );
  const expected = interval * WEATHER.ET0_REF * mult;
  const ratio = expected === 0 ? 1 : cum / expected;
  const raw = Math.round((1 - ratio) * interval);
  const cap = Math.round(WEATHER.MAX_SHIFT_FRAC * interval);
  return Math.min(cap, Math.max(-cap, raw));
}
