/**
 * The device data in src/data/devices.json is fixed (lastSeen = 2026-11-03).
 * With the real clock every device would be "Offline" today, so by default the app
 * uses a fixed "now" that matches the data. Set USE_DEMO_CLOCK = false to use the real clock.
 */
export const USE_DEMO_CLOCK = true;
export const DEMO_NOW = '2026-11-03T10:45:00Z';

/** Use this everywhere instead of `new Date()`. */
export const getNow = (): Date => (USE_DEMO_CLOCK ? new Date(DEMO_NOW) : new Date());
