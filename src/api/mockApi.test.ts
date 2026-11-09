import { getDevices, getReadings, mockConfig } from './mockApi';
import fileData from '../data/readings/inv-01_2026-11-03.json';

beforeAll(() => Object.assign(mockConfig, { minDelayMs: 0, maxDelayMs: 0, failureRate: 0 }));

describe('mock API', () => {
  it('GET /devices returns at least 8 devices of both types', async () => {
    const devices = await getDevices();
    expect(devices.length).toBeGreaterThanOrEqual(8);
    expect(new Set(devices.map((d) => d.type))).toEqual(new Set(['inverter', 'battery']));
  });

  it('returns the data file as it is when a file exists for that device and date', async () => {
    const result = await getReadings('inv-01', '2026-11-03');
    expect(result).toEqual(fileData);
    expect(result.deviceId).toBe('inv-01');
    expect(result.intervalSeconds).toBe(300);
    expect(result.readings[0]).toEqual({ timestamp: '2026-11-02T23:05:00Z', powerW: 0 });
  });

  it('generates readings for a date that has no file (same shape)', async () => {
    const result = await getReadings('bat-01', '2026-10-25'); // 25-hour day
    expect(result.deviceId).toBe('bat-01');
    expect(result.readings.length).toBeGreaterThan(200);
    expect(result.readings.length).toBeLessThanOrEqual(300);
    expect(result.readings[0].timestamp).toMatch(/^2026-10-24T22:\d\d:00Z$/);
  });

  it('fails for an unknown device', async () => {
    await expect(getReadings('nope-99', '2026-11-03')).rejects.toThrow('not found');
  });

  it('fails randomly when failureRate is 1', async () => {
    mockConfig.failureRate = 1;
    await expect(getDevices()).rejects.toThrow('simulated');
    mockConfig.failureRate = 0;
  });
});
