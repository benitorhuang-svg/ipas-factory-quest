import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = 'assets/interactive-diagrams/unit-summaries';
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public', directory, 'manifest.json'), 'utf8'));
const worker = fs.readFileSync(path.join(root, 'dist/sw.js'), 'utf8');
const entries = new Map([...worker.matchAll(/\{url:"([^"]+)",revision:(null|"[^"]*")\}/g)]
  .map((match) => [match[1], JSON.parse(match[2])]));
const failures = [];
for (const { code } of manifest.diagrams) {
  for (const suffix of ['html', 'reader.json']) {
    const asset = `${directory}/${code}.${suffix}`;
    const content = fs.readFileSync(path.join(root, 'dist', asset));
    const expected = crypto.createHash('md5').update(content).digest('hex');
    if (entries.get(asset) !== expected) failures.push(`${asset}: missing or stale cache revision.`);
  }
}
if (!worker.includes('.clientsClaim()') || !worker.includes('skipWaiting()')) failures.push('The installed worker must activate and claim its clients.');
if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exitCode = 1;
} else console.log(`Offline summaries: ${manifest.diagrams.length} diagrams and guides have current content revisions; immediate activation enabled.`);
