const fs = require('fs');
const content = fs.readFileSync('content/study-materials/M11101.ts', 'utf8');
const idx = content.indexOf('flowchart');
if (idx !== -1) {
  console.log(content.slice(idx - 150, idx + 200));
} else {
  console.log('not found');
}
