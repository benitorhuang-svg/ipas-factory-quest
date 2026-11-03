const fs = require('fs');
const path = require('path');

const srcDocs = 'C:\\Users\\benit\\Desktop\\iPAS智慧生產工程師\\docs';
const dstDocs = 'C:\\Users\\benit\\Desktop\\ipas-factory-quest-source\\docs';

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

const srcList = walk(srcDocs).map(f => path.relative(srcDocs, f));
const dstList = walk(dstDocs).map(f => path.relative(dstDocs, f));

console.log('src docs count:', srcList.length);
console.log('dst docs count:', dstList.length);

const missing = srcList.filter(f => !dstList.includes(f));
console.log('Missing docs in dst:', missing);
