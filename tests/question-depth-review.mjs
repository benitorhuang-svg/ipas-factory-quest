import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
const require = createRequire(import.meta.url), E = require('../dist/engine.js');
const prepare = require('../scripts/prepare-exam-content.cjs');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const raw = [1, 2].flatMap(s => read(`content/questions-subject${s}.json`));
const bank = require('../scripts/question-explanations.cjs')(raw, process.cwd());
const index = read('docs/歷屆試題與解題技巧/115第一次試題教材對照索引.json');
const published = read('content/official-questions.json');
const audit = read('content/official-question-review.json');
const checks = Object.assign({}, ...index.subjects.map(s => read(`content/official-question-checks/${s.subject}.json`)));
assert.equal(Object.keys(checks).length, 200);
assert.equal(audit.reviewType, 'agent-content-review');
const originalIndex = new Map(index.subjects.flatMap(s => s.questions.map(q => [`${s.subject}-${q.question}`, q])));
const baseline = published.map(q => {
  const result = { ...q };
  delete result.sourcePage;
  result.details = result.details.replace(/\n<section class="question-check">[\s\S]*<\/section>$/, '');
  if (!originalIndex.get(q.id).note) delete result.note;
  return result;
});
const rebuilt = structuredClone(baseline);
prepare.applyReviews(rebuilt, index, process.cwd());
assert.deepEqual(rebuilt, published, 'The published checks reproduce from reviewed base explanations');
for (const q of published) {
  const row = checks[q.id], receipt = audit.questions[q.id];
  assert.equal(row[0], originalIndex.get(q.id).officialAnswer, `${q.id}: preserve original key`);
  assert.equal(digest(JSON.stringify(row)), receipt[2], `${q.id}: authored check receipt`);
  assert.equal(q.sourcePage, receipt[1]);
  const dom = new JSDOM(q.details);
  assert.equal(dom.window.document.querySelectorAll('.question-check').length, 1);
  assert.equal(dom.window.document.querySelector('.question-check p').textContent, row[2]);
  if (row[1] === 'ambiguous') assert.ok(q.note?.trim(), `${q.id}: ambiguity must be visible`);
  dom.window.close();
}
const changed = structuredClone(baseline);
changed[0].details += '<p>Changed premise</p>';
assert.throws(() => prepare.applyReviews(changed, index, process.cwd()), /Changed official explanation: L11-1/);
assert.throws(() => prepare.applyReviews(baseline.slice(1), index, process.cwd()), /coverage/);

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-official-review-'));
try {
  fs.mkdirSync(path.join(fixture, 'content'), { recursive: true });
  fs.copyFileSync('content/official-question-review.json', path.join(fixture, 'content/official-question-review.json'));
  fs.cpSync('content/official-question-checks', path.join(fixture, 'content/official-question-checks'), { recursive: true });
  for (const subject of index.subjects) {
    const target = path.join(fixture, subject.source);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(subject.source, target);
  }
  const checkFile = path.join(fixture, 'content/official-question-checks/L11.json'), rows = read(checkFile);
  rows['L11-1'][2] += '未重新審查的文字';
  fs.writeFileSync(checkFile, JSON.stringify(rows));
  assert.throws(() => prepare.applyReviews(structuredClone(baseline), index, fixture), /Changed official check: L11-1/);
  delete rows['L11-1'];
  fs.writeFileSync(checkFile, JSON.stringify(rows));
  assert.throws(() => prepare.applyReviews(structuredClone(baseline), index, fixture), /coverage/);
  fs.appendFileSync(path.join(fixture, index.subjects[0].source), '\nchanged');
  assert.throws(() => prepare.applyReviews(structuredClone(baseline), index, fixture), /Changed official PDF/);
} finally {
  assert.equal(path.dirname(path.resolve(fixture)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(fixture).startsWith('factory-official-review-'));
  fs.rmSync(fixture, { recursive: true, force: true });
}

// Independently recompute all numeric-answer items from the stated quantities.
const numeric = {
  'L111-18': 500 + 80 - 120, 'L111-19': 40 - 14, 'L111-20': 5 + 3 + 4 + 2,
  'L112-18': 5 * (2 * 3 + 1), 'L112-19': Math.max(1, 3), 'L112-20': 0.75 * 80,
  'L113-18': Math.max(0, 250 + 30 - 70 - 40), 'L113-19': 120 / 30, 'L113-20': Math.sqrt(2 * 3600 * 100 / 8),
  'L114-18': 0.8 * 1.1, 'L114-19': 2.4 * 1.25, 'L114-20': 420 / 210,
  'L115-19': 9 + 11, 'L115-20': 8 / 200 * 100,
  'L116-13': 0.9 * 0.85 * 0.98 * 100, 'L116-14': Number((0.4 * 600 / 270 * 100).toFixed(2)),
  'L122-05': 1140 / 1200 * 100, 'L122-06': (69 - 60) / 15, 'L122-10': (1000 - 80) / 1000 * 100,
  'L123-09': 180 / 200 * 100,
};
const numbers = E.catalog(bank).unique.filter(q => q.kind === 'number');
assert.deepEqual(new Set(numbers.map(q => q.id)), new Set(Object.keys(numeric)));
for (const q of numbers) {
  assert.ok(Math.abs(q.answer - numeric[q.id]) < 1e-9, `${q.id}: arithmetic`);
  assert.ok(E.correct(q, String(numeric[q.id])), `${q.id}: accepts recomputed value`);
  assert.ok(!E.correct(q, String(numeric[q.id] + 1)), `${q.id}: rejects wrong unit-scale value`);
}
const rounded = bank.find(q => q.id === 'L116-14');
assert.ok(E.correct(rounded, 88.89));
assert.ok(E.correct(rounded, 88.8888888889));
assert.ok(!E.correct(rounded, 88.88), 'The adjacent rounded answer is not accepted');
assert.ok(!E.correct(rounded, 88.90));
assert.ok(E.correct(E.questionFor(rounded, { questionRevision: E.legacyRevision }), 88.88), 'Historical tolerance remains unchanged');
const sourceReview = read('content/exam-analysis-review.json');
for (const q of E.catalog(bank).unique) {
  const receipt = sourceReview.questions.find(row => row.id === q.id);
  assert.equal(receipt.questionFingerprint, digest(E.fingerprint(q)));
  assert.equal(receipt.analysisFingerprint, digest(JSON.stringify(q.analysis)));
}
assert.equal(sourceReview.questions.filter(q => q.followup).length, 8);
const byId = new Map(bank.map(q => [q.id, q]));
assert.match(byId.get('L113-B11').stem, /年度耗用金額/);
assert.doesNotMatch(byId.get('L113-B23').options.join(''), /帳料不符/);
assert.match(byId.get('L113-B15').options[2], /應保留庫存/);
assert.match(byId.get('L124-B13').options[2], /非方案變因/);
assert.doesNotMatch(byId.get('L125-B02').options[1], /SLAM.*避障/);
for (const id of ['L122-04', 'L122-B27']) {
  assert.match(byId.get(id).analysis.check[0], /不同時區.*不要求.*同一同步協定/);
  assert.match(byId.get(id).analysis.check[0], /不能斷言先後/);
}
// Check the official numerical discrepancies rather than forcing the printed key.
assert.equal((80 * 2 + (60 - 25) * 5) - 160, 175);
assert.ok(Math.abs((445 + 90) / (7 * 90) * 100 - 84.9206349) < 1e-6);
assert.equal(500 * 0.9 * 100 / 60 / (3 * 410 - 30) * 100, 62.5);
assert.notEqual(Math.round(500 * 0.9 * 100 / 60 / (3 * 410 - 30) * 100), 67);
assert.equal(410 * 60 * 2 * 5 * 5 * 0.9 / 150, 7380);
assert.equal(Math.ceil(1000 * 500 / (410 * 60 * 2 * 5 * 0.9)), 3);
assert.ok(Math.abs(200 * 8 / (0.9 * 0.9) + 200 * 0.01 * 5 - 1985.3086419753) < 1e-6);
assert.equal(Math.ceil(72 / (480 / 50)), 8);
assert.equal(checks['L21-28'][1], 'ambiguous');
assert.match(checks['L21-28'][2], /60.98%.*62.5%.*67%/);
console.log('PASS: 616 current review receipts; all 20 numeric answers recomputed; official source/check drift guards, ambiguity notes and historical tolerance verified.');
