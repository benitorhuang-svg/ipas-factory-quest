import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { hydrate } from './helpers/materials.mjs';

const errors = [];
const diagnostics = new VirtualConsole();
diagnostics.on('jsdomError', error => errors.push(error.message));
const dom = new JSDOM('<!doctype html><head></head><body><div id="app"></div></body>', {
  runScripts: 'dangerously', url: 'https://localhost/#/home', virtualConsole: diagnostics,
});
const { window } = dom;
const doc = window.document;
window.scrollTo = ({ top }) => { window.scrollY = top; };
window.HTMLElement.prototype.scrollIntoView = () => {};
// Model the native dialog contract; these assertions do not prove browser layout.
window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new window.Event('close')); };
const index = fs.readFileSync('dist/index.html', 'utf8');
for (const [, file] of index.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) {
  if (file === 'diagrams.js') continue;
  if (file === 'app.js') {
    window.FactoryAssets = { mermaid: async () => {}, katex: async () => {} };
    window.FactoryDiagrams = { render: async () => {} };
  }
  const script = doc.createElement('script');
  script.textContent = fs.readFileSync(`dist/${file}`, 'utf8');
  doc.body.append(script);
  if (file === 'data.js') hydrate(window.FACTORY_QUEST_DATA);
}
const key = 'factory-quest-ipas-v1';
const state = () => JSON.parse(window.localStorage.getItem(key));
const data = window.FACTORY_QUEST_DATA;
const qmap = new Map(data.questions.map(q => [q.id, q]));
async function waitFor(predicate) {
  const deadline = Date.now() + 5000;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, `UI timed out at ${window.location.hash}`);
    await new Promise(resolve => window.setTimeout(resolve, 5));
  }
}
async function go(route) {
  window.history.replaceState(null, '', `#/${route}`);
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
}
async function clickRoute(selector, predicate) {
  doc.querySelector(selector).click();
  await waitFor(predicate);
}
function answer(question, value) {
  const input = question.kind === 'choice'
    ? doc.querySelector(`[data-answer="${question.id}"][value="${value}"]`)
    : doc.querySelector(`[data-answer="${question.id}"]`);
  if (question.kind === 'choice') input.checked = true;
  else input.value = String(value);
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}
async function submit() {
  doc.querySelector('#quiz-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await waitFor(() => !!doc.querySelector('.result-toolbar'));
}

assert.equal(doc.querySelectorAll('.dashboard-next .btn-primary').length, 1);
assert.equal(doc.querySelectorAll('.dashboard-unit').length, 12);
const subject = doc.querySelector('[data-action="filter"][data-filter="2"]');
subject.focus(); subject.click();
assert.equal(doc.querySelectorAll('.dashboard-unit').length, 6);
assert.equal(doc.activeElement.dataset.filter, '2', 'filtering keeps keyboard focus');
await go('guide/materials');
doc.getElementById('library-search').value = 'M12103';
doc.getElementById('library-search').dispatchEvent(new window.Event('input', { bubbles: true }));
doc.getElementById('library-group').value = 'subject2';
doc.getElementById('library-group').dispatchEvent(new window.Event('change', { bubbles: true }));
window.scrollY = 320;
await clickRoute('.library-entry:not([hidden])', () => !!doc.querySelector('.reader-article'));
assert.equal(window.scrollY, 0);
await clickRoute('.reader-back', () => !!doc.querySelector('.guide-library'));
assert.equal(doc.getElementById('library-search').value, 'M12103');
assert.equal(doc.getElementById('library-group').value, 'subject2');
assert.equal(doc.querySelectorAll('.library-entry:not([hidden])').length, 1);
assert.equal(window.scrollY, 320, 'returning to the library restores its position');

await go('atlas');
assert.ok(doc.querySelector('.atlas-content > .atlas-unit-grid'));
assert.equal(doc.querySelector('.atlas-overview-collection').open, false);
assert.equal(doc.querySelectorAll('.atlas-content [data-action] [data-action]').length, 0);
const preview = doc.querySelector('.atlas-unit-previews button');
preview.focus(); preview.click();
assert.ok(doc.querySelector('dialog[open]'));
assert.ok(doc.getElementById(doc.querySelector('dialog').getAttribute('aria-labelledby')));
const failedImage = doc.querySelector('dialog img');
failedImage.dispatchEvent(new window.Event('error'));
assert.equal(failedImage.hidden, true);
assert.ok(doc.querySelector('dialog .media-unavailable'));
doc.querySelector('dialog [data-action="retry-media"]').click();
assert.equal(failedImage.hidden, false);
assert.equal(doc.querySelector('dialog .media-unavailable'), null);
doc.querySelector('dialog [data-action="close"]').click();
assert.equal(doc.querySelector('dialog'), null);
assert.equal(doc.activeElement, preview, 'closing restores the triggering control');
doc.querySelector('.atlas-interactive').focus();
doc.querySelector('.atlas-interactive').click();
assert.ok(doc.querySelector('dialog iframe[title]'));
doc.querySelector('dialog').close();
assert.equal(doc.activeElement, doc.querySelector('.atlas-interactive'));

await go('unit/L111');
assert.equal(doc.querySelectorAll('.unit-practice-actions .btn-primary').length, 1);
await clickRoute('[data-action="start"][data-mode="mission"]', () => !!doc.querySelector('#quiz-form'));
assert.equal(state().active.questionIds.length, 10);
assert.equal(doc.querySelector('.quiz-map').open, false);
doc.querySelector('[data-action="quiz-helper"]').click();
assert.ok(doc.querySelector('dialog[open]'));
await clickRoute('dialog [data-action="guide-tab"]', () => !!doc.querySelector('.reader-article'));
assert.equal(doc.querySelector('dialog'), null);
assert.ok(state().active);
await go('home');
assert.ok(doc.querySelector('.dashboard-next [data-action="resume"]'));
await clickRoute('[data-action="resume"]', () => !!doc.querySelector('#quiz-form'));
const run = state().active;
for (const [i, id] of run.questionIds.entries()) {
  const question = qmap.get(id);
  const value = i ? question.answer : question.kind === 'choice' ? (question.answer + 1) % 4 : question.answer + 1000000;
  answer(question, value);
}
assert.equal(doc.getElementById('answered-count').textContent, '10');
assert.equal(doc.getElementById('submit-run').disabled, false);
assert.ok(doc.querySelector('.question-dot').getAttribute('aria-label').includes('已作答'));
doc.querySelector('.quiz-map').open = true;
doc.querySelector('.question-dot').click();
assert.equal(doc.activeElement.id, `question-title-${run.questionIds[0]}`);
await submit();
assert.equal(state().active, null);
assert.equal(state().history.at(-1).score, 90);
const wrongFilter = doc.getElementById('result-only-wrong');
wrongFilter.checked = true;
wrongFilter.dispatchEvent(new window.Event('change', { bubbles: true }));
assert.equal(doc.querySelectorAll('.feedback-card:not([hidden])').length, 1);
assert.equal(doc.getElementById('result-count').textContent, '顯示 1 題解析');
await go('repair');
assert.equal(doc.querySelectorAll('.review-group').length, 1);
await clickRoute('[data-action="review"]', () => !!doc.querySelector('#quiz-form'));
assert.equal(state().active.questionIds.length, 1);
const wrongQuestion = qmap.get(state().active.questionIds[0]);
answer(wrongQuestion, wrongQuestion.answer);
await submit();
assert.equal(window.FactoryEngine.wrongIds(state()).length, 0);

for (const subjectCode of [1, 2]) {
  await go('exam');
  await clickRoute(`[data-action="start"][data-subject="${subjectCode}"]`, () => !!doc.querySelector('#clock'));
  assert.equal(state().active.questionIds.length, 50);
  const elapsed = state();
  elapsed.active.startedAt = Date.now() - 76 * 60 * 1000;
  window.localStorage.setItem(key, JSON.stringify(elapsed));
  window.dispatchEvent(new window.StorageEvent('storage', { key, newValue: JSON.stringify(elapsed) }));
  await waitFor(() => !!doc.querySelector('.result-toolbar'));
  assert.equal(state().active, null);
  assert.equal(state().history.at(-1).mode, 'exam');
  assert.equal(state().history.at(-1).subject, subjectCode);
}
await go('progress');
const saved = window.localStorage.getItem(key);
doc.querySelector('.danger-area').open = true;
const reset = doc.querySelector('[data-action="reset"]');
reset.focus(); reset.click();
assert.ok(doc.querySelector('dialog'));
assert.equal(doc.activeElement.dataset.action, 'close', 'destructive action is not the initial focus');
doc.querySelector('dialog [data-action="close"]').click();
assert.equal(window.localStorage.getItem(key), saved, 'cancel keeps all progress');
assert.equal(doc.activeElement, reset);
assert.deepEqual(errors, []);
dom.window.close();
console.log('PASS: catalog state/scroll; single-action cards; dialog labels/focus; mission -> report -> repair; both timed mocks; cancelled reset. DOM behavior only.');
