import { Link } from 'react-router-dom';
import type { Device, DeviceStatus } from '../types';
import { formatKw } from '../lib/format';
import { formatDateTime } from '../lib/time';
import { StatusBadge } from './StatusBadge';
import { BatteryIcon, SunIcon } from './icons';

const MAX_BAR_W = 10_000;

export function DeviceCard({ device, status }: { device: Device; status: DeviceStatus }) {
  const charging = device.currentPowerW < 0;
  const pct = Math.min(100, (Math.abs(device.currentPowerW) / MAX_BAR_W) * 100);
  const Icon = device.type === 'inverter' ? SunIcon : BatteryIcon;

  return (
    <li className={`card card-${status}`}>
      <div className="card-top">
        <span className={`type-icon type-${device.type}`}>
          <Icon />
        </span>
        <div className="card-heading">
          <Link to={`/devices/${device.id}`} className="card-title">
            {device.name}
          </Link>
          <span className="muted capitalize">{device.type}</span>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="power">
        <span className="power-value">{formatKw(device.currentPowerW)}</span>
        <span className="muted">{charging ? 'charging' : device.currentPowerW > 0 ? 'delivering' : 'idle'}</span>
      </div>
      <div className="bar" aria-hidden="true">
        <div className={`bar-fill ${charging ? 'bar-charging' : ''}`} style={{ width: `${pct}%` }} />
      </div>

      <p className="muted last-seen">Last seen {formatDateTime(device.lastSeen)}</p>
    </li>
  );
}
