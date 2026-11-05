import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), E = require('../dist/engine.js');
const makeRandom = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const synthetic = E.UNITS.flatMap(unit => Array.from({ length: 24 }, (_, i) => ({
  id: `${unit}-X${i}`, unit, stem: `${unit} unique ${i}`, kind: 'choice',
  options: ['alpha', 'beta', 'gamma', 'delta'], answer: 0,
  skill: i < 6 ? 'calculation' : i < 12 ? 'scenario' : 'concept', difficulty: i < 12 ? 'hard' : 'easy',
})));
for (const [mode, expected] of [['quick', [2, 2, 1]], ['mission', [4, 4, 2]]]) {
  for (let seed = 1; seed <= 100; seed++) {
    const result = E.select(synthetic, { mode, unitId: 'L111' }, makeRandom(seed));
    assert.deepEqual(['concept', 'scenario', 'calculation'].map(skill => result.filter(q => q.skill === skill).length), expected,
      `${mode}: zero remaining slots must not add unrelated candidates (seed ${seed})`);
  }
}
for (const subject of [1, 2]) for (let seed = 1; seed <= 100; seed++) {
  const hard = E.select(synthetic, { mode: 'exam', subject, difficulty: 'hardcore' }, makeRandom(seed));
  assert.equal(hard.length, 50);
  assert.ok(hard.every(q => q.difficulty === 'hard'), 'Hard candidates fill the exam before easy fallback');
  for (const unit of E.UNITS.filter(unit => unit.startsWith(subject === 1 ? 'L11' : 'L12'))) {
    assert.equal(hard.filter(q => q.unit === unit && q.skill === 'calculation').length, 6, `${unit}: calculations get first priority`);
  }
  const standard = E.select(synthetic, { mode: 'exam', subject, difficulty: 'standard' }, makeRandom(seed));
  assert.ok(standard.some(q => q.difficulty === 'easy'), 'Standard mode retains its mixed question distribution');
  assert.equal(new Set(hard.map(E.fingerprint)).size, 50);
}
const bank = [1, 2].flatMap(id => JSON.parse(fs.readFileSync(`content/questions-subject${id}.json`, 'utf8')));
for (const subject of [1, 2]) for (const difficulty of ['standard', 'hardcore', 'hard']) {
  for (let seed = 1; seed <= 100; seed++) {
    const result = E.select(bank, { mode: 'exam', subject, difficulty }, makeRandom(seed));
    assert.equal(result.length, 50);
    assert.ok(result.every(q => q.kind === 'choice'));
    assert.equal(new Set(result.map(E.fingerprint)).size, 50);
    assert.ok(!['L114-10', 'L114-11'].every(id => result.some(q => q.id === id)), 'Mutually revealing questions stay apart');
    const expected = [9, 9, 8, 8, 8, 8];
    for (const [index, unit] of E.UNITS.filter(unit => unit.startsWith(subject === 1 ? 'L11' : 'L12')).entries()) {
      assert.equal(result.filter(q => q.unit === unit).length, expected[index]);
    }
  }
}
const easyOnly = synthetic.map(q => ({ ...q, skill: 'concept', difficulty: 'easy' }));
assert.equal(E.select(easyOnly, { mode: 'exam', subject: 1, difficulty: 'hardcore' }, makeRandom(1)).length, 50, 'Sparse advanced tiers fall back safely');
console.log('PASS: quick/mission quotas, actual hardcore priority, standard mix, 600 real exam draws, subject/unit quotas, exclusions and sparse-tier fallback.');
