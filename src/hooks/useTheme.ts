import { useLayoutEffect, useSyncExternalStore } from 'react';
import { useAppSelector } from '../store';
import { saveThemePreference } from '../store/themeSlice';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const getMedia = () => (typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null);

function subscribe(onChange: () => void) {
  const media = getMedia();
  media?.addEventListener('change', onChange);
  return () => media?.removeEventListener('change', onChange);
}

/** true when the operating system is in dark mode. Updates live when the user changes it. */
export function useSystemPrefersDark(): boolean {
  return useSyncExternalStore(subscribe, () => getMedia()?.matches ?? false, () => false);
}

/** The theme that is really shown: the user's choice, or the system setting for 'system'. */
export function useResolvedTheme(): 'light' | 'dark' {
  const preference = useAppSelector((s) => s.theme.preference);
  const systemDark = useSystemPrefersDark();
  if (preference === 'system') return systemDark ? 'dark' : 'light';
  return preference;
}

/**
 * Puts the user's choice on <html data-theme="..."> (the CSS reads it) and saves it.
 * useLayoutEffect, not useEffect: layout effects run before ALL normal effects,
 * so the chart's useEffect already reads the new CSS colours.
 */
export function useApplyTheme(): void {
  const preference = useAppSelector((s) => s.theme.preference);
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (preference === 'system') delete root.dataset.theme;
    else root.dataset.theme = preference;
    saveThemePreference(preference);
  }, [preference]);
}
