import { makeStore } from './index';
import { fetchReadings } from './readingsSlice';

const payload = (deviceId: string) => ({ deviceId, intervalSeconds: 300, readings: [] });

describe('readings slice: last selected date wins', () => {
  it('ignores an old response that arrives after a newer one', () => {
    const store = makeStore();
    const argA = { id: 'inv-01', date: '2026-11-01' };
    const argB = { id: 'inv-01', date: '2026-11-02' };

    store.dispatch(fetchReadings.pending('req-A', argA));
    store.dispatch(fetchReadings.pending('req-B', argB)); // user changed the date
    store.dispatch(fetchReadings.fulfilled(payload('B'), 'req-B', argB)); // B answers first
    store.dispatch(fetchReadings.fulfilled(payload('A'), 'req-A', argA)); // A answers late

    const state = store.getState().readings;
    expect(state.date).toBe('2026-11-02');
    expect(state.data?.deviceId).toBe('B');
    expect(state.status).toBe('succeeded');
  });

  it('ignores an old error that arrives after a newer success', () => {
    const store = makeStore();
    const argA = { id: 'inv-01', date: '2026-11-01' };
    const argB = { id: 'inv-01', date: '2026-11-02' };

    store.dispatch(fetchReadings.pending('req-A', argA));
    store.dispatch(fetchReadings.pending('req-B', argB));
    store.dispatch(fetchReadings.fulfilled(payload('B'), 'req-B', argB));
    store.dispatch(fetchReadings.rejected(new Error('late failure'), 'req-A', argA));

    expect(store.getState().readings.status).toBe('succeeded');
    expect(store.getState().readings.error).toBeNull();
  });
});
