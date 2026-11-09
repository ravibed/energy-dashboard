import type { Reading } from '../types';
import { expectedTimestamps } from './time';

export interface SeriesPoint {
  t: number; // interval end, ms since epoch
  powerW: number | null; // null = no data (a gap)
}

export interface DaySummary {
  points: SeriesPoint[];
  receivedCount: number;
  expectedCount: number;
  netEnergyKWh: number;
}

/**
 * Builds the full list of intervals of a Berlin day, puts the readings into it,
 * and calculates the net energy.
 *  - Missing readings stay `null` (no data). They are NOT treated as 0 and add no energy.
 *  - Readings outside the day, or not on an interval boundary, are ignored.
 *  - Energy per reading = powerW * intervalSeconds / 3600 (Wh), summed, divided by 1000 (kWh).
 */
export function summarizeDay(
  date: string,
  readings: Reading[],
  intervalSeconds: number,
): DaySummary {
  const expected = expectedTimestamps(date, intervalSeconds);
  const byTime = new Map<number, number>();
  for (const r of readings) byTime.set(new Date(r.timestamp).getTime(), r.powerW);

  let receivedCount = 0;
  let wattHours = 0;
  const points: SeriesPoint[] = expected.map((t) => {
    const powerW = byTime.get(t);
    if (powerW === undefined) return { t, powerW: null };
    receivedCount += 1;
    wattHours += (powerW * intervalSeconds) / 3600;
    return { t, powerW };
  });

  return { points, receivedCount, expectedCount: expected.length, netEnergyKWh: wattHours / 1000 };
}
