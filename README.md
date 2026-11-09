# Energy Monitoring Dashboard

**Author:** Ravikumar Bed  
**Email:** [ravi.bed@outlook.com](mailto:ravi.bed@outlook.com)

React + TypeScript (strict) + Vite + Redux Toolkit + Vitest. Charts: Apache ECharts.
Requirements: Node.js 18.18 or newer (20 or 22 recommended).

## Install, run, test

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # all tests
npm run build      # typecheck + production build
```

Optional Python part (Python 3.12):

```bash
cd python
pip install -r requirements.txt
pytest             # tests (try also: python -m pytest )
python demo.py     # prints the hourly table (try also: python demo.py)
python demo.py 2026-03-29 # prints the hourly table (try also: python demo.py 2026-03-29)
python demo.py 2026-10-25 # prints the hourly table (try also: python demo.py 2026-10-25)
```

## The data (exactly the shapes from the task)

Everything is stored as JSON files in `src/data/` and the mock API reads them:

- `src/data/devices.json` - the device list (`GET /devices`). Edit it to add or change devices.
- `src/data/readings/<deviceId>_<date>.json` - the readings of one device and one day
  (`GET /devices/{id}/readings?date=...`), e.g. `inv-01_2026-11-03.json`. Edit them by hand if you like.
- For a date that has **no file**, the API generates readings (about 5 % random gaps plus one longer outage),
  because the task requires that every date works. The generator is `src/api/generateReadings.ts`.
- New file for another day: `npm run make-data -- 2026-11-04` writes one file per device for that date.
- Delay (300-1200 ms) and 20 % failures: `mockConfig` at the top of `src/api/mockApi.ts`.

`lastSeen` in `devices.json` is fixed (2026-11-03), so with the real clock every device would be Offline.
Therefore `src/config.ts` uses a fixed "now" (`2026-11-03T10:45:00Z`) by default. Set `USE_DEMO_CLOCK = false`
to use the real clock.

## Structure

| Folder | Purpose |
| --- | --- |
| `src/data` | Fixed JSON data (devices and readings). |
| `src/api` | Mock API (data access) and the readings generator. |
| `src/store` | Redux Toolkit slices with `createAsyncThunk` (state). |
| `src/lib` | Pure functions: time zones, energy calculation, status. No React. |
| `src/hooks` | React hooks (theme). |
| `src/components` | UI only. |
| `python/` | Optional hourly aggregation (Pydantic v2, zoneinfo, pytest). |

## How to add a new API function (3 steps)

1. `src/api/mockApi.ts`: add `export function getSomething() { return fakeRequest(() => ...); }`
2. `src/store/`: add `createAsyncThunk('something/fetch', () => getSomething())` and handle pending / fulfilled / rejected like `devicesSlice.ts`.
3. A component calls `dispatch(fetchSomething())` and reads the state with `useAppSelector`.

## Main decisions and why

- **Time zone in one place:** `TIME_ZONE` in `src/lib/time.ts`. A day has 288 intervals, 276 on 29 Mar 2026 and 300 on 25 Oct 2026.
- **Gaps are `null`, never 0.** All expected intervals are created, readings are put into their slot, empty slots stay `null`.
  ECharts does not join across `null`, so gaps stay visible.
- **Net energy** = sum of `powerW * 300 / 3600` Wh over received readings / 1000. Missing intervals add nothing. Charging (negative) reduces it.
- **Last selected date wins:** each request has a `requestId`; the slice ignores answers of older requests (tested).
- **Status:** fault flag, else offline if last seen is MORE than 15 min ago, else online.
- **Cache of loaded days:** `readingsSlice` keeps every loaded *past* day (key `<deviceId>_<date>`). Going back to a day
  shows it at once, without a request. Today is never cached, because new readings keep arriving. Failed requests are
  never cached, so Retry always asks the API again. A late (stale) answer is cached but not shown.
- **Theme switch:** System / Light / Dark in the top bar. The choice is in Redux (`themeSlice`), saved in `localStorage`
  and set as `<html data-theme="...">`; the CSS reads that attribute. The chart reads its colours from CSS variables,
  so it is drawn again when the theme changes.
- **Python:** a reading belongs to the hour in which its interval ends. Hours are real elapsed hours (23 / 24 / 25 on DST days).

