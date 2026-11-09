import type { ReactNode } from 'react';

type Tone = 'default' | 'good' | 'warn' | 'bad' | 'muted';

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  children?: ReactNode;
}

export const StatCard = ({ label, value, hint, tone = 'default', children }: Props) => (
  <div className={`stat stat-${tone}`}>
    <span className="stat-label">{label}</span>
    <strong className="stat-value">{value}</strong>
    {hint && <span className="stat-hint">{hint}</span>}
    {children}
  </div>
);
