const fs = require('fs');
const crypto = require('crypto');
const E = require('../dist/engine.js');

const q1 = JSON.parse(fs.readFileSync('content/questions-subject1.json', 'utf8'));
const q2 = JSON.parse(fs.readFileSync('content/questions-subject2.json', 'utf8'));
const bank = [...q1, ...q2];
const catalog = E.catalog(bank);

// Pseudo-random generator with seed for reproducible balanced shuffling
function makeRng(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const rng = makeRng(20261105);

function shuffleArray(arr, random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const units = ['L111', 'L112', 'L113', 'L114', 'L115', 'L116', 'L121', 'L122', 'L123', 'L124', 'L125', 'L126'];

const distribution = { 0: 0, 1: 0, 2: 0, 3: 0 };
const unitDists = {};

// For each unit, ensure an exact uniform balance of target answers [0, 1, 2, 3]
for (const unit of units) {
  const uQuestions = catalog.unique.filter(q => q.unit === unit && q.kind === 'choice');
  unitDists[unit] = { 0: 0, 1: 0, 2: 0, 3: 0 };

  // Create balanced target slots: e.g. [0, 1, 2, 3, 0, 1, 2, 3, ...]
  const targetSlots = [];
  for (let i = 0; i < uQuestions.length; i++) {
    targetSlots.push(i % 4);
  }
  // Shuffle the target slots so which question gets which slot is random
  const shuffledSlots = shuffleArray(targetSlots, rng);

  uQuestions.forEach((q, idx) => {
    const correctText = q.options[q.answer];
    const distractors = shuffleArray(q.options.filter((_, i) => i !== q.answer), rng);
    const targetPos = shuffledSlots[idx];

    // Construct new options with correctText at targetPos
    const newOptions = [];
    let dIdx = 0;
    for (let pos = 0; pos < 4; pos++) {
      if (pos === targetPos) {
        newOptions.push(correctText);
      } else {
        newOptions.push(distractors[dIdx++]);
      }
    }

    q.options = newOptions;
    q.answer = targetPos;

    distribution[targetPos]++;
    unitDists[unit][targetPos]++;
  });
}

console.log('Overall balanced distribution across 416 unique choice questions:');
console.log(distribution);
console.log('Per unit distributions:');
console.log(unitDists);
