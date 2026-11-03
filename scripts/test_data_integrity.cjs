const fs = require('fs');

const dataFile = fs.readFileSync('dist/data.js', 'utf8');
const vm = require('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(dataFile, sandbox);

const d = sandbox.window.FACTORY_QUEST_DATA;
console.log('Units:', d.units.length);
console.log('Questions:', d.questions.length);
console.log('Glossary:', d.glossary.length);
console.log('StudyMaterials:', d.studyMaterials.length);
console.log('PDFs:', d.pdfs.length);
console.log('VisualAssets:', Object.keys(d.visualAssets));
