const fs = require('fs');
const q1 = JSON.parse(fs.readFileSync('content/questions-subject1.json', 'utf8'));
const q2 = JSON.parse(fs.readFileSync('content/questions-subject2.json', 'utf8'));
const all = [...q1, ...q2];

for (const unit of ['L111', 'L112', 'L113', 'L114', 'L115', 'L116', 'L121', 'L122', 'L123', 'L124', 'L125', 'L126']) {
  const uq = all.filter(q => q.unit === unit);
  console.log(`\n=== UNIT ${unit} (Total: ${uq.length}) ===`);
  for (const q of uq.slice(0, 5)) {
    console.log(`[${q.id}] (${q.kind}/${q.skill}) ${q.stem}`);
    if (q.options) {
      q.options.forEach((opt, idx) => {
        const mark = idx === q.answer ? '*' : ' ';
        console.log(`  ${mark} [${idx}] ${opt}`);
      });
    } else {
      console.log(`  Ans: ${q.answer} ${q.answerUnit || ''}`);
    }
  }
}
