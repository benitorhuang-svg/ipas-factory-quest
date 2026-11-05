import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { hydrate } from './helpers/materials.mjs';
import { bundled } from './helpers/shell.mjs';

const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content/source-integration.json'), 'utf8'));
for (const record of manifest.files) {
  const file = path.join(root, record.target);
  assert.ok(fs.existsSync(file), record.target);
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  assert.equal(hash, record.sha256, `Source preservation: ${record.source}`);
}
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'dist/data.js'), 'utf8'), context);
const data = hydrate(context.window.FACTORY_QUEST_DATA);
assert.equal(data.studyMaterials.length, 28);
const doc = new JSDOM('').window.document;
const referenced = new Set();
for (const material of data.studyMaterials) {
  assert.ok(material.details.length > 1000, material.topicCode);
  for (const key of ['diagram3D', 'explainerImg', 'interactiveUrl']) if (material[key]) referenced.add(material[key]);
  doc.body.innerHTML = material.details;
  for (const element of doc.querySelectorAll('[src], [href]')) {
    const url = element.getAttribute('src') || element.getAttribute('href');
    if (/^(?:\.\/)?assets\//.test(url)) referenced.add(url.split('#')[0]);
  }
  for (const block of doc.querySelectorAll('.mermaid')) assert.ok(!/\\r|\\n/.test(block.textContent), `${material.topicCode}: escaped line endings`);
}
for (const pdf of data.pdfs) referenced.add(`assets/pdf/${pdf.name}`);
for (const url of referenced) assert.ok(fs.existsSync(path.join(root, 'dist', decodeURIComponent(url))), `Missing runtime asset: ${url}`);
const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const precache = { self: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'dist/precache.js'), 'utf8'), precache);
for (const file of ['diagrams.js', 'diagrams.css']) {
  const bundle = file.endsWith('.css') ? 'shell-bundle.css' : 'app-bundle.js';
  assert.ok(bundled(file) && html.includes(bundle)); assert.ok(precache.self.FACTORY_PRECACHE.assets.includes(bundle));
}
console.log(`PASS: ${manifest.files.length} source hashes preserved; 28 materials; ${referenced.size} linked runtime assets; diagram shell precache.`);
