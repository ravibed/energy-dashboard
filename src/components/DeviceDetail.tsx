import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getNow } from '../config';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchDevices } from '../store/devicesSlice';
import { fetchReadings } from '../store/readingsSlice';
import { summarizeDay } from '../lib/energy';
import { getStatus } from '../lib/status';
import { formatKw, formatKwh } from '../lib/format';
import { addDays, todayInBerlin } from '../lib/time';
import { PowerChart } from './PowerChart';
import { StatCard } from './StatCard';
import { StatusBadge } from './StatusBadge';
import { ErrorMessage, Loading } from './RequestState';
import { ChevronLeft, ChevronRight } from './icons';

export function DeviceDetail() {
  const { id = '' } = useParams();
  const dispatch = useAppDispatch();
  const today = todayInBerlin(getNow());
  const [date, setDate] = useState(today);
  const readings = useAppSelector((s) => s.readings);
  const devices = useAppSelector((s) => s.devices);
  const device = devices.items.find((d) => d.id === id);
  const isCurrent = readings.deviceId === id; // ignore leftovers from another device

  const load = useCallback(() => {
    void dispatch(fetchReadings({ id, date }));
  }, [dispatch, id, date]);

  useEffect(load, [load]); // runs again whenever the device or the date changes

  useEffect(() => {
    if (devices.status === 'idle') void dispatch(fetchDevices()); // direct visit of the URL: get the name
  }, [devices.status, dispatch]);

  // Always use the date the stored data belongs to, never the (possibly newer) picker value.
  const summary = useMemo(() => {
    if (!isCurrent || readings.status !== 'succeeded' || !readings.data || !readings.date) return null;
    return summarizeDay(readings.date, readings.data.readings, readings.data.intervalSeconds);
  }, [isCurrent, readings.status, readings.data, readings.date]);

  const { peakW, lowW } = useMemo(() => {
    const values = summary ? summary.points.flatMap((p) => (p.powerW === null ? [] : [p.powerW])) : [];
    return values.length ? { peakW: Math.max(...values), lowW: Math.min(...values) } : { peakW: null, lowW: null };
  }, [summary]);

  const completeness = summary && summary.expectedCount > 0 ? (summary.receivedCount / summary.expectedCount) * 100 : 0;
  const pickDate = (value: string) => value && setDate(value > today ? today : value);

  return (
    <section>
      <Link to="/devices" className="back">
        <ChevronLeft width={16} height={16} /> All devices
      </Link>

      <div className="page-head">
        <div>
          <h1>{device?.name ?? id}</h1>
          <p className="muted">
            <span className="capitalize">{device?.type ?? 'device'}</span> · all times in Europe/Berlin
          </p>
        </div>
        {device && <StatusBadge status={getStatus(device, getNow().getTime())} />}
      </div>

      <div className="date-nav">
        <button className="btn btn-icon" aria-label="Previous day" onClick={() => pickDate(addDays(date, -1))}>
          <ChevronLeft />
        </button>
        <input
          type="date"
          aria-label="Date"
          value={date}
          max={today}
          onChange={(e) => pickDate(e.target.value)}
        />
        <button
          className="btn btn-icon"
          aria-label="Next day"
          disabled={date >= today}
          onClick={() => pickDate(addDays(date, 1))}
        >
          <ChevronRight />
        </button>
        <button className="btn" disabled={date === today} onClick={() => setDate(today)}>
          Today
        </button>
      </div>

      {isCurrent && readings.status === 'loading' && <Loading label="Loading readings…" variant="chart" />}
      {isCurrent && readings.status === 'failed' && <ErrorMessage message={readings.error ?? 'Unknown error'} onRetry={load} />}

      {summary && (
        <>
          <div className="stats">
            <StatCard
              label="Net energy"
              value={formatKwh(summary.netEnergyKWh)}
              tone={summary.netEnergyKWh >= 0 ? 'good' : 'warn'}
              hint={summary.netEnergyKWh >= 0 ? 'delivered over the day' : 'consumed over the day'}
            />
            <StatCard
              label="Data completeness"
              value={`${summary.receivedCount} of ${summary.expectedCount} intervals received`}
              tone={completeness >= 95 ? 'good' : completeness >= 80 ? 'warn' : 'bad'}
            >
              <div className="bar" aria-hidden="true">
                <div className="bar-fill" style={{ width: `${completeness}%` }} />
              </div>
            </StatCard>
            <StatCard
              label="Peak power"
              value={peakW === null ? '–' : formatKw(peakW)}
              hint={lowW !== null && lowW < 0 ? `lowest (charging): ${formatKw(lowW)}` : 'highest 5-min average'}
            />
          </div>

          <div className="panel">
            <h2>Power over the day</h2>
            <PowerChart points={summary.points} />
            <p className="muted legend">Gaps in the line = no data received (not zero).</p>
          </div>
        </>
      )}
    </section>
  );
}
