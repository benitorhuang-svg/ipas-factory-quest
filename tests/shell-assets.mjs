import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';
import { hydrate } from './helpers/materials.mjs';
import { shell, bundled } from './helpers/shell.mjs';

const html = fs.readFileSync('dist/index.html', 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
const styles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(match => match[1]);
assert.ok(!scripts.some(file => /mermaid|katex/.test(file)), 'Renderers must not block the initial shell');
const errors = [];
const diagnostics = new VirtualConsole();
diagnostics.on('jsdomError', error => errors.push(error.message));
const dom = new JSDOM('<!doctype html><head></head><body></body>', { runScripts: 'dangerously', url: 'https://localhost/', virtualConsole: diagnostics });
const { window } = dom;
const doc = window.document;
function load(file) {
  const script = doc.createElement('script');
  script.textContent = fs.readFileSync(`dist/${file}`, 'utf8');
  doc.body.append(script);
}
for (const file of styles) {
  const style = doc.createElement('style');
  style.textContent = fs.readFileSync(`dist/${file}`, 'utf8');
  doc.head.append(style);
  assert.ok(style.sheet?.cssRules.length, `${file}: valid CSS`);
}
load('asset-loader.js');
const first = window.FactoryAssets.mermaid();
assert.equal(first, window.FactoryAssets.mermaid(), 'Concurrent requests share one renderer load');
const rejected = assert.rejects(first, /mermaid/);
doc.querySelector('script[src]').dispatchEvent(new window.Event('error'));
await rejected;
assert.equal(doc.querySelectorAll('script[src]').length, 0);
const retry = window.FactoryAssets.mermaid();
window.mermaid = {};
doc.querySelector('script[src]').dispatchEvent(new window.Event('load'));
await retry;
await window.FactoryAssets.mermaid();
assert.equal(doc.querySelectorAll('script[src]').length, 1);

const failedMath = window.FactoryAssets.katex();
const failure = assert.rejects(failedMath, /katex/);
doc.querySelector('script[src*="katex"]').dispatchEvent(new window.Event('error'));
doc.querySelector('link[href*="katex"]').dispatchEvent(new window.Event('error'));
await failure;
assert.equal(doc.querySelectorAll('link[href*="katex"]').length, 0, 'Failed stylesheets can be retried');
load('assets/vendor/katex/katex.min.js');
load('math.js');
const host = doc.createElement('main'); doc.body.append(host);
host.innerHTML = '<span class="math-inline">$x^2$</span>';
window.FactoryMath.render();
assert.equal(host.firstChild.dataset.mathDone, 'fallback', 'Keep fallback until local CSS is ready');
const ready = window.FactoryAssets.katex();
doc.querySelector('link[href*="katex"]').dispatchEvent(new window.Event('load'));
await ready;
assert.equal(window.FactoryAssets.mathReady(), true);
window.FactoryMath.render();
assert.equal(host.firstChild.dataset.mathDone, 'katex');
assert.equal(host.querySelectorAll('.katex').length, 1);
window.FactoryMath.render();
assert.equal(host.querySelectorAll('.katex').length, 1, 'Upgrading fallback is idempotent');
load('data.js');
hydrate(window.FACTORY_QUEST_DATA);
let formulas = 0;
for (const material of window.FACTORY_QUEST_DATA.studyMaterials) {
  host.innerHTML = material.details;
  window.FactoryMath.render();
  formulas += host.querySelectorAll('[data-math-done="katex"]').length;
  assert.equal(host.querySelectorAll('.katex-error').length, 0, `${material.topicCode}: valid math source`);
}
assert.equal(formulas, 610, 'Every embedded formula uses the shipped local engine');

const precache = { self: {} };
vm.runInNewContext(fs.readFileSync('dist/precache.js', 'utf8'), precache);
const assets = precache.self.FACTORY_PRECACHE.assets;
for (const file of [...scripts, ...styles]) {
  assert.ok(assets.includes(file), `${file}: precache`);
}
assert.deepEqual(scripts, ['data.js', 'app-bundle.js'], 'Two classic scripts also work under file://');
assert.deepEqual(styles, ['shell-bundle.css']);
for (const file of [...shell.scripts, ...shell.styles].filter(file => !['data.js', 'offline-data.js', 'preview-data.js'].includes(file))) {
  assert.ok(bundled(file), `${file}: included in generated shell`);
  assert.ok(fs.readFileSync(`dist/${file}`, 'utf8').split('\n').length <= 300, `${file}: focused source module`);
}
const vendorPath = 'assets/vendor/katex/';
const vendor = JSON.parse(fs.readFileSync(`dist/${vendorPath}manifest.json`, 'utf8'));
assert.equal(window.katex.version, vendor.version);
for (const file of vendor.files) {
  const bytes = fs.readFileSync(`dist/${vendorPath}${file.path}`);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), file.sha256);
  if (file.path.endsWith('.woff2') || file.path.endsWith('.css')) assert.ok(assets.includes(vendorPath + file.path), `${file.path}: precache`);
}
assert.ok(!assets.includes(vendorPath + 'katex.min.js'), 'Prebuilt formulas do not require the JS renderer in the offline shell');
assert.ok(!assets.some(file => /\.(?:woff|ttf)$/.test(file)), 'Modern browsers use the precached WOFF2 fonts; legacy formats stay available on demand');
assert.deepEqual(errors, []);
dom.window.close();
console.log(`PASS: ${scripts.length} shell scripts; ${styles.length} stylesheets; local KaTeX readiness/retry; ${formulas} real formula renders; ${vendor.files.length} vendor hashes; precache coverage. DOM/static checks only.`);
