const fs = require('fs');
const q1 = JSON.parse(fs.readFileSync('content/questions-subject1.json', 'utf8'));
const q2 = JSON.parse(fs.readFileSync('content/questions-subject2.json', 'utf8'));
const all = [...q1, ...q2];

for (const unit of ['L115', 'L116']) {
  const uq = all.filter(q => q.unit === unit);
  console.log(`\n=== UNIT ${unit} ===`);
  for (const q of uq.slice(0, 10)) {
    console.log(`[${q.id}] ${q.stem}`);
    if (q.options) {
      q.options.forEach((opt, idx) => {
        const mark = idx === q.answer ? '*' : ' ';
        console.log(`  ${mark} [${idx}] ${opt}`);
      });
    }
  }
}
