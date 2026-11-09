import type { ComponentType, SVGProps } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setTheme } from '../store/themeSlice';
import type { ThemePreference } from '../store/themeSlice';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';

const OPTIONS: { value: ThemePreference; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { value: 'system', label: 'System theme', Icon: MonitorIcon },
  { value: 'light', label: 'Light theme', Icon: SunIcon },
  { value: 'dark', label: 'Dark theme', Icon: MoonIcon },
];

export function ThemeToggle() {
  const dispatch = useAppDispatch();
  const preference = useAppSelector((s) => s.theme.preference);

  return (
    <div className="theme-switch" role="group" aria-label="Theme">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          className="theme-btn"
          aria-label={label}
          title={label}
          aria-pressed={preference === value}
          onClick={() => dispatch(setTheme(value))}
        >
          <Icon width={16} height={16} />
        </button>
      ))}
    </div>
  );
}
