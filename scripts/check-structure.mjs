import fs from 'node:fs';
import path from 'node:path';
const generated = new Set(['data.js', 'precache.js', 'preview-data.js', 'offline-data.js', 'materials-local.js']);
const problems = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (dir !== 'dist') walk(file); continue; }
    if (!/\.(?:m?js|cjs|css)$/.test(entry.name) || generated.has(entry.name)) continue;
    const count = fs.readFileSync(file, 'utf8').trimEnd().split(/\r?\n/).length;
    if (count > 300) problems.push(`${file}: ${count} lines`);
  }
}
for (const dir of ['dist', 'scripts', 'tests']) walk(dir);
if (problems.length) throw new Error(problems.join('\n'));
console.log('PASS: maintained runtime, styles, scripts and tests are at most 300 lines.');
