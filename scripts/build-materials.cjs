const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const readJSON = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const data = readJSON('content/site-resources.json');

// Evaluate the repository's generated string literals once. Manual replacements
// leave escaped CRs behind and damage LaTeX, quotes and diagram labels.
const materialIndex = readJSON('content/material-index.json');
const topicCodes = new Set(materialIndex.map(material => material.topicCode));
data.studyMaterials = materialIndex.map(previous => {
  const file = path.join(root, 'content/study-materials', `${previous.topicCode}.ts`);
  const source = fs.readFileSync(file, 'utf8');
  const literal = source.match(/export const material:\s*StudyMaterial\s*=\s*([\s\S]*);\s*$/)?.[1];
  if (!literal) throw new Error(`Cannot read material: ${file}`);
  const material = JSON.parse(JSON.stringify(vm.runInNewContext(`(${literal})`, {}, { timeout: 1000 })));
  const details = material.details.replace(/\r\n?/g, '\n').replace(/(?:\.\/|\/)assets\//g, 'assets/')
    .replace(/href="#\/topic\/([^"]+)"/g, (_match, code) => {
      if (!topicCodes.has(code)) throw new Error(`Unknown chapter link: ${code}`);
      return `href="#/guide/materials/${code}"`;
    }).replace(/href="#\/topics"/g, 'href="#/guide/materials"');
  return { ...previous, ...material, details };
});
data.units = readJSON('content/units.json');
data.questions = require('./question-explanations.cjs')([...readJSON('content/questions-subject1.json'), ...readJSON('content/questions-subject2.json')], root);
const exams = require('./prepare-exam-content.cjs')(data.studyMaterials, root);
data.officialQuestions = exams.questions;
data.officialSubjects = exams.subjects;
fs.writeFileSync(path.join(root, 'content/official-questions.json'), JSON.stringify(data.officialQuestions, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'content/official-exam-notes.json'), JSON.stringify(exams.notes, null, 2) + '\n');
data.glossary = readJSON('content/glossary.json');
const rendererHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'dist/assets/mermaid.min.js'))).digest('hex').slice(0,16);
data.rendererUrl = `assets/mermaid.min.js?v=${rendererHash}`;
fs.writeFileSync(path.join(root, 'content/study-materials.json'), JSON.stringify(data.studyMaterials, null, 2) + '\n');
const materialDirectory = path.join(root, 'dist/materials');
fs.mkdirSync(materialDirectory, { recursive: true });
fs.writeFileSync(path.join(root, 'dist/materials-local.js'), `window.FactoryLocalMaterials = ${JSON.stringify(Object.fromEntries(data.studyMaterials.map(m => [m.topicCode, m.details])))};\n`);
const publish = ({ details, ...meta }) => {
  const file = `materials/${meta.topicCode}.json`;
  const own = exams.questions.filter(question => question.materialCode === meta.topicCode);
  const noteIds = new Set(own.flatMap(question => question.noteIds));
  const questions = Object.fromEntries(own.map(question => [question.id, { details: question.details, note: question.note || '', noteIds: question.noteIds }]));
  const notes = Object.fromEntries(exams.notes.filter(note => noteIds.has(note.id)).map(note => [note.id, { html: note.html, materialCode: note.materialCode, heading: note.heading }]));
  fs.writeFileSync(path.join(root, 'dist', file), JSON.stringify({ topicCode: meta.topicCode, details, questions, notes }) + '\n');
  return { ...meta, file, questionIds: own.map(question => question.id) };
};
data.studyMaterials = data.studyMaterials.map(publish);
data.officialQuestions = exams.questions.map(({ id, subject, question, concept, officialAnswer, materialCode, note }) => ({ id, subject, question, concept, officialAnswer, materialCode, hasNote: Boolean(note) }));
// Remove only superseded per-question outputs owned by this publisher.
for (const name of fs.readdirSync(materialDirectory).filter(name => /^EXAM-L(?:11|12|21|22)-\d+\.json$/.test(name))) {
  const file = path.join(materialDirectory, name);
  if (JSON.parse(fs.readFileSync(file, 'utf8')).topicCode !== name.slice(0, -5)) throw new Error(`Unexpected legacy payload: ${file}`);
  fs.unlinkSync(file);
}
fs.writeFileSync(path.join(root, 'dist/data.js'), `window.FACTORY_QUEST_DATA = ${JSON.stringify(data)};\n`);
console.log(`Built ${data.studyMaterials.length} materials and ${data.questions.length} questions.`);
