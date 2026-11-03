const fs = require('fs');
const path = require('path');
const srcDir = 'C:\\Users\\benit\\Desktop\\iPAS智慧生產工程師';

function readHead(p) {
  if (!fs.existsSync(p)) return 'NOT FOUND';
  return fs.readFileSync(p, 'utf-8').slice(0, 1500);
}

console.log('--- src/game/types.ts ---');
console.log(readHead(path.join(srcDir, 'src/game/types.ts')));

console.log('--- src/game/cards/index.ts ---');
console.log(readHead(path.join(srcDir, 'src/game/cards/index.ts')));

console.log('--- src/game/levels/index.ts ---');
console.log(readHead(path.join(srcDir, 'src/game/levels/index.ts')));
