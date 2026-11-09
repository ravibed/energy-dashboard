import devicesData from '../data/devices.json';
import type { Device, ReadingsResponse } from '../types';
import { INTERVAL_SECONDS, makeReadings } from './generateReadings';

// ---------- settings (change here) ----------
export const mockConfig = {
  minDelayMs: 300, // random delay per request: 300 - 1200 ms
  maxDelayMs: 1200,
  failureRate: 0.2, // 20 % of the requests fail. Use 0 while testing the UI.
};

// ---------- the data files ----------
const devices = devicesData as Device[];

/**
 * Every file in src/data/readings/ named  <deviceId>_<date>.json  is loaded here.
 * Example: src/data/readings/inv-01_2026-11-03.json
 */
const readingFiles = import.meta.glob<ReadingsResponse>('../data/readings/*.json', {
  eager: true,
  import: 'default',
});

// ---------- the two endpoints ----------

/** GET /devices  -> src/data/devices.json */
export function getDevices(): Promise<Device[]> {
  return fakeRequest(() => devices);
}

/**
 * GET /devices/{id}/readings?date=YYYY-MM-DD   (date = a calendar day in Europe/Berlin)
 *  1. If a data file exists for this device and date, it is returned as it is.
 *  2. Otherwise the readings are generated, so every date works.
 */
export function getReadings(id: string, date: string): Promise<ReadingsResponse> {
  return fakeRequest(() => {
    const device = devices.find((d) => d.id === id);
    if (!device) throw new Error(`Device ${id} not found`);

    const file = readingFiles[`../data/readings/${id}_${date}.json`];
    if (file) return file;

    return { deviceId: id, intervalSeconds: INTERVAL_SECONDS, readings: makeReadings(device, date) };
  });
}

// ---------- fake network: random delay + random failure ----------
async function fakeRequest<T>(getData: () => T): Promise<T> {
  const { minDelayMs, maxDelayMs, failureRate } = mockConfig;
  const delay = minDelayMs + Math.random() * (maxDelayMs - minDelayMs);
  await new Promise((resolve) => setTimeout(resolve, delay));
  if (Math.random() < failureRate) throw new Error('Request failed (simulated server error)');
  return getData();
}
