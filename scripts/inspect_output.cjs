const fs = require('fs');
const path = require('path');
const srcDir = 'C:\\Users\\benit\\Desktop\\iPAS智慧生產工程師';

function list(sub) {
  const p = path.join(srcDir, sub);
  if (!fs.existsSync(p)) return [];
  return fs.readdirSync(p);
}

console.log('imagegen:', list('output/imagegen'));
console.log('infographics:', list('output/infographics'));
