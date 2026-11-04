import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeSummaryReader } from './unit-summary-reader-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetRoot = path.join(root, 'public/assets/interactive-diagrams/unit-summaries');
const manifest = JSON.parse(fs.readFileSync(path.join(assetRoot, 'manifest.json'), 'utf8'));
const check = process.argv.includes('--check');
const failures = [];
let bytes = 0;
for (const entry of manifest.diagrams) {
  const file = path.join(assetRoot, `${entry.code}.reader.json`);
  const content = `${JSON.stringify(makeSummaryReader(entry, root), null, 2)}\n`;
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) failures.push(entry.code);
  } else fs.writeFileSync(file, content, 'utf8');
  bytes += Buffer.byteLength(content);
}
if (failures.length) {
  console.error(`Stale summary readers: ${failures.join(', ')}. Run npm run sync:unit-summary-readers.`);
  process.exitCode = 1;
} else console.log(`Summary readers: ${manifest.diagrams.length} units, ${(bytes / 1024).toFixed(1)} KiB, ${check ? 'verified' : 'generated'}.`);
