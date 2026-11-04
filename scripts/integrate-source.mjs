import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const source = path.resolve(process.argv.slice(2).find(arg => !arg.startsWith('--')) || path.join(root, '../iPAS智慧生產工程師'));
const apply = process.argv.includes('--apply');
if (source === root || source.startsWith(root + path.sep)) throw new Error('Source must be outside this project');
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const slash = file => file.split(path.sep).join('/');
function walk(dir, skip = []) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (skip.includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file, skip) : [file];
  });
}
const mappings = [
  ['docs/', 'docs/'], ['public/assets/', 'dist/assets/'],
  ['src/data/study-materials/', 'content/study-materials/'],
  ['src/data/quiz-banks/', 'content/raw-quiz-banks/'],
  ['output/infographics/', 'dist/assets/infographics/'],
];
const records = [];
for (const file of walk(source, ['.git', 'node_modules', 'dist'])) {
  const relative = slash(path.relative(source, file));
  const mapping = mappings.find(([prefix]) => relative.startsWith(prefix));
  let target = mapping ? relative.replace(mapping[0], mapping[1]) : `content/source-project/${relative}`;
  const hash = digest(file);
  let status = 'copied';
  if (fs.existsSync(path.join(root, target))) {
    if (digest(path.join(root, target)) === hash) status = 'identical';
    else {
      target = `content/source-project/${relative}`;
      status = 'preserved-source-version';
    }
  }
  if (fs.existsSync(path.join(root, target)) && digest(path.join(root, target)) !== hash) {
    target = `content/source-project/versions/${hash.slice(0, 12)}/${relative}`;
    status = 'preserved-source-version';
  }
  if (apply && status !== 'identical') {
    const destination = path.join(root, target);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(file, destination);
  }
  records.push({ source: relative, target, sha256: hash, bytes: fs.statSync(file).size, status });
}
const summary = records.reduce((result, record) => {
  result[record.status] = (result[record.status] || 0) + 1;
  return result;
}, {});
console.log(JSON.stringify({ source, apply, count: records.length, summary }, null, 2));
if (process.argv.includes('--verbose')) console.log(JSON.stringify(records.filter(record => record.status !== 'identical'), null, 2));
if (apply) {
  for (const record of records) {
    if (digest(path.join(root, record.target)) !== record.sha256) throw new Error(`Copy mismatch: ${record.source}`);
  }
  fs.writeFileSync(path.join(root, 'content/source-integration.json'), JSON.stringify({
    sourceName: path.basename(source),
    excluded: { '.git': 'Repository history stays in the original repository', node_modules: 'Reproducible from package-lock.json', dist: 'Generated build; source, public assets and existing output are retained' },
    summary, files: records,
  }, null, 2) + '\n');
}
