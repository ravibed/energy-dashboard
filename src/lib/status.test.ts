import { getStatus } from './status';

const now = new Date('2026-11-03T10:00:00Z').getTime();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

describe('getStatus', () => {
  it('is fault when the fault flag is set, even if the device is also stale', () => {
    expect(getStatus({ fault: true, lastSeen: minutesAgo(500) }, now)).toBe('fault');
    expect(getStatus({ fault: true, lastSeen: minutesAgo(1) }, now)).toBe('fault');
  });
  it('is online when seen within 15 minutes', () => {
    expect(getStatus({ fault: false, lastSeen: minutesAgo(2) }, now)).toBe('online');
  });
  it('is still online at exactly 15 minutes (only MORE than 15 is offline)', () => {
    expect(getStatus({ fault: false, lastSeen: minutesAgo(15) }, now)).toBe('online');
  });
  it('is offline when seen more than 15 minutes ago', () => {
    expect(getStatus({ fault: false, lastSeen: new Date(now - 15 * 60_000 - 1000).toISOString() }, now)).toBe('offline');
  });
});
