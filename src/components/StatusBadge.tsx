import type { DeviceStatus } from '../types';

const LABELS: Record<DeviceStatus, string> = { online: 'Online', offline: 'Offline', fault: 'Fault' };

export const StatusBadge = ({ status }: { status: DeviceStatus }) => (
  <span className={`badge badge-${status}`}>
    <span className="dot" />
    {LABELS[status]}
  </span>
);
