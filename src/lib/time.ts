export const TIME_ZONE = 'Europe/Berlin';

const partsFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/** Offset of Berlin from UTC (in ms) at the given instant. */
function berlinOffsetMs(utcMs: number): number {
  const secondMs = Math.floor(utcMs / 1000) * 1000;
  const p: Record<string, string> = {};
  for (const part of partsFormat.formatToParts(new Date(secondMs))) p[part.type] = part.value;
  const wallAsUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return wallAsUtc - secondMs;
}

/** "2026-11-03" for the given instant, as a calendar day in Berlin. */
export function todayInBerlin(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** The UTC instant (ms) at which the Berlin calendar day `date` starts (00:00 local). */
export function startOfBerlinDayMs(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d);
  // DST switches happen at 01:00 UTC, i.e. after local midnight, so two passes are exact.
  const guess = utcMidnight - berlinOffsetMs(utcMidnight);
  return utcMidnight - berlinOffsetMs(guess);
}

/**
 * End timestamps (ms) of every interval of a Berlin day. A day has 288 intervals of 5 min,
 * but 276 on the spring DST day (23 h) and 300 on the autumn DST day (25 h).
 */
export function expectedTimestamps(date: string, intervalSeconds = 300): number[] {
  const start = startOfBerlinDayMs(date);
  const end = startOfBerlinDayMs(addDays(date, 1));
  const step = intervalSeconds * 1000;
  const result: number[] = [];
  for (let t = start + step; t <= end; t += step) {
    result.push(t);
  }
  return result;
}

const hmFormat = new Intl.DateTimeFormat('de-DE', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const dateTimeFormat = new Intl.DateTimeFormat('de-DE', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export const formatHM = (ms: number): string => hmFormat.format(new Date(ms));
export const formatDateTime = (iso: string): string => dateTimeFormat.format(new Date(iso));
