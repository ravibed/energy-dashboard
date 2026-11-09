import { useEffect, useMemo, useState } from 'react';
import { getNow } from '../config';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchDevices } from '../store/devicesSlice';
import { getStatus } from '../lib/status';
import { formatKw } from '../lib/format';
import type { DeviceStatus } from '../types';
import { DeviceCard } from './DeviceCard';
import { StatCard } from './StatCard';
import { ErrorMessage, Loading } from './RequestState';

type StatusFilter = 'all' | DeviceStatus;
type SortKey = 'name' | 'power';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'fault', label: 'Fault' },
];

export function DeviceList() {
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((s) => s.devices);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');

  useEffect(() => {
    void dispatch(fetchDevices());
  }, [dispatch]);

  const withStatus = useMemo(() => {
    const now = getNow().getTime();
    return items.map((device) => ({ device, status: getStatus(device, now) }));
  }, [items]);

  const counts = useMemo(() => {
    const c = { all: withStatus.length, online: 0, offline: 0, fault: 0 };
    withStatus.forEach((r) => (c[r.status] += 1));
    return c;
  }, [withStatus]);

  const netPowerW = useMemo(() => items.reduce((sum, d) => sum + d.currentPowerW, 0), [items]);

  const rows = useMemo(
    () =>
      withStatus
        .filter((r) => filter === 'all' || r.status === filter)
        .sort((a, b) =>
          sortKey === 'name'
            ? a.device.name.localeCompare(b.device.name)
            : b.device.currentPowerW - a.device.currentPowerW, // highest power first
        ),
    [withStatus, filter, sortKey],
  );

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Devices</h1>
          <p className="muted">Solar inverters and batteries at this site</p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="summary">
          <StatCard label="Devices" value={counts.all} hint="at this site" />
          <StatCard label="Online" value={counts.online} tone="good" hint="seen in last 15 min" />
          <StatCard label="Offline" value={counts.offline} tone="muted" hint="no signal" />
          <StatCard label="Fault" value={counts.fault} tone="bad" hint="needs attention" />
          <StatCard label="Net power now" value={formatKw(netPowerW)} tone="warn" hint="all devices combined" />
        </div>
      )}

      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`chip ${filter === f.value ? 'chip-active' : ''}`}
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label} <span className="chip-count">{counts[f.value]}</span>
            </button>
          ))}
        </div>
        <label className="sort">
          <span className="muted">Sort by</span>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <option value="name">Name</option>
            <option value="power">Current power</option>
          </select>
        </label>
      </div>

      {status === 'loading' && items.length === 0 && <Loading label="Loading devices…" />}
      {status === 'failed' && (
        <ErrorMessage message={error ?? 'Unknown error'} onRetry={() => void dispatch(fetchDevices())} />
      )}
      {items.length > 0 && rows.length === 0 && <p className="empty">No devices match this filter.</p>}

      <ul className="cards">
        {rows.map(({ device, status: deviceStatus }) => (
          <DeviceCard key={device.id} device={device} status={deviceStatus} />
        ))}
      </ul>
    </section>
  );
}
