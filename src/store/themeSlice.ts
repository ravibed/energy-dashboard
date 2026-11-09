import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

/** 'system' = follow the operating system setting. */
export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'energy-dashboard.theme';

const isPreference = (v: unknown): v is ThemePreference => v === 'system' || v === 'light' || v === 'dark';

/** localStorage can throw (private window, blocked storage), so every access is guarded. */
export function loadThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isPreference(stored)) return stored;
  } catch {
    // ignore: fall back to the system setting
  }
  return 'system';
}

export function saveThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // ignore: the choice just will not survive a reload
  }
}

interface ThemeState {
  preference: ThemePreference;
}

const themeSlice = createSlice({
  name: 'theme',
  // A function, so the stored choice is read when a store is created (not once at import time).
  initialState: (): ThemeState => ({ preference: loadThemePreference() }),
  reducers: {
    setTheme(state, action: PayloadAction<ThemePreference>) {
      state.preference = action.payload;
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
