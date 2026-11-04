const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const readJSON = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const data = readJSON('content/site-resources.json');

// Evaluate the repository's generated string literals once. Manual replacements
// leave escaped CRs behind and damage LaTeX, quotes and diagram labels.
data.studyMaterials = readJSON('content/material-index.json').map(previous => {
  const file = path.join(root, 'content/study-materials', `${previous.topicCode}.ts`);
  const source = fs.readFileSync(file, 'utf8');
  const literal = source.match(/export const material:\s*StudyMaterial\s*=\s*([\s\S]*);\s*$/)?.[1];
  if (!literal) throw new Error(`Cannot read material: ${file}`);
  const material = JSON.parse(JSON.stringify(vm.runInNewContext(`(${literal})`, {}, { timeout: 1000 })));
  return { ...previous, ...material, details: material.details.replace(/\r\n?/g, '\n').replace(/(?:\.\/|\/)assets\//g, 'assets/') };
});
data.units = readJSON('content/units.json');
data.questions = [...readJSON('content/questions-subject1.json'), ...readJSON('content/questions-subject2.json')];
data.glossary = readJSON('content/glossary.json');
const rendererHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'dist/assets/mermaid.min.js'))).digest('hex').slice(0,16);
data.rendererUrl = `assets/mermaid.min.js?v=${rendererHash}`;
for (const [key, file] of Object.entries({
  formulasMarkdown: '核心公式與計算題彙整.md', trapsMarkdown: '考古題盲點與常見陷阱.md',
})) data[key] = fs.readFileSync(path.join(root, 'docs/歷屆試題與解題技巧', file), 'utf8');
fs.writeFileSync(path.join(root, 'content/study-materials.json'), JSON.stringify(data.studyMaterials, null, 2) + '\n');
const materialDirectory = path.join(root, 'dist/materials');
fs.mkdirSync(materialDirectory, { recursive: true });
fs.writeFileSync(path.join(root, 'dist/materials-local.js'), `window.FactoryLocalMaterials = ${JSON.stringify(Object.fromEntries(data.studyMaterials.map(m => [m.topicCode, m.details])))};\n`);
data.studyMaterials = data.studyMaterials.map(({ details, ...meta }) => {
  const file = `materials/${meta.topicCode}.json`;
  fs.writeFileSync(path.join(root, 'dist', file), JSON.stringify({ topicCode: meta.topicCode, details }) + '\n');
  return { ...meta, file };
});
fs.writeFileSync(path.join(root, 'dist/data.js'), `window.FACTORY_QUEST_DATA = ${JSON.stringify(data)};\n`);
console.log(`Built ${data.studyMaterials.length} materials and ${data.questions.length} questions.`);
