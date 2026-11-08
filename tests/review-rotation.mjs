import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), E = require('../dist/engine.js');
const bank = [1, 2].flatMap(id => JSON.parse(fs.readFileSync(`content/questions-subject${id}.json`, 'utf8')));
const DAY = 86400000, now = 20 * DAY;
const entry = (correct, count = 1, dueAt = now - DAY) => ({ attempts: count, correctCount: correct ? count : 0, lastCorrect: correct, lastSeen: now - 4 * DAY, dueAt });
const target = bank.find(q => q.id === 'L111-01');
const correctState = { ...E.emptyState(), earnedCorrectIds: [target.id], ledger: { [target.id]: entry(true) } };
assert.deepEqual(E.reviewIds(correctState, bank, now + 100 * DAY), [], 'Old correct reminders never become review tasks');
assert.deepEqual(E.select(bank, { mode: 'review', state: correctState }), []);
const state = { ...correctState, ledger: { ...correctState.ledger, 'L111-02': entry(false, 1, now + DAY) } };
assert.deepEqual(E.reviewIds(state, bank), ['L111-02'], 'Only mistakes enter review, including newly wrong answers');
assert.deepEqual(E.reviewPlan(state, bank).questions.map(q => q.id), ['L111-02'], 'Retry the actual wrong question');
const question = bank.find(q => q.id === 'L111-02');
const run = { id: 'retry', mode: 'review', questionIds: [question.id], answers: { [question.id]: question.answer }, startedAt: now };
const restored = E.restore({ ...state, active: run }, bank);
assert.deepEqual(restored.active.questionIds, run.questionIds, 'Reload and backup preserve drafts');
const graded = E.grade(restored, restored.active, bank, now);
assert.deepEqual(E.reviewIds(graded.state, bank, now + 100 * DAY), []);
assert.equal(graded.state.ledger[question.id].dueAt, 0);
assert.equal(graded.state.ledger[target.id].attempts, 1, 'Grading never changes unrelated questions');
assert.equal(graded.report.earnedXP, 10);
assert.equal(E.grade(graded.state, restored.active, bank, now).state, graded.state, 'Duplicate submission is idempotent');
assert.deepEqual(E.reviewIds(E.restore(JSON.parse(JSON.stringify(graded.state)), bank), bank), []);
const failed = E.grade(state, { ...run, id: 'failed', answers: {} }, bank, now).state;
assert.deepEqual(E.reviewIds(failed, bank), [question.id], 'A repeated mistake stays in review');
const regressed = E.grade(graded.state, { ...run, id: 'regressed', mode: 'quick', answers: {} }, bank, now + DAY).state;
assert.deepEqual(E.reviewIds(regressed, bank), [question.id], 'A later mistake reopens a mastered question');

// Legacy replacement metadata must not reschedule questions, while the draft survives.
const legacyRun = { ...run, reviewTargets: { [question.id]: target.id } };
assert.deepEqual(E.restore({ ...state, active: legacyRun }, bank).active.questionIds, run.questionIds);
assert.deepEqual(E.grade(state, legacyRun, bank, now).state.ledger[target.id], state.ledger[target.id]);

let value = 42;
const random = () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
const synthetic = Array.from({ length: 60 }, (_, i) => ({ ...target, id: `test-${i}`, stem: `Unique practice ${i}`, skill: 'concept' }));
const weighted = { ...E.emptyState(), ledger: Object.fromEntries(synthetic.map((q, i) => [q.id, entry(true, i < 30 ? 1 : 9)])) };
let lowCorrect = 0, highCorrect = 0;
for (let i = 0; i < 500; i++) {
  const selected = E.select(synthetic, { mode: 'quick', unitId: target.unit, state: weighted }, random);
  assert.equal(new Set(selected.map(E.fingerprint)).size, 5);
  for (const q of selected) if (Number(q.id.slice(5)) < 30) lowCorrect++; else highCorrect++;
}
assert.ok(lowCorrect > highCorrect * 10, `Correct-answer frequency reduces practice weight: ${lowCorrect} vs ${highCorrect}`);
const wrongWeighted = { ...weighted, ledger: Object.fromEntries(synthetic.map((q, i) => [q.id, { ...entry(true, 9), lastCorrect: i >= 30 }])) };
let mistakes = 0;
for (let i = 0; i < 100; i++) mistakes += E.select(synthetic, { mode: 'quick', unitId: target.unit, state: wrongWeighted }, random).filter(q => Number(q.id.slice(5)) < 30).length;
assert.ok(mistakes > 450, 'A later mistake restores full weight despite earlier correct answers');

// Practice must reach every unique question across all units in both modes.
for (const mode of ['quick', 'mission']) for (const unitId of E.UNITS) {
  let progress = E.emptyState();
  const pool = E.catalog(bank).unique.filter(q => q.unit === unitId), seen = new Set();
  for (let round = 0; round < pool.length && seen.size < pool.length; round++) {
    const selected = E.select(bank, { mode, unitId, state: progress }, random);
    for (const q of selected) seen.add(q.id);
    progress = E.grade(progress, { id: `${mode}-${unitId}-${round}`, mode, unitId, questionIds: selected.map(q => q.id), answers: Object.fromEntries(selected.map(q => [q.id, q.answer])) }, bank, now + round).state;
    progress = E.restore(JSON.parse(JSON.stringify(progress)), bank);
  }
  assert.equal(seen.size, pool.length, `${mode}/${unitId}: cover every question after grading and reload`);
}
const unseen = synthetic.slice(0, 5), practiced = synthetic.slice(5);
const withHistory = { ...E.emptyState(), ledger: Object.fromEntries(practiced.map(q => [q.id, entry(false)])) };
assert.deepEqual(new Set(E.select(synthetic, { mode: 'quick', unitId: target.unit, state: withHistory }, random).map(q => q.id)), new Set(unseen.map(q => q.id)), 'Unseen questions take priority within each skill');
const manyWrong = { ...E.emptyState(), ledger: Object.fromEntries(synthetic.map((q, i) => [q.id, { ...entry(false), lastSeen: i }])) };
assert.deepEqual(E.reviewPlan(manyWrong, synthetic).questions.map(q => q.id), synthetic.slice(0, 10).map(q => q.id), 'Review batches retry the oldest ten mistakes');
console.log(`PASS: wrong-only review, legacy drafts, XP/reload, ${lowCorrect}:${highCorrect} weighted draws, mistake priority, and complete coverage of all 416 questions in both practice modes.`);
