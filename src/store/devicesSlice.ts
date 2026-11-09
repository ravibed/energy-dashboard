import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getDevices } from '../api/mockApi';
import type { Device } from '../types';

export const fetchDevices = createAsyncThunk('devices/fetch', () => getDevices());

interface DevicesState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  items: Device[];
  error: string | null;
}
const initialState: DevicesState = { status: 'idle', items: [], error: null };

const devicesSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevices.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Unknown error';
      });
  },
});

export default devicesSlice.reducer;
