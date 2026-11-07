import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), E = require('../dist/engine.js');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const bank = [1, 2].flatMap(id => read(`content/questions-subject${id}.json`));
const unique = E.catalog(bank).unique, units = read('content/units.json'), reviews = read('content/question-reviews.json').questions;
const index = new Map(reviews.map(review => [review.canonicalId, review]));
assert.equal(index.size, unique.length, 'Every canonical question has one review record');
for (const question of unique) {
  const review = index.get(question.id), unit = units.find(unit => unit.id === question.unit);
  assert.ok(review, question.id);
  assert.equal(review.fingerprint, crypto.createHash('sha256').update(E.fingerprint(question)).digest('hex'), `${question.id}: content changed; renew its review record`);
  assert.equal(review.unitId, question.unit); assert.equal(review.materialCode, unit.topicCode);
  assert.ok(review.sourceFiles.length);
  for (const file of review.sourceFiles) assert.ok(fs.existsSync(file), file);
  assert.ok(['pending', 'reviewed'].includes(review.review.status));
  if (review.review.status === 'reviewed') {
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(review.review.reviewedAt));
    assert.ok(review.review.reviewer && review.competencyPoints.length && review.difficulty);
  }
}
const pending = reviews.filter(review => review.review.status === 'pending').length;
if (process.argv.includes('--report')) {
  const agent = read('content/exam-analysis-review.json');
  const official = read('content/official-question-review.json');
  const lines = ['# 題庫來源與單元覆蓋', '', '由 npm run report:content 產生；來源覆蓋、代理內容審查與獨立人工複核分開記錄，不據此推定官方能力點全覆蓋。', '', `保留 ${bank.length} 筆來源、${unique.length} 道不同內容。本輪代理複核 ${agent.questions.length} 道練習題，另逐題核對 ${Object.keys(official.questions).length} 道公告試題，見 docs/QUESTION_DEPTH_REVIEW.md。`, '', `審核欄位仍有 ${pending} 筆 pending；既有 reviewed 記錄不代表本輪取得獨立人工或官方簽核。`, '', '| 單元 | 教材 | 來源筆數 | 不同內容 | 既有 reviewed 記錄 |', '| --- | --- | ---: | ---: | ---: | ---: |'];
  for (const unit of units) lines.push(`| ${unit.id} ${unit.title} | ${unit.topicCode} | ${bank.filter(q => q.unit === unit.id).length} | ${unique.filter(q => q.unit === unit.id).length} | ${reviews.filter(r => r.unitId === unit.id && r.review.status === 'reviewed').length} |`);
  lines.push('', '來源狀態台帳：content/question-reviews.json；代理審查台帳：content/exam-analysis-review.json、content/official-question-review.json；重複 ID 對照：content/question-aliases.json。', '', '既有能力點、難度及 reviewer 欄位保留原狀，變動題目重新設為 pending；不由建置自動填造獨立人工審查。', '');
  fs.writeFileSync('docs/QUESTION_COVERAGE.md', lines.join('\n'));
}
console.log(`PASS: ${unique.length} question fingerprints, source paths and material links; ${pending} explicitly pending human reviews.`);
