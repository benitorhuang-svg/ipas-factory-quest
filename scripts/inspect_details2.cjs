const fs = require('fs');
const path = require('path');
const srcDir = 'C:\\Users\\benit\\Desktop\\iPAS智慧生產工程師';

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

console.log('--- public/assets files ---');
const pubAssets = walk(path.join(srcDir, 'public', 'assets'));
pubAssets.forEach(p => console.log(path.relative(path.join(srcDir, 'public', 'assets'), p)));

console.log('\n--- src/game/levels sample ---');
const levels = walk(path.join(srcDir, 'src', 'game', 'levels'));
levels.forEach(p => console.log(path.relative(path.join(srcDir, 'src', 'game', 'levels'), p)));

console.log('\n--- src/data/study-materials sample ---');
const sampleMaterial = path.join(srcDir, 'src', 'data', 'study-materials', 'M11101.ts');
if (fs.existsSync(sampleMaterial)) {
  console.log(fs.readFileSync(sampleMaterial, 'utf-8').slice(0, 1000));
}
