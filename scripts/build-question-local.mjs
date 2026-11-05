import fs from 'node:fs';

// Keep question explanations available under file:// alongside chapter payloads.
const chapters = JSON.parse(fs.readFileSync('content/material-index.json', 'utf8'));
const local = Object.fromEntries(chapters.map(chapter => {
  const payload = JSON.parse(fs.readFileSync(`dist/materials/${chapter.topicCode}.json`, 'utf8'));
  return [chapter.topicCode, { questions: payload.questions, notes: payload.notes }];
}));
fs.appendFileSync('dist/materials-local.js', `window.FactoryLocalQuestionBundles = ${JSON.stringify(local)};\n`);
console.log(`Built local-file question bundles for ${chapters.length} chapters.`);
