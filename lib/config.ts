// Central tunable constants for PlantPal's care + weather logic.
// Everything that may need real-world calibration lives here.

export const CARE = {
  /** EMA damping when adjusting an interval toward observed cadence. */
  DAMPING: 0.5,
  /** Minimum allowed watering/fertilizing interval, in days. */
  MIN_INTERVAL: 1,
  /** Maximum allowed interval, in days. */
  MAX_INTERVAL: 120,
  /** Fallback watering interval when the library has no match, in days. */
  DEFAULT_INTERVAL: 7,
  /** Fallback fertilizing interval, in days. */
  DEFAULT_FERT_INTERVAL: 30,
  /** Default daily reminder hour (local), 0-23. */
  DEFAULT_REMINDER_HOUR: 9,
} as const;

export const WEATHER = {
  /** Reference reference-ET0 (mm/day) at which a "normal" stretch yields ~0 shift. */
  ET0_REF: 3.8,
  /** How effectively rainfall offsets evapotranspiration (per mm). */
  RAIN_EFFECT: 0.9,
  /** Max due-date shift as a fraction of the interval (±). */
  MAX_SHIFT_FRAC: 0.4,
  /** Drying multiplier by light exposure (sunnier dries faster). */
  LIGHT_MULT: {
    LOW: 0.7,
    MEDIUM: 0.9,
    BRIGHT_INDIRECT: 1.1,
    DIRECT_SUN: 1.35,
  },
} as const;
