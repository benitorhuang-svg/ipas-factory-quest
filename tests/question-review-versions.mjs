import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), E = require('../dist/engine.js');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const source = [1, 2].flatMap(s => read(`content/questions-subject${s}.json`));
const bank = require('../scripts/question-explanations.cjs')(source, process.cwd());
const previous = read('content/question-revisions.json');
assert.equal(previous.revision, E.previousRevision);
assert.equal(Object.keys(previous.questions).length, 15);
assert.ok(previous.questions['L114-08'], 'Standard-time diagram retains the previous text-only analysis');
for (const id of ['L111-01', 'L111-11', 'L111-19']) assert.ok(previous.questions[id], `${id}: diagram retains the previous text-only analysis`);
assert.ok(previous.questions['L111-B27'], 'CR diagram retains the previous text-only analysis');
assert.ok(previous.questions['L111-B26'], 'Gantt explanation retains the previous text-only analysis');
assert.ok(previous.questions['L125-B05'], 'Changed aliases also need historical snapshots');
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(digest(bank.map(q => {
  const original = { ...E.questionFor(q, { questionRevision: E.previousRevision }) };
  delete original.legacy; delete original.versions;
  return [q.id, digest(original)];
})), previous.bankFingerprint, 'Every previous source record matches the captured pre-edit bank');
for (const q of bank) {
  const old = previous.questions[q.id]?.question || q;
  const state = E.restore({ ...E.emptyState(), questionRevision: E.previousRevision,
    earnedCorrectIds: [q.id],
    active: { id: `previous-${q.id}`, mode: 'quick', unitId: q.unit, startedAt: Date.now(), questionIds: [q.id], answers: { [q.id]: old.answer } },
    history: [{ runId: `report-${q.id}`, mode: 'quick', unitId: q.unit, results: [{ id: q.id, answer: old.answer }] }],
  }, bank);
  assert.equal(state.questionRevision, E.questionRevision);
  assert.equal(state.active.questionRevision, E.previousRevision, `${q.id}: inherit previous state revision`);
  assert.equal(state.history[0].questionRevision, E.previousRevision);
  assert.equal(state.history[0].score, 100);
  assert.deepEqual(E.questionFor(q, state.active), old, `${q.id}: preserve previous question and analysis`);
  const graded = E.grade(state, state.active, bank);
  assert.equal(graded.report.score, 100);
  assert.equal(graded.report.questionRevision, E.previousRevision);
  assert.equal(graded.report.earnedXP, 0, `${q.id}: existing earned identity is not awarded twice`);
  assert.deepEqual(E.restore(JSON.parse(JSON.stringify(state)), bank), state, `${q.id}: idempotent restore`);
}
const q = bank.find(q => q.id === 'L116-14');
const restored = E.restore({ ...E.emptyState(), questionRevision: E.previousRevision,
  active: { id: 'rounding-draft', questionRevision: E.previousRevision, mode: 'quick', unitId: q.unit, startedAt: Date.now(), questionIds: [q.id], answers: { [q.id]: '88.88' } },
  history: [{ runId: 'rounding-report', questionRevision: E.previousRevision, mode: 'quick', results: [{ id: q.id, answer: '88.88' }] }],
}, bank);
assert.equal(restored.history[0].score, 100, 'Previously accepted tolerance remains accepted in previous reports');
assert.equal(E.grade(restored, restored.active, bank).report.score, 100);
assert.equal(E.grade(E.emptyState(), { ...restored.active, id: 'current-rounding', questionRevision: E.questionRevision }, bank).report.score, 0, 'Fresh runs apply reviewed rounding precision');
const mixed = E.restore({ ...restored, history: [...restored.history, { runId: 'legacy-mixed', questionRevision: E.legacyRevision, mode: 'quick', results: [{ id: 'L111-02', answer: 0 }] }] }, bank);
assert.equal(mixed.history[0].questionRevision, E.previousRevision);
assert.equal(mixed.history[1].questionRevision, E.legacyRevision);
assert.equal(mixed.history[1].score, 100);
console.log('PASS: all 476 pre-edit question digests, previous-revision drafts/reports, fifteen snapshots including aliases, mixed revisions, grading, tolerance and XP retain their original meaning.');
