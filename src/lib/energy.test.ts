import { summarizeDay } from './energy';
import { expectedTimestamps } from './time';
import type { Reading } from '../types';

const full = (date: string, powerW: number): Reading[] =>
  expectedTimestamps(date).map((t) => ({ timestamp: new Date(t).toISOString(), powerW }));

describe('expectedTimestamps (Europe/Berlin)', () => {
  it('normal winter day: 288 intervals, first ends 00:05 local (= 23:05Z the day before)', () => {
    const ts = expectedTimestamps('2026-11-03');
    expect(ts).toHaveLength(288);
    expect(new Date(ts[0]).toISOString()).toBe('2026-11-02T23:05:00.000Z');
    expect(new Date(ts[287]).toISOString()).toBe('2026-11-03T23:00:00.000Z');
  });
  it('normal summer day starts at 22:05Z the day before', () => {
    expect(new Date(expectedTimestamps('2026-07-01')[0]).toISOString()).toBe('2026-06-30T22:05:00.000Z');
  });
  it('spring DST day (29 Mar 2026) has 276 intervals', () => {
    const ts = expectedTimestamps('2026-03-29');
    expect(ts).toHaveLength(276);
    expect(new Date(ts[0]).toISOString()).toBe('2026-03-28T23:05:00.000Z');
    expect(new Date(ts[275]).toISOString()).toBe('2026-03-29T22:00:00.000Z');
  });
  it('autumn DST day (25 Oct 2026) has 300 intervals', () => {
    const ts = expectedTimestamps('2026-10-25');
    expect(ts).toHaveLength(300);
    expect(new Date(ts[0]).toISOString()).toBe('2026-10-24T22:05:00.000Z');
    expect(new Date(ts[299]).toISOString()).toBe('2026-10-25T23:00:00.000Z');
  });
});

describe('summarizeDay', () => {
  it('constant 1000 W for a normal day = 24 kWh, 288 of 288', () => {
    const s = summarizeDay('2026-11-03', full('2026-11-03', 1000), 300);
    expect(s.netEnergyKWh).toBeCloseTo(24, 6);
    expect(s.receivedCount).toBe(288);
    expect(s.expectedCount).toBe(288);
  });
  it('spring DST day: 1000 W all day = 23 kWh (the day is only 23 h long)', () => {
    const s = summarizeDay('2026-03-29', full('2026-03-29', 1000), 300);
    expect(s.netEnergyKWh).toBeCloseTo(23, 6);
    expect(s.expectedCount).toBe(276);
    expect(s.receivedCount).toBe(276);
  });
  it('autumn DST day: 1000 W all day = 25 kWh (the day is 25 h long)', () => {
    const s = summarizeDay('2026-10-25', full('2026-10-25', 1000), 300);
    expect(s.netEnergyKWh).toBeCloseTo(25, 6);
    expect(s.expectedCount).toBe(300);
  });
  it('missing readings are gaps (null), add no energy, and lower the received count', () => {
    const readings = full('2026-11-03', 1000).slice(12); // first hour missing (12 intervals)
    const s = summarizeDay('2026-11-03', readings, 300);
    expect(s.receivedCount).toBe(276);
    expect(s.netEnergyKWh).toBeCloseTo(23, 6); // NOT 24: missing is not "assumed"
    expect(s.points.slice(0, 12).every((p) => p.powerW === null)).toBe(true);
    expect(s.points[12].powerW).toBe(1000);
  });
  it('a real 0 W reading is data, not a gap', () => {
    const s = summarizeDay('2026-11-03', full('2026-11-03', 0), 300);
    expect(s.receivedCount).toBe(288);
    expect(s.points[0].powerW).toBe(0);
  });
  it('negative power (battery charging) reduces the net energy', () => {
    const base = full('2026-11-03', 0);
    base[0] = { ...base[0], powerW: 1200 }; // +100 Wh
    base[1] = { ...base[1], powerW: -2400 }; // -200 Wh
    expect(summarizeDay('2026-11-03', base, 300).netEnergyKWh).toBeCloseTo(-0.1, 6);
  });
  it('ignores readings that belong to another day', () => {
    const s = summarizeDay('2026-11-03', full('2026-11-04', 1000), 300);
    expect(s.receivedCount).toBe(0);
    expect(s.netEnergyKWh).toBe(0);
  });
  it('no readings at all: 0 kWh, 0 received', () => {
    const s = summarizeDay('2026-11-03', [], 300);
    expect(s.netEnergyKWh).toBe(0);
    expect(s.receivedCount).toBe(0);
    expect(s.expectedCount).toBe(288);
  });
});
