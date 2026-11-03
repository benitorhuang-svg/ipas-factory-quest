const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\benit\\Desktop\\iPAS智慧生產工程師';

function listFolder(sub) {
  const dir = path.join(srcDir, sub);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).map(d => ({
    name: d.name,
    isDir: d.isDirectory()
  }));
}

console.log('--- public/ ---');
console.log(JSON.stringify(listFolder('public'), null, 2));

console.log('--- src/game/ ---');
console.log(JSON.stringify(listFolder('src/game'), null, 2));

console.log('--- src/data/study-materials/ ---');
console.log(JSON.stringify(listFolder('src/data/study-materials').map(x => x.name), null, 2));
