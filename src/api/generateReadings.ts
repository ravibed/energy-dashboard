import type { Device, Reading } from '../types';
import { expectedTimestamps, startOfBerlinDayMs } from '../lib/time';

export const INTERVAL_SECONDS = 300;

/** Pseudo-random number 0..1. Same input gives the same output (so a day always looks the same). */
const noise = (n: number): number => {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
};

/** Power (W) of a device at a given hour of the day. + = delivering, - = charging. */
function powerAt(device: Device, hour: number): number {
  if (device.type === 'inverter') {
    // sun: 07:00 - 17:00, strongest at noon
    return hour >= 7 && hour <= 17 ? 6000 * Math.sin((Math.PI * (hour - 7)) / 10) ** 2 : 0;
  }
  if (hour >= 10 && hour <= 15) return -2500 * Math.sin((Math.PI * (hour - 10)) / 5); // charging at noon
  if (hour >= 18 && hour <= 23) return 1800 * Math.sin((Math.PI * (hour - 18)) / 5); // discharging in the evening
  return 0;
}

/** All readings of one Berlin day. About 5 % are missing, plus one longer outage. */
export function makeReadings(device: Device, date: string): Reading[] {
  const dayStart = startOfBerlinDayMs(date);
  const seed = [...device.id + date].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const outageStart = 60 + (seed % 150); // 8 missing intervals in a row

  const readings: Reading[] = [];
  expectedTimestamps(date, INTERVAL_SECONDS).forEach((time, i) => {
    const inOutage = i >= outageStart && i < outageStart + 8;
    const randomGap = noise(seed + i) < 0.05;
    if (inOutage || randomGap) return; // missing = no reading at all

    const hour = (time - dayStart) / 3_600_000;
    const powerW = Math.round(powerAt(device, hour) * (0.9 + 0.1 * noise(seed * 7 + i)));
    // "2026-11-02T23:05:00Z" (same format as in the task, without milliseconds)
    readings.push({ timestamp: new Date(time).toISOString().replace('.000Z', 'Z'), powerW });
  });
  return readings;
}
