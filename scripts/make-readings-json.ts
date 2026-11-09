/**
 * Writes one readings file per device:  src/data/readings/<deviceId>_<date>.json
 * Run:  npm run make-data                 (date 2026-11-03)
 *       npm run make-data -- 2026-11-04   (another date)
 * You can edit the generated files by hand afterwards.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { INTERVAL_SECONDS, makeReadings } from '../src/api/generateReadings';

const date = process.argv[2] ?? '2026-11-03';
const dataDir = fileURLToPath(new URL('../src/data/', import.meta.url));
const devices = JSON.parse(readFileSync(`${dataDir}devices.json`, 'utf8')) as { id: string; type: 'inverter' | 'battery' }[];

mkdirSync(`${dataDir}readings`, { recursive: true });
for (const device of devices) {
  const rows = makeReadings(device as never, date)
    .map((r) => `    { "timestamp": "${r.timestamp}", "powerW": ${r.powerW} }`)
    .join(',\n');
  const text = `{\n  "deviceId": "${device.id}",\n  "intervalSeconds": ${INTERVAL_SECONDS},\n  "readings": [\n${rows}\n  ]\n}\n`;
  writeFileSync(`${dataDir}readings/${device.id}_${date}.json`, text);
  console.log(`wrote readings/${device.id}_${date}.json`);
}
