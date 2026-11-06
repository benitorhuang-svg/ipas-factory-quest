import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
const require = createRequire(import.meta.url), E = require('../dist/engine.js');
const X = require('../dist/explanations.js');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const raw = [1, 2].flatMap(id => read(`content/questions-subject${id}.json`));
const bank = require('../scripts/question-explanations.cjs')(raw, process.cwd());
const unique = E.catalog(bank).unique, audit = read('content/exam-analysis-review.json');
const digest = value => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
assert.equal(audit.reviewType, 'agent-content-review');
assert.equal(audit.questions.length, 416);
assert.equal(new Set(audit.questions.map(q => q.id)).size, 416);
assert.equal(audit.questions.filter(q => q.examEligible).length, 396);
for (const q of unique) {
  const receipt = audit.questions.find(row => row.id === q.id);
  assert.ok(receipt, `${q.id}: missing review`);
  assert.equal(receipt.questionFingerprint, digest(E.fingerprint(q)), `${q.id}: changed question requires another content review`);
  assert.equal(receipt.analysisFingerprint, digest(q.analysis), `${q.id}: changed analysis requires another content review`);
  assert.equal(receipt.examEligible, q.kind === 'choice');
  assert.doesNotMatch(q.explanation, /其他選項均為|與題意核心概念不符|【避坑提醒】/);
  assert.deepEqual(X.parse(q.explanation).steps, q.analysis.steps, `${q.id}: raw/file fallback has the reviewed solution`);
  assert.equal(new Set(q.analysis.steps).size, q.analysis.steps.length);
}
// A stale truncated hint must not be resurrected as an explanation section.
const dom = new JSDOM('<!doctype html><body></body>'), doc = dom.window.document;
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ctx = { esc, icon: () => '' }, qmap = new Map(bank.map(q => [q.id, q]));
const isa = qmap.get('L121-B10');
doc.body.innerHTML = X.render(ctx, { ...isa, hint: '這是被截斷的舊提示。' }, { answer: 1, order: [2, 1, 3, 0] });
assert.doesNotMatch(doc.body.textContent, /截斷|OPC UA|MQTT/);
assert.match(doc.querySelector('.expl-solution').textContent, /500 件/);
assert.match(doc.querySelector('.expl-solution').textContent, /MES（製造執行系統）/);
assert.match(doc.querySelector('.is-selected strong').textContent, /B. Level 4/);
assert.match(doc.querySelector('.is-selected p').textContent, /企業規劃與物流/);
assert.equal(doc.querySelectorAll('.expl-option').length, 3);
assert.equal(doc.querySelector('.expl-sources a').hostname, 'www.isa.org');
assert.match(qmap.get('L114-B16').stem, /可透過改善排程而消除/);
assert.match(qmap.get('L114-B16').analysis.options[3], /必要的非增值/);
assert.match(qmap.get('L111-B04').stem, /單機.*同時.*不計換線/);
assert.match(qmap.get('L111-B26').stem, /maximum lateness/);
assert.match(qmap.get('L113-B22').analysis.steps.join(''), /毛需求 100 件、可用供給 100 件.*20 件淨需求/);
assert.doesNotMatch(JSON.stringify(qmap.get('L121-B01').analysis), /Level 1 PLC/);
assert.match(qmap.get('L123-B22').stem, /以「不良品」為正類/);
assert.doesNotMatch(qmap.get('L124-B02').analysis.steps.join(''), /雙生才具備/);
assert.match(qmap.get('L125-B03').analysis.steps.join(''), /TCP.*法蘭/);
assert.match(qmap.get('L126-B02').analysis.steps.join(''), /非接觸.*不是 RFID 獨有/);

let upgraded = 0;
for (const q of bank.filter(q => q.legacy.analysis)) {
  const legacy = E.questionFor(q, { questionRevision: E.legacyRevision });
  if (legacy.kind !== 'choice') continue;
  upgraded++;
  for (let index = 0; index < legacy.options.length; index++) {
    const currentIndex = q.options.indexOf(legacy.options[index]);
    assert.equal(legacy.analysis.options[index], q.analysis.options[currentIndex], `${q.id}: historical option reason follows meaning, not index`);
  }
  const wrong = (legacy.answer + 1) % 4;
  doc.body.innerHTML = X.render(ctx, legacy, { answer: wrong });
  assert.equal(doc.querySelector('.is-selected').dataset.optionIndex, String(wrong));
  assert.equal(doc.querySelector('.is-selected p').textContent, legacy.analysis.options[wrong]);
}
assert.ok(upgraded > 300, 'Unchanged historical choices also receive correctly remapped explanations');
doc.body.innerHTML = X.render(ctx, { ...isa, analysis: { ...isa.analysis, references: [{ title: 'unsafe', url: 'javascript:alert(1)' }] } });
assert.equal(doc.querySelectorAll('a').length, 0, 'Invalid reference schemes never become active links');
dom.window.close();
console.log(`PASS: all 416 reviewed question/analysis receipts, 396 exam choices, focused precision regressions and ${upgraded} historical option mappings. Content receipts detect drift; they do not certify subject-expert accuracy.`);
