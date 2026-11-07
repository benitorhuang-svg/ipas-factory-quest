import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
const require = createRequire(import.meta.url);
const E = require('../dist/engine.js');
const X = require('../dist/explanations.js');
const enrich = require('../scripts/question-explanations.cjs');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const bank = [1, 2].flatMap(id => read(`content/questions-subject${id}.json`));
const enriched = enrich(bank, process.cwd());
const authored = enrich.load(bank, process.cwd());
const snapshot = { window: {} };
vm.runInNewContext(fs.readFileSync('dist/data.js', 'utf8'), snapshot);
assert.deepEqual(JSON.parse(JSON.stringify(snapshot.window.FACTORY_QUEST_DATA.questions)), enriched, 'Published explanations match current sources');

const preamble = '計畫生產時間＝480－60＝420 分鐘；運轉時間＝378 分鐘。';
assert.deepEqual(X.parse(`${preamble}\n【重點辨析】\n• 分母不含未排產時間。`), {
  focus: [], steps: [preamble], pitfalls: ['分母不含未排產時間。'], check: [],
});
assert.deepEqual(X.parse('【破題關鍵】找分母。\n【正解解析】先求時間。\n【正解】再求比率。\n【避坑提醒】勿重複扣。'), {
  focus: ['找分母。'], steps: ['先求時間。', '再求比率。'], pitfalls: [], check: ['勿重複扣。'],
});
assert.deepEqual(X.parse('原始本文。\n【重點辨析】\n• 相同辨析。\n【重點辨析】\n• 相同辨析。').pitfalls, ['相同辨析。']);
assert.deepEqual(X.parse('單純本文，沒有標記。').steps, ['單純本文，沒有標記。']);
assert.deepEqual(X.parse('公式。\n【重點辨析】\n• 其他選項均為數值計算常見干擾項（混淆計算基準）。').pitfalls, []);
assert.ok(X.parse('本文。\n【未收錄標記】仍保留內容。').steps.join('').includes('仍保留內容'));

