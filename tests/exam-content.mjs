import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { references, contextReferences, focus } = require('../scripts/exam-analysis.cjs');

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const chapters = read('content/study-materials.json');
const questions = read('content/official-questions.json');
const index = read('docs/歷屆試題與解題技巧/115第一次試題教材對照索引.json');
const notes = read('content/official-exam-notes.json');
const noteIndex = new Map(notes.map(note => [note.id, note]));
assert.equal(questions.length, 200);
assert.equal(new Set(questions.map(question => question.id)).size, 200);
for (const subject of index.subjects) for (const entry of subject.questions) {
  const question = questions.find(question => question.id === `${subject.subject}-${entry.question}`);
  assert.equal(question.officialAnswer, entry.officialAnswer);
  assert.equal(question.concept, entry.concept);
  assert.equal(question.materialCode, entry.topicCode);
  assert.ok(question.details.length > 100);
  assert.equal(question.note, entry.note);
  for (const id of question.noteIds) assert.ok(noteIndex.get(id).questionIds.includes(question.id));
  const chapter = chapters.find(chapter => chapter.topicCode === entry.topicCode);
  assert.ok(chapter.details.includes(`href="#/guide/questions/${question.id}"`));
}
for (const chapter of chapters.filter(chapter => questions.some(question => question.materialCode === chapter.topicCode))) {
  const dom = new JSDOM(chapter.details);
  assert.ok(!dom.window.document.body.textContent.includes('試題判讀與選項辨析'));
  assert.ok(!dom.window.document.body.textContent.includes('常見誤選理由'));
  assert.ok([...dom.window.document.querySelectorAll('p')].every(node => !/第\s*\d+\s*題/.test(node.textContent)), chapter.topicCode);
  assert.ok(dom.window.document.body.textContent.includes('對應考題核心'));
  dom.window.close();
}
const mes = questions.find(question => question.id === 'L12-7');
assert.match(mes.details, /將時間、產量及品質整合的 OEE 模組/);
assert.match(mes.details, /只因報工提供資料就選報工系統/);
assert.match(questions.find(question => question.id === 'L11-45').details, /監控哪個品項/);
assert.match(questions.find(question => question.id === 'L22-23').details, /QoS 0／1／2/);
assert.match(questions.find(question => question.id === 'L22-4').details, /服務平台/);
assert.ok(!questions.find(question => question.id === 'L21-4').details.includes('服務平台'));
assert.ok(!questions.find(question => question.id === 'L21-1').details.includes('第 17 題'));
assert.ok(!questions.find(question => question.id === 'L22-41').details.includes('第 6 題'));
assert.ok(!questions.find(question => question.id === 'L11-8').details.includes('1.32825'));
assert.match(questions.find(question => question.id === 'L21-3').details, /歷史讀值找故障前兆/);
assert.match(questions.find(question => question.id === 'L21-4').details, /安全、品質、交期、成本、士氣/);
assert.match(questions.find(question => question.id === 'L21-27').details, /設備／製程控制/);
assert.ok(questions.find(question => question.id === 'L22-6').noteIds.every(id => noteIndex.get(id).materialCode === 'M22201'));
const fragment = new JSDOM('<p>L21 第 6 題取 90 秒。L22 第 41 題為 <span class="math-inline">$TT=9.6$</span>；仍須檢查先行關係。</p>');
const focused = focus(fragment.window.document.querySelector('p'), 'L21');
assert.ok(focused.get('L22-41').join('').includes('$TT=9.6$'));
assert.ok(!focused.get('L22-41').join('').includes('90 秒'));
assert.deepEqual(references('L11 第 1–3、5 題及 L22 第 41 題', 'L11').ids, ['L11-1', 'L11-2', 'L11-3', 'L11-5', 'L22-41']);
assert.throws(() => references('第 51 題', 'L11'));
assert.deepEqual(contextReferences('對照 L21 第 6 題及 L22 第 41 題。第 6 題採 90 秒。', 'L21'), ['L21-6', 'L22-41']);
fragment.window.close();
// Every original math source remains in a chapter, focused analysis or full note.
const published = new Set();
for (const html of [...chapters.map(chapter => chapter.details), ...questions.map(question => question.details), ...notes.map(note => note.html)]) {
  const dom = new JSDOM(html);
  for (const node of dom.window.document.querySelectorAll('.math-inline,.math-block')) published.add(node.textContent.trim());
  dom.window.close();
}
for (const material of read('content/material-index.json')) {
  const source = fs.readFileSync(`content/study-materials/${material.topicCode}.ts`, 'utf8');
  const literal = source.match(/export const material:\s*StudyMaterial\s*=\s*([\s\S]*);\s*$/)[1];
  const original = vm.runInNewContext(`(${literal})`, {}, { timeout: 1000 });
  const dom = new JSDOM(original.details);
  for (const node of dom.window.document.querySelectorAll('.math-inline,.math-block')) assert.ok(published.has(node.textContent.trim()), `Dropped formula: ${material.topicCode} ${node.textContent}`);
  dom.window.close();
}
assert.equal(fs.readdirSync('dist/materials').filter(file => file.startsWith('EXAM-')).length, 0);
for (const chapter of chapters) {
  const payload = read(`dist/materials/${chapter.topicCode}.json`);
  const dom = new JSDOM(payload.details);
  for (const link of dom.window.document.querySelectorAll('a[href^="#/topic"]')) assert.fail(`Legacy chapter route: ${link.href}`);
  dom.window.close();
  assert.deepEqual(Object.keys(payload.questions), questions.filter(question => question.materialCode === chapter.topicCode).map(question => question.id));
  for (const question of Object.values(payload.questions)) for (const id of question.noteIds) assert.ok(payload.notes[id]);
}
console.log('PASS: 200 focused explanations, answer mapping, formula conservation, shared chapter bundles and subject-scoped references.');
