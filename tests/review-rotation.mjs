import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), E = require('../dist/engine.js');
const bank = [1, 2].flatMap(id => JSON.parse(fs.readFileSync(`content/questions-subject${id}.json`, 'utf8')));
const DAY = 86400000, now = 20 * DAY;
const entry = (correct, count = 1, dueAt = now - DAY) => ({ attempts: count, correctCount: correct ? count : 0, lastCorrect: correct, lastSeen: now - 4 * DAY, dueAt });
const target = bank.find(q => q.id === 'L111-01');
let state = { ...E.emptyState(), ledger: { [target.id]: entry(true) } };
let value = 42;
const random = () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
const plan = E.reviewPlan(state, bank, now, random);
const replacement = plan.questions[0];
assert.notEqual(replacement.id, target.id);
assert.equal(replacement.unit, target.unit); assert.equal(replacement.skill, target.skill);
assert.equal(plan.targets[replacement.id], target.id);
const run = { id: 'rotation', mode: 'review', questionIds: [replacement.id], reviewTargets: plan.targets, answers: { [replacement.id]: replacement.answer }, startedAt: now };
const restored = E.restore({ ...state, active: run }, bank);
assert.deepEqual(restored.active.reviewTargets, plan.targets, 'Reload and backup preserve the due reminder mapping');
const graded = E.grade(restored, restored.active, bank, now);
assert.equal(E.reviewIds(graded.state, bank, now).length, 0);
assert.equal(graded.state.ledger[target.id].attempts, 1, 'A replacement must not fabricate an answer for the original');
assert.equal(graded.state.ledger[target.id].lastSeen, state.ledger[target.id].lastSeen);
assert.equal(graded.state.ledger[target.id].dueAt, now + 3 * DAY);
assert.equal(graded.state.ledger[replacement.id].correctCount, 1);
assert.equal(graded.report.earnedXP, 10, 'XP is earned only for the actual new answer');
assert.equal(E.grade(graded.state, restored.active, bank, now).state, graded.state, 'Duplicate submit remains idempotent');
assert.equal(E.restore(JSON.parse(JSON.stringify(graded.state)), bank).ledger[target.id].dueAt, now + 3 * DAY);
const failed = E.grade(state, { ...run, id: 'failed', answers: {} }, bank, now).state;
assert.equal(failed.ledger[target.id].dueAt, state.ledger[target.id].dueAt);
assert.ok(E.reviewIds(failed, bank, now).includes(target.id), 'A failed replacement keeps the original reminder');
assert.equal(E.wrongIds(failed, bank)[0], replacement.id);
assert.equal(E.reviewPlan(failed, bank, now, random).questions[0].id, replacement.id, 'Mistakes are retried first');

const pool = E.catalog(bank).unique.filter(q => q.unit === target.unit && q.skill === target.skill);
for (const q of pool.filter(q => q.id !== target.id)) state.ledger[q.id] = entry(true, 5, now + DAY);
assert.equal(E.reviewPlan(state, bank, now, random).questions[0].id, target.id, 'Fall back to the original when no eligible variant remains');
state.ledger[target.id] = entry(false);
assert.equal(E.reviewPlan(state, bank, now, random).questions[0].id, target.id, 'Wrong answers keep their direct retry');
assert.deepEqual(E.reviewPlan(E.emptyState(), bank, now, random).questions, []);

const synthetic = Array.from({ length: 12 }, (_, i) => ({ ...target, id: `test-${i}`, stem: `Unique practice ${i}` }));
const weighted = { ...E.emptyState(), ledger: Object.fromEntries(synthetic.map((q, i) => [q.id, entry(true, i === 11 ? 9 : 1, i < 10 ? 1 : 2)])) };
let lowCorrect = 0, highCorrect = 0;
for (let i = 0; i < 1000; i++) {
  const next = E.reviewPlan(weighted, synthetic, now, random);
  assert.equal(next.questions.length, 10);
  assert.equal(new Set(next.questions.map(E.fingerprint)).size, 10, 'No repeated content in a batch');
  if (next.questions[0].id === 'test-10') lowCorrect++;
  if (next.questions[0].id === 'test-11') highCorrect++;
}
assert.ok(lowCorrect > highCorrect * 10, `Correct-answer frequency reduces weight: ${lowCorrect} vs ${highCorrect}`);

// Complete several batches: each due slot uses a different unseen question while available.
state = { ...E.emptyState(), ledger: { [target.id]: entry(true) } };
let time = now;
const seen = new Set([target.id]);
for (let i = 0; i < Math.min(5, pool.length - 1); i++) {
  const next = E.reviewPlan(state, bank, time, random), question = next.questions[0];
  assert.ok(!seen.has(question.id), 'Prefer unseen content across completed reviews');
  seen.add(question.id);
  const answers = Object.fromEntries(next.questions.map(q => [q.id, q.answer]));
  state = E.grade(state, { id: `round-${i}`, mode: 'review', questionIds: next.questions.map(q => q.id), reviewTargets: next.targets, answers }, bank, time).state;
  assert.equal(E.reviewIds(state, bank, time).length, 0);
  time += 3 * DAY;
}

const unrelated = bank.find(q => q.unit !== target.unit);
const forged = E.restore({ ...E.emptyState(), ledger: { [unrelated.id]: entry(true) }, active: { ...run, reviewTargets: { [replacement.id]: unrelated.id } } }, bank);
assert.deepEqual(forged.active.reviewTargets, {}, 'Import cannot postpone an unrelated unit');
const wrongTarget = E.restore({ ...E.emptyState(), ledger: { [target.id]: entry(false) }, active: run }, bank);
assert.deepEqual(wrongTarget.active.reviewTargets, {}, 'Import cannot resolve a wrong original using a replacement');
const legacyRun = E.restore({ ...E.emptyState(), active: { ...run, reviewTargets: undefined } }, bank).active;
assert.ok(legacyRun); assert.equal(legacyRun.reviewTargets, undefined, 'Existing drafts remain compatible');
console.log(`PASS: fresh review rotation; ${lowCorrect}:${highCorrect} weighted draws; wrong priority; cooldown; reload/import; grading/XP; repeated batches.`);
