import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), E = require('../dist/engine.js');
const bank = [1, 2].flatMap(id => JSON.parse(fs.readFileSync(`content/questions-subject${id}.json`, 'utf8')));
assert.equal(E.catalog(bank).unique.length, 416);
for (const mode of ['mission', 'quick', 'exam']) for (const subject of [1, 2]) for (let seed = 0; seed < 100; seed++) {
  let value = seed + 1;
  const random = () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
  const selection = E.select(bank, { mode, subject, unitId: subject === 1 ? 'L111' : 'L121' }, random);
  assert.equal(new Set(selection.map(E.fingerprint)).size, selection.length);
  assert.equal(selection.length, mode === 'exam' ? 50 : mode === 'quick' ? 5 : 10);
}
const old = { ...E.emptyState(), earnedCorrectIds: ['L111-B05', 'L111-B09'], xp: 20, ledger: {
  'L111-B05': { attempts: 1, correctCount: 0, lastCorrect: false, lastSeen: 100, dueAt: 200 },
  'L111-B09': { attempts: 1, correctCount: 1, lastCorrect: true, lastSeen: 300, dueAt: 500 },
} };
const restored = E.restore(old, bank);
assert.equal(restored.xp, 20, 'Previously earned XP remains');
assert.deepEqual(restored.earnedCorrectIds, old.earnedCorrectIds);
assert.equal(E.masteredIds(restored, bank).length, 1);
assert.equal(E.wrongIds(restored, bank).length, 0, 'Latest alias attempt resolves the wrong entry');
assert.deepEqual(E.reviewIds(restored, bank, 499), []);
assert.deepEqual(E.reviewIds(restored, bank, 500), ['L111-B01']);
const question = bank.find(q => q.id === 'L111-B01');
const result = E.grade(restored, { id: 'canonical', mode: 'review', unitId: null, questionIds: [question.id], answers: { [question.id]: question.answer } }, bank, 600);
assert.equal(result.report.earnedXP, 0); assert.equal(result.state.xp, 20);
assert.equal(E.reviewIds(result.state, bank, 601).length, 0);
result.state.ledger['L111-B09'].lastSeen = 600;
result.state.ledger['L111-B09'].lastCorrect = false;
assert.equal(E.wrongIds(result.state, bank).length, 0, 'Canonical attempt wins a timestamp tie with a legacy alias');
const due = E.select(bank, { mode: 'review', state: restored, now: 500 });
assert.equal(due.length, 1); assert.equal(due[0].id, 'L111-B01');
console.log('PASS: 600 draws use unique content; legacy aliases/XP retained; latest attempts and due review work.');
