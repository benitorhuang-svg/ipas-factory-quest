import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { shell } from './helpers/shell.mjs';
import { htmlFields } from '../scripts/material-payloads.mjs';

const read = file => fs.readFileSync(file, 'utf8');
const chapters = JSON.parse(read('content/study-materials.json'));
const raw = chapters;
const questions = new Map(JSON.parse(read('content/official-questions.json')).map(question => [question.id, question]));
const notes = new Map(JSON.parse(read('content/official-exam-notes.json')).map(note => [note.id, note]));
const manifest = JSON.parse(read('dist/assets/diagrams/manifest.json'));
let diagrams = 0, formulas = 0;
const ids = new Set();
for (const material of raw) {
  const payload = JSON.parse(read(`dist/materials/${material.topicCode}.json`));
  const sources = [material.details, ...Object.keys(payload.questions).map(id => questions.get(id).details), ...Object.keys(payload.notes).map(id => notes.get(id).html)];
  const sourceDOM = new JSDOM(sources.join('\n'));
  const builtDOM = new JSDOM(htmlFields(payload).map(({ owner, key }) => owner[key]).join('\n'));
  const originals = [...sourceDOM.window.document.querySelectorAll('.mermaid')];
  const built = [...builtDOM.window.document.querySelectorAll('.mermaid')];
  assert.equal(built.length, originals.length, `${material.topicCode}: preserve all original Mermaid sources`);
  for (const [index, block] of built.entries()) {
    assert.equal(block.textContent, originals[index].textContent);
    const file = block.dataset.diagramSrc;
    assert.match(file, /^assets\/diagrams\/[a-f0-9]{16}\.svg$/);
    const key = file.split('/').pop().replace('.svg', '');
    const svg = fs.readFileSync(`dist/${file}`);
    assert.equal(crypto.createHash('sha256').update(svg).digest('hex'), manifest.entries[key].sha256);
    assert.equal(svg.length, manifest.entries[key].bytes);
    const graphic = new JSDOM(svg.toString(), { contentType: 'image/svg+xml' });
    const document = graphic.window.document;
    assert.equal(document.documentElement.getAttribute('data-prebuilt-diagram'), 'true');
    const nodes = [...document.querySelectorAll('[id]')];
    const local = new Set(nodes.map(node => node.id));
    assert.equal(local.size, nodes.length, `${file}: unique SVG IDs`);
    assert.ok(nodes.every(node => node.id.startsWith('FQ_DIAGRAM_INSTANCE-')));
    // Mermaid also emits unused theme CSS for other looks; check references on
    // actual SVG elements rather than inactive stylesheet selectors.
    for (const node of document.querySelectorAll('*')) {
      for (const attribute of node.attributes) for (const match of attribute.value.matchAll(/url\(#([^)'"\s]+)\)/g)) assert.ok(local.has(match[1]), `${file}: marker reference ${match[1]}`);
    }
    graphic.window.close(); ids.add(key); diagrams++;
  }
  const originalMath = [...sourceDOM.window.document.querySelectorAll('.math-block, .math-inline')];
  const builtMath = [...builtDOM.window.document.querySelectorAll('.math-block, .math-inline')];
  assert.equal(builtMath.length, originalMath.length);
  for (const [index, block] of builtMath.entries()) {
    assert.equal(block.getAttribute('data-raw-math'), originalMath[index].textContent.trim());
    assert.equal(block.getAttribute('data-math-done'), 'katex');
    assert.ok(block.querySelector('math') && block.querySelector('.katex-html'), 'Accessible MathML and visual HTML are both present');
    assert.equal(block.querySelector('.katex-error'), null);
    formulas++;
  }
  sourceDOM.window.close(); builtDOM.window.close();
}
assert.equal(diagrams, 60); assert.ok(formulas > 0);
assert.equal(Object.keys(manifest.entries).length, ids.size);
const precache = { self: {} };
vm.runInNewContext(read('dist/precache.js'), precache);
const assets = precache.self.FACTORY_PRECACHE.assets;
for (const material of raw) assert.ok(assets.includes(`materials/${material.topicCode}.json`));
const offline = { window: {} };
vm.runInNewContext(read('dist/offline-data.js'), offline);
for (const chapter of offline.window.FactoryOfflineChapters) {
  const document = new JSDOM(JSON.parse(read(`dist/materials/${chapter.topicCode}.json`)).details);
  for (const block of document.window.document.querySelectorAll('[data-diagram-src]')) assert.ok(chapter.assets.some(asset => asset.file === block.dataset.diagramSrc));
  assert.ok(!chapter.assets.some(asset => asset.file.includes('mermaid.min.js')), 'Static chapters do not require the multi-megabyte renderer offline');
  document.window.close();
}
for (const [kind, bundle] of [['scripts', 'app-bundle.js'], ['styles', 'shell-bundle.css']]) {
  const names = shell[kind].filter(name => name !== 'data.js');
  const source = read(`dist/${bundle}`);
  let previous = -1;
  for (const name of names) {
    const marker = source.indexOf(`/* Source: ${name} */`);
    assert.ok(marker > previous, `${name}: source/cascade order`); previous = marker;
    assert.ok(source.includes(read(`dist/${name}`).trim()), `${name}: bundle must contain the current source, not a stale build`);
  }
}
console.log(`PASS: ${diagrams} source-preserving SVGs, unique marker references, ${formulas} HTML/MathML formulas, chapter inventories and up-to-date shell bundles.`);
