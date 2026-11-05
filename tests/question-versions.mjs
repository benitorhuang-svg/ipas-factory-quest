import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), E = require('../dist/engine.js');
const source = [1, 2].flatMap(id => JSON.parse(fs.readFileSync(`content/questions-subject${id}.json`, 'utf8')));
const bank = require('../scripts/question-explanations.cjs')(source, process.cwd());
const old = JSON.parse(fs.readFileSync('content/question-legacy.json', 'utf8'));
assert.equal(old.commit, '12f5f409c8c28de64a1e2a19c1466d51c39819dc');
assert.equal(Object.keys(old.questions).length, 476);
const originalState = { ...E.emptyState(), earnedCorrectIds: ['L111-02'], best: { L111: 90 }, passedUnits: ['L111'] };
delete originalState.questionRevision;
for (const q of bank) {
  const original = old.questions[q.id];
  const raw = { ...originalState, active: {
    id: 'old-draft', mode: 'quick', unitId: q.unit, startedAt: Date.now(), questionIds: [q.id], answers: { [q.id]: original.answer },
  }, history: [{ runId: 'old-report', mode: 'quick', unitId: q.unit, results: [{ id: q.id, answer: original.answer, correct: true }] }] };
  const restored = E.restore(raw, bank);
  assert.equal(restored.questionRevision, E.questionRevision);
  assert.equal(restored.active.questionRevision, E.legacyRevision);
  assert.equal(restored.history[0].score, 100, `${q.id}: old correct answers keep their meaning`);
  assert.equal(restored.active.answers[q.id], original.answer, `${q.id}: draft answers retained exactly`);
  assert.deepEqual(E.questionFor(q, restored.active), original, `${q.id}: original question, not changed option order`);
  const graded = E.grade(restored, restored.active, bank);
  assert.equal(graded.report.score, 100, `${q.id}: old draft grades against original question`);
  assert.deepEqual(E.restore(JSON.parse(JSON.stringify(restored)), bank), restored, 'Revision migration is idempotent');
  assert.equal(restored.xp, 60, 'Earned XP and badge are retained');
  const fresh = E.restore({ ...E.emptyState(), active: {
    ...raw.active, answers: { [q.id]: q.answer },
  }, history: [{ ...raw.history[0], results: [{ id: q.id, answer: q.answer }] }] }, bank);
  assert.equal(fresh.active.questionRevision, E.questionRevision);
  assert.equal(E.questionFor(q, fresh.active), q);
  assert.equal(fresh.history[0].score, 100);
}
console.log('PASS: all 476 published question snapshots preserve old answers, reports, drafts, grading, XP and idempotent restore; new runs use current questions.');
