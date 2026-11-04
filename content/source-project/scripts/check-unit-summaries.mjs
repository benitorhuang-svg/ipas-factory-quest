import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { TOPICS_CONFIG } from './study-topics.mjs';
import { makeSummaryReader } from './unit-summary-reader-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = 'public/assets/interactive-diagrams/unit-summaries';
const manifestPath = path.join(root, publicRoot, 'manifest.json');
const failures = [];
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const expectedTopics = TOPICS_CONFIG.filter(({ code }) => /^M\d{5}$/.test(code));

if (!fs.existsSync(manifestPath)) {
  console.error('Unit summary manifest is missing.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const entries = manifest.diagrams ?? [];
const registry = fs.readFileSync(path.join(root, 'src/data/unit-summary-diagrams.ts'), 'utf8');
const registeredCodes = [...registry.matchAll(/'([M]\d{5})'/g)].map((match) => match[1]);
const expectedCodes = expectedTopics.map(({ code }) => code).sort();
const listedCodes = entries.map(({ code }) => code).sort();
if (JSON.stringify(expectedCodes) !== JSON.stringify(listedCodes)) {
  failures.push('Manifest must cover every exam unit exactly once.');
}
if (JSON.stringify(expectedCodes) !== JSON.stringify(registeredCodes.sort())) {
  failures.push('The PWA registry must match the exam unit inventory.');
}

let totalBytes = 0;
for (const topic of expectedTopics) {
  const entry = entries.find(({ code }) => code === topic.code);
  if (!entry) continue;
  const source = path.join(root, 'docs', topic.file);
  const asset = path.join(root, publicRoot, `${topic.code}.html`);
  const candidate = path.resolve(root, entry.candidate);
  const receiptPath = path.resolve(root, entry.receipt);
  const prefix = `${topic.code}: `;
  if (entry.source !== `docs/${topic.file}`) failures.push(prefix + 'source mapping differs.');
  for (const file of [source, asset, candidate, receiptPath]) {
    if (!fs.existsSync(file)) failures.push(prefix + `missing ${path.relative(root, file)}.`);
  }
  if (![source, asset, candidate, receiptPath].every(fs.existsSync)) continue;
  if (hash(source) !== entry.sourceSha256) failures.push(prefix + 'source changed; review and regenerate the summary.');
  if (hash(asset) !== entry.assetSha256) failures.push(prefix + 'published HTML differs from the manifest.');
  const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  const gates = ['validate', 'deliver', 'check', 'browser-check'];
  if (!receipt.ok || !gates.every((gate) => receipt.gates?.[gate] === 'pass')) {
    failures.push(prefix + 'Archify finalization did not pass every gate.');
  }
  if (hash(candidate) !== receipt.specification?.sha256) failures.push(prefix + 'candidate differs from its receipt.');
  if (hash(asset) !== receipt.artifact?.sha256) failures.push(prefix + 'published HTML differs from the finalized artifact.');
  const readerFile = path.join(root, publicRoot, `${topic.code}.reader.json`);
  if (!fs.existsSync(readerFile)
    || JSON.stringify(JSON.parse(fs.readFileSync(readerFile, 'utf8'))) !== JSON.stringify(makeSummaryReader(entry, root))) {
    failures.push(prefix + 'readable guide differs from the reviewed Archify candidate.');
  }
  totalBytes += fs.statSync(asset).size;
}

const extraAssets = fs.readdirSync(path.join(root, publicRoot))
  .filter((file) => /^M\d{5}\.html$/.test(file) && !expectedCodes.includes(file.slice(0, -5)));
if (extraAssets.length) failures.push(`Unregistered unit summaries: ${extraAssets.join(', ')}`);

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exitCode = 1;
} else {
  console.log(`Archify summaries: ${entries.length} units, all sources/assets/receipts match, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB.`);
}
