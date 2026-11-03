const fs = require('fs');
const path = require('path');

function getFolderSize(dir) {
  let size = 0;
  let count = 0;
  if (!fs.existsSync(dir)) return { size, count };
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      const sub = getFolderSize(full);
      size += sub.size;
      count += sub.count;
    } else {
      size += stat.size;
      count++;
    }
  }
  return { size, count };
}

const assetsDir = path.join(__dirname, '..', 'dist', 'assets');
const list = fs.readdirSync(assetsDir);
list.forEach(item => {
  const full = path.join(assetsDir, item);
  const stat = fs.statSync(full);
  if (stat.isDirectory()) {
    const s = getFolderSize(full);
    console.log(`[DIR] ${item}: ${s.count} files, ${(s.size / (1024 * 1024)).toFixed(2)} MB`);
  } else {
    console.log(`[FILE] ${item}: ${(stat.size / 1024).toFixed(1)} KB`);
  }
});
