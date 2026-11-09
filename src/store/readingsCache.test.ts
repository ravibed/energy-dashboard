import { vi } from 'vitest';
import * as api from '../api/mockApi';
import { makeStore } from './index';
import { cacheKey, fetchReadings, isCacheableDate } from './readingsSlice';

vi.mock('../api/mockApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/mockApi')>()),
  getReadings: vi.fn(),
}));

// The demo clock (src/config.ts) says "now" is 2026-11-03, so that is "today".
const TODAY = '2026-11-03';
const PAST = '2026-11-02';
const response = (deviceId: string) => ({ deviceId, intervalSeconds: 300, readings: [] });

describe('readings cache', () => {
  beforeEach(() => vi.mocked(api.getReadings).mockReset());

  it('only past days are cacheable, not today', () => {
    const now = new Date('2026-11-03T10:45:00Z');
    expect(isCacheableDate('2026-11-02', now)).toBe(true);
    expect(isCacheableDate('2026-11-03', now)).toBe(false);
  });

  it('loads a past day only once, and shows it at once the second time', async () => {
    vi.mocked(api.getReadings).mockResolvedValue(response('inv-01'));
    const store = makeStore();

    await store.dispatch(fetchReadings({ id: 'inv-01', date: PAST }));
    const second = store.dispatch(fetchReadings({ id: 'inv-01', date: PAST }));
    // right after dispatch (before awaiting): already succeeded, no loading state
    expect(store.getState().readings.status).toBe('succeeded');
    await second;

    expect(api.getReadings).toHaveBeenCalledTimes(1);
    expect(store.getState().readings.data?.deviceId).toBe('inv-01');
  });

  it('caches per device: the same day of another device is loaded', async () => {
    vi.mocked(api.getReadings).mockResolvedValue(response('x'));
    const store = makeStore();
    await store.dispatch(fetchReadings({ id: 'inv-01', date: PAST }));
    await store.dispatch(fetchReadings({ id: 'inv-02', date: PAST }));
    expect(api.getReadings).toHaveBeenCalledTimes(2);
  });

  it('always loads today again (the day is not finished)', async () => {
    vi.mocked(api.getReadings).mockResolvedValue(response('inv-01'));
    const store = makeStore();
    await store.dispatch(fetchReadings({ id: 'inv-01', date: TODAY }));
    await store.dispatch(fetchReadings({ id: 'inv-01', date: TODAY }));
    expect(api.getReadings).toHaveBeenCalledTimes(2);
    expect(store.getState().readings.cache).toEqual({});
  });

  it('does not cache a failed request, so Retry calls the API again', async () => {
    vi.mocked(api.getReadings)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(response('inv-01'));
    const store = makeStore();

    await store.dispatch(fetchReadings({ id: 'inv-01', date: PAST }));
    expect(store.getState().readings.status).toBe('failed');
    await store.dispatch(fetchReadings({ id: 'inv-01', date: PAST }));

    expect(api.getReadings).toHaveBeenCalledTimes(2);
    expect(store.getState().readings.status).toBe('succeeded');
  });

  it('caches a stale answer but does not show it', () => {
    const store = makeStore();
    const argA = { id: 'inv-01', date: '2026-11-01' };
    const argB = { id: 'inv-01', date: '2026-11-02' };

    store.dispatch(fetchReadings.pending('req-A', argA));
    store.dispatch(fetchReadings.pending('req-B', argB));
    store.dispatch(fetchReadings.fulfilled(response('B'), 'req-B', argB, { cacheable: true }));
    store.dispatch(fetchReadings.fulfilled(response('A'), 'req-A', argA, { cacheable: true })); // late

    const state = store.getState().readings;
    expect(state.data?.deviceId).toBe('B'); // screen shows the latest choice
    expect(state.cache[cacheKey(argA)]?.deviceId).toBe('A'); // but A is ready for later
  });
});
