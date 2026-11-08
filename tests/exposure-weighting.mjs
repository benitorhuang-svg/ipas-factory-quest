import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), E = require('../dist/engine.js');
const randomFor = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const synthetic = E.UNITS.flatMap(unit => Array.from({ length: 60 }, (_, i) => ({
  id: `${unit}-T${String(i).padStart(2, '0')}`, unit, stem: `${unit} unique practice ${i}`, kind: 'choice', options: ['A', 'B'], answer: 0,
  skill: ['calculation', 'scenario', 'concept'][i % 3], difficulty: i % 4 < 2 ? 'hard' : 'easy',
})));
const entry = (attempts, correctCount = 1, lastCorrect = true) => ({ attempts, correctCount, lastCorrect, lastSeen: 1, dueAt: 0 });
const lowIds = new Set(synthetic.filter((_, i) => i % 2 === 0).map(q => q.id));
const progress = { ...E.emptyState(), ledger: Object.fromEntries(synthetic.map(q => [q.id, entry(lowIds.has(q.id) ? 1 : 9)])) };
const snapshot = JSON.stringify(progress), draws = [];
for (const spec of [
  { mode: 'quick', unitId: 'L111' }, { mode: 'mission', unitId: 'L111' },
  { mode: 'exam', subject: 1, difficulty: 'standard' }, { mode: 'exam', subject: 2, difficulty: 'hardcore' },
]) {
  let low = 0, frequent = 0;
  const random = randomFor(42);
  for (let i = 0; i < 300; i++) {
    const picked = E.select(synthetic, { ...spec, state: progress }, random);
    assert.equal(picked.length, spec.mode === 'exam' ? 50 : spec.mode === 'mission' ? 10 : 5);
    assert.equal(new Set(picked.map(q => q.id)).size, picked.length);
    if (spec.mode === 'exam' && spec.difficulty === 'hardcore') assert.ok(picked.every(q => q.skill === 'calculation'), 'Exposure weighting stays inside hardcore priority tiers');
    for (const q of picked) if (lowIds.has(q.id)) low++; else frequent++;
  }
  assert.ok(low > frequent * 6, `${spec.mode}/${spec.difficulty || 'practice'}: low-attempt questions with identical correctness get more exposure (${low}:${frequent})`);
  draws.push(`${spec.mode}/${spec.difficulty || 'practice'} ${low}:${frequent}`);
  const zero = synthetic.find(q => q.unit === (spec.subject === 2 ? 'L121' : 'L111') && q.skill === 'calculation');
  const unseen = JSON.parse(snapshot);
  delete unseen.ledger[zero.id];
  for (let seed = 1; seed <= 10; seed++) assert.ok(E.select(synthetic, { ...spec, state: unseen }, randomFor(seed)).some(q => q.id === zero.id), 'Unseen questions retain priority within eligible tiers');
}
assert.equal(JSON.stringify(progress), snapshot, 'Drawing questions never increments saved attempt counts');

// Correctness and coverage are independent: both constraints must affect practiced questions.
for (const [label, makeEntry] of [
  ['rare mistakes', q => entry(lowIds.has(q.id) ? 1 : 9, 0, false)],
  ['correct-answer penalty', q => entry(10, lowIds.has(q.id) ? 1 : 9)],
]) {
  const state = { ...E.emptyState(), ledger: Object.fromEntries(synthetic.map(q => [q.id, makeEntry(q)])) };
  let low = 0, frequent = 0;
  const random = randomFor(108);
  for (let i = 0; i < 200; i++) for (const q of E.select(synthetic, { mode: 'quick', unitId: 'L111', state }, random)) if (lowIds.has(q.id)) low++; else frequent++;
  assert.ok(low > frequent * 8, `${label}: ${low}:${frequent}`);
}

const bank = [1, 2].flatMap(id => JSON.parse(fs.readFileSync(`content/questions-subject${id}.json`, 'utf8')));
const saved = E.restore({ ...E.emptyState(), ledger: Object.fromEntries(bank.map((q, i) => [q.id, entry(i % 2 ? 1 : 9)])) }, bank);
for (const subject of [1, 2]) for (const difficulty of ['standard', 'hardcore']) for (let seed = 1; seed <= 20; seed++) {
  const picked = E.select(bank, { mode: 'exam', subject, difficulty, state: saved }, randomFor(seed));
  assert.equal(picked.length, 50);
  assert.equal(new Set(picked.map(E.fingerprint)).size, 50);
  assert.ok(picked.every(q => q.kind === 'choice'));
  assert.ok(!['L114-10', 'L114-11'].every(id => picked.some(q => q.id === id)));
  for (const [i, unit] of E.UNITS.filter(unit => unit.startsWith(subject === 1 ? 'L11' : 'L12')).entries()) assert.equal(picked.filter(q => q.unit === unit).length, [9, 9, 8, 8, 8, 8][i]);
}
console.log(`PASS: low-frequency exposure with equal correctness (${draws.join('; ')}); unseen priority; wrong/correct weighting; read-only draws; 80 real weighted exams retain quotas, exclusions and unique content.`);
