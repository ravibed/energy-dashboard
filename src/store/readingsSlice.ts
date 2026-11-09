import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getReadings } from '../api/mockApi';
import { getNow } from '../config';
import { todayInBerlin } from '../lib/time';
import type { ReadingsResponse } from '../types';

export interface ReadingsArg {
  id: string;
  date: string;
}

/** Key of one device-day in the cache, e.g. "inv-01_2026-11-02". */
export const cacheKey = ({ id, date }: ReadingsArg): string => `${id}_${date}`;

/**
 * Only past days are cached. Today is not finished yet (new readings keep arriving),
 * so today is always loaded again.
 */
export const isCacheableDate = (date: string, now: Date = getNow()): boolean => date < todayInBerlin(now);

export const fetchReadings = createAsyncThunk<
  ReadingsResponse,
  ReadingsArg,
  // Only the part of the state this thunk needs (importing RootState here would be a circular import).
  { state: { readings: ReadingsState }; fulfilledMeta: { cacheable: boolean } }
>('readings/fetch', async (arg, { getState, fulfillWithValue }) => {
  const cacheable = isCacheableDate(arg.date);
  const cached = getState().readings.cache[cacheKey(arg)];
  if (cached) return fulfillWithValue(cached, { cacheable }); // no request, no delay, no random failure
  const data = await getReadings(arg.id, arg.date);
  return fulfillWithValue(data, { cacheable });
});

export interface ReadingsState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  data: ReadingsResponse | null;
  deviceId: string | null; // the device the stored data/request belongs to
  date: string | null; // the day the stored data/request belongs to
  error: string | null;
  /** requestId of the LATEST request. Answers from any other request are ignored. */
  currentRequestId: string | null;
  /** Past days that were already loaded, by cacheKey(). Failed requests are never stored. */
  cache: Record<string, ReadingsResponse>;
}
const initialState: ReadingsState = {
  status: 'idle',
  data: null,
  deviceId: null,
  date: null,
  error: null,
  currentRequestId: null,
  cache: {},
};

const readingsSlice = createSlice({
  name: 'readings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReadings.pending, (state, action) => {
        const hit = state.cache[cacheKey(action.meta.arg)];
        // Cache hit: show the data right away, so there is no loading flash.
        state.status = hit ? 'succeeded' : 'loading';
        state.data = hit ?? null;
        state.error = null;
        state.date = action.meta.arg.date;
        state.deviceId = action.meta.arg.id;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchReadings.fulfilled, (state, action) => {
        // Store even a stale answer: it is correct data for its own day, just not the day on screen.
        if (action.meta.cacheable) state.cache[cacheKey(action.meta.arg)] = action.payload;
        if (state.currentRequestId !== action.meta.requestId) return; // stale answer -> do not show it
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchReadings.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return; // stale error -> ignore
        state.status = 'failed';
        state.error = action.error.message ?? 'Unknown error';
      });
  },
});

export default readingsSlice.reducer;
