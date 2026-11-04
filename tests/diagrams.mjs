import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { hydrate } from './helpers/materials.mjs';

const diagnostics = [];
const console = new VirtualConsole();
console.on('jsdomError', error => diagnostics.push(error.message));
const dom = new JSDOM('<!doctype html><body><main id="app"></main></body>', {
  runScripts: 'dangerously', url: 'https://localhost/', virtualConsole: console,
});
const { window } = dom;
// jsdom has no native dialog implementation. Model its open/close contract
// solely to check that the application moves and restores the graphic.
window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new window.Event('close')); };
function load(file) {
  const script = window.document.createElement('script');
  script.textContent = fs.readFileSync(file, 'utf8'); window.document.body.append(script);
}
load('dist/assets/mermaid.min.js'); load('dist/data.js'); load('dist/diagrams.js');
hydrate(window.FACTORY_QUEST_DATA);
assert.ok(window.mermaid?.parse, 'Bundled Mermaid API must load as a classic script');
const host = window.document.querySelector('main');
let charts = 0;
for (const material of window.FACTORY_QUEST_DATA.studyMaterials) {
  host.innerHTML = material.details;
  for (const block of host.querySelectorAll('.mermaid')) {
    charts++;
    await assert.doesNotReject(() => window.mermaid.parse(window.FactoryDiagrams.readSource(block)), material.topicCode);
  }
}
assert.equal(charts, 60);

// Use real parsing above. Test the host lifecycle separately because jsdom does
// not implement browser text/SVG layout and cannot establish visual fidelity.
let active = 0, peak = 0, calls = 0;
window.mermaid.render = async () => {
  calls++; active++; peak = Math.max(peak, active);
  await new Promise(resolve => setTimeout(resolve, 5)); active--;
  return { svg: '<svg viewBox="0 0 840 360"><text>良品與瑕疵判定</text></svg>' };
};
host.innerHTML = '<div class="mermaid-block"><pre class="mermaid">flowchart LR\n A --> B</pre></div>';
await Promise.all([window.FactoryDiagrams.render(host), window.FactoryDiagrams.render(host)]);
assert.equal(calls, 1, 'Concurrent jobs must not render the same block twice');
assert.equal(peak, 1, 'Mermaid parser must stay serialized');
assert.equal(host.querySelectorAll('.study-diagram svg').length, 1);
assert.equal(host.querySelector('.mermaid'), null);
assert.equal(host.querySelector('svg').style.width, '840px');
assert.equal(host.querySelectorAll('.diagram-toolbar button').length, 1);
host.querySelector('.diagram-toolbar button').click();
assert.ok(window.document.querySelector('dialog[open]'));
assert.equal(host.querySelector('svg'), null, 'Expanded SVG must move to the dialog without duplicate IDs');
window.document.querySelector('dialog button').click();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(window.document.querySelector('dialog'), null);
assert.ok(host.querySelector('svg'), 'Closing must restore the same SVG');
window.mermaid.render = async () => { throw new Error('Intentional failure'); };
host.innerHTML = '<pre class="mermaid">invalid source</pre>';
await window.FactoryDiagrams.render(host);
assert.ok(host.querySelector('details.diagram-error:not([open])'), 'Failure should show a collapsed source with a readable message');
assert.equal(host.querySelector('pre').textContent, 'invalid source');
assert.deepEqual(diagnostics, []);
dom.window.close();
globalThis.console.log(`PASS: ${charts} diagrams parsed with shipped Mermaid; serialized rendering, scroll frame and failure state. Visual browser layout remains unverified.`);
