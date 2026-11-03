const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\benit\\Desktop\\iPAS智慧生產工程師';
const dstDir = 'C:\\Users\\benit\\Desktop\\ipas-factory-quest-source';

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (['node_modules', '.git', '.next', 'dist', 'build', '.cache'].includes(file)) continue;
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

const allSrc = walk(srcDir).map(p => path.relative(srcDir, p));

console.log(`Total files in source: ${allSrc.length}`);

// Group by prefix
const groups = {};
for (const p of allSrc) {
  const top = p.split(path.sep)[0];
  if (!groups[top]) groups[top] = [];
  groups[top].push(p);
}

for (const [k, v] of Object.entries(groups)) {
  console.log(`- ${k}: ${v.length} files`);
}