assert.equal(Object.keys(authored).length, E.catalog(bank).unique.length, 'All canonical questions have authored analyses');
const unique = E.catalog(enriched).unique;
const examPool = unique.filter(q => q.kind === 'choice');
assert.equal(examPool.length, 396);
for (const q of unique) assert.ok(authored[q.id], `${q.id}: full authored coverage`);
for (const q of examPool) assert.equal(authored[q.id].options.length, q.options.length, `${q.id}: every option is explained`);
for (const subject of [1, 2]) for (const difficulty of ['standard', 'hardcore']) for (let i = 0; i < 100; i++) {
  for (const q of E.select(enriched, { mode: 'exam', subject, difficulty })) {
    assert.ok(q.analysis.options?.every(reason => reason.trim()), `${q.id}: selected exam question has complete analysis`);
  }
}
for (let i = 0; i < bank.length; i++) {
  assert.equal(E.fingerprint(enriched[i]), E.fingerprint(bank[i]), `${bank[i].id}: stable question/answer identity`);
  assert.equal(enriched[i].analysis.steps.length > 0, true, `${bank[i].id}: substantive solution retained`);
  assert.doesNotMatch(JSON.stringify(enriched[i].analysis), /其他選項均為|常見誤算：未扣抵安全庫存|與題意核心概念不符/);
  const canonical = E.catalog(enriched).aliases.get(bank[i].id);
  assert.deepEqual(enriched[i].analysis, enriched.find(q => q.id === canonical).analysis, `${bank[i].id}: alias analysis`);
}
for (const change of [q => { q.stem += ' changed'; }, q => { [q.options[0], q.options[1]] = [q.options[1], q.options[0]]; }, q => { q.answer = 0; }]) {
  const changed = structuredClone(bank);
  change(changed.find(q => q.id === 'L116-07'));
  assert.throws(() => enrich(changed, process.cwd()), /recheck its explanation/, 'Stale content must fail the build');
}

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-analysis-'));
try {
  fs.mkdirSync(path.join(fixture, 'content'), { recursive: true });
  fs.copyFileSync('content/question-explanations.json', path.join(fixture, 'content/question-explanations.json'));
  fs.copyFileSync('content/question-legacy.json', path.join(fixture, 'content/question-legacy.json'));
  fs.copyFileSync('content/question-revisions.json', path.join(fixture, 'content/question-revisions.json'));
  fs.cpSync('content/question-explanations', path.join(fixture, 'content/question-explanations'), { recursive: true });
  const versions = read('content/question-revisions.json');
  delete versions.questions['L125-B05'];
  fs.writeFileSync(path.join(fixture, 'content/question-revisions.json'), JSON.stringify(versions));
  assert.throws(() => enrich(bank, fixture), /Previous revision content changed/, 'Changed aliases must not fall through to the latest wording');
  fs.copyFileSync('content/question-revisions.json', path.join(fixture, 'content/question-revisions.json'));
  const file = path.join(fixture, 'content/question-explanations/L111.json');
  const entries = read(file); delete entries['L111-01'];
  fs.writeFileSync(file, JSON.stringify(entries));
  assert.throws(() => enrich(bank, fixture), /L111-01: missing detailed explanation/, 'Missing mock-exam analysis blocks the build');
} finally {
  assert.equal(path.dirname(path.resolve(fixture)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(fixture).startsWith('factory-analysis-'));
  fs.rmSync(fixture, { recursive: true, force: true });
}

for (const id of ['L113-B01', 'L113-B04', 'L113-B07']) assert.equal(bank.find(q => q.id === id).answer, 1, `${id}: employee performance is not a core MRP input`);
assert.match(bank.find(q => q.id === 'L113-B23').options[1], /未放行前不把 80 件納入可領用量/);
assert.match(bank.find(q => q.id === 'L121-B11').stem, /物理生產過程/);
const corrected = bank.find(q => q.id === 'L113-B01');
const oldReport = E.restore({ ...E.emptyState(), earnedCorrectIds: ['L113-B04'], history: [{
  runId: 'before-answer-correction', mode: 'exam', score: 100, total: 1, correct: 1,
  results: [{ id: corrected.id, answer: 3, correct: true }],
}] }, bank);
assert.equal(oldReport.history[0].score, 0, 'Historical scores use the corrected answer');
assert.equal(oldReport.earnedCorrectIds[0], 'L113-B04', 'Legacy earned identity is retained');

const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only' });
const { window } = dom, doc = window.document;
window.eval(fs.readFileSync('dist/explanations.js', 'utf8'));
window.eval(fs.readFileSync('dist/view-quiz.js', 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const q = enriched.find(q => q.id === 'L116-07');
const ctx = {
  E, state: E.emptyState(), bank: enriched, qmap: new Map(enriched.map(q => [q.id, q])), byUnit: () => null,
  esc, icon: () => '<svg></svg>', footer: () => '', modeName: () => '練習', fmt: String,
  runQuestions: () => [q], home: () => '',
};
const permutations = new Set();
for (let seed = 0; seed < 200; seed++) {
  const runId = `explanation-${seed}`;
  ctx.state.active = { id: runId, mode: 'quick', answers: {} };
  doc.body.innerHTML = window.FactoryQuiz.render(ctx);
  const order = [...doc.querySelectorAll('input[type=radio]')].map(input => Number(input.value));
  permutations.add(order.join(','));
  ctx.state.history = [{ runId, mode: 'quick', score: 0, correct: 0, total: 1, earnedXP: 0, results: [{ id: q.id, answer: 1, correct: false }] }];
  doc.body.innerHTML = window.FactoryQuiz.result(ctx, runId);
  const selected = doc.querySelector('.expl-option.is-selected');
  assert.equal(selected.dataset.optionIndex, '1');
  assert.match(selected.textContent, /78.75/);
  assert.match(selected.querySelector('strong').textContent, new RegExp(`^${'ABCD'[order.indexOf(1)]}\\.`));
  assert.match(doc.querySelector('.answer-lines').textContent, new RegExp(`${'ABCD'[order.indexOf(1)]}\\. 78.75`));
  assert.equal(doc.querySelectorAll('.expl-section h4').length, 4);
  assert.equal(doc.querySelectorAll('.expl-steps li').length, 3);
  assert.equal(doc.querySelectorAll('.expl-option').length, 3);
  assert.doesNotMatch(doc.body.textContent, /【重點辨析】|其他選項均為/);
}
assert.equal(permutations.size, 24, 'All option permutations checked through the real quiz and result renderers');
for (const q of enriched) {
  doc.body.innerHTML = X.render({ esc, icon: () => '' }, q, { answer: q.answer });
  assert.equal(doc.querySelectorAll('.is-selected').length, 0, 'Correct answers do not get a wrong-option marker');
  const headings = [...doc.querySelectorAll('h4')].map(node => node.textContent);
  assert.equal(new Set(headings).size, headings.length, `${q.id}: sections appear once`);
}
doc.body.innerHTML = X.render({ esc, icon: () => '' }, { hint: '<img src=x onerror=alert(1)>', explanation: '【破題關鍵】<script>bad</script>\n【正解解析】<b>data</b>\n【重點辨析】<iframe></iframe>' });
assert.equal(doc.querySelectorAll('script,img,iframe,b').length, 0, 'Explanation text is always escaped');
dom.window.close();
console.log(`PASS: ${bank.length} records, ${unique.length} authored analyses and all ${examPool.length} mock-exam questions; 400 standard/hardcore mock draws, all 24 option orders, identity and stale-content guards.`);
