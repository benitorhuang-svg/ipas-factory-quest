const fs = require('fs');
const path = require('path');
const srcDir = 'C:\\Users\\benit\\Desktop\\iPAS智慧生產工程師';

function readHead(p) {
  if (!fs.existsSync(p)) return 'NOT FOUND';
  return fs.readFileSync(p, 'utf-8').slice(0, 1500);
}

console.log('--- unit-summary-diagrams.ts ---');
console.log(readHead(path.join(srcDir, 'src/data/unit-summary-diagrams.ts')));

console.log('--- seed-study-materials.ts ---');
console.log(readHead(path.join(srcDir, 'src/data/seed-study-materials.ts')));
