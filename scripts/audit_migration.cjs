const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\benit\\Desktop\\iPAS智慧生產工程師';
const dstDir = 'C:\\Users\\benit\\Desktop\\ipas-factory-quest-source';

function walk(dir) {
  let results = [];
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

try {
  const files = walk(srcDir);
  console.log(`Total files in source: ${files.length}`);
  const summary = {};
  files.forEach(f => {
    const rel = path.relative(srcDir, f);
    const top = rel.split(path.sep)[0];
    summary[top] = (summary[top] || 0) + 1;
  });
  console.log('Categories:', JSON.stringify(summary, null, 2));

  // Print all file paths
  files.forEach(f => {
    console.log(path.relative(srcDir, f));
  });
} catch (e) {
  console.error(e);
}
