const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const E = require('../dist/engine.js');
const { parse } = require('../dist/explanations.js');

function load(bank, root) {
  const authored = JSON.parse(fs.readFileSync(path.join(root, 'content/question-explanations.json'), 'utf8'));
  const directory = path.join(root, 'content/question-explanations');
  const byId = new Map(bank.map(question => [question.id, question]));
  for (const file of fs.readdirSync(directory).sort()) {
    assert.match(file, /^L\d{3}\.json$/, `Unexpected explanation file: ${file}`);
    const entries = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
    for (const [id, row] of Object.entries(entries)) {
      const q = byId.get(id);
      assert.ok(q && q.unit === file.slice(0, -5), `Explanation in wrong unit: ${id}`);
      assert.ok(!authored[id], `Duplicate authored explanation: ${id}`);
      assert.ok(Array.isArray(row) && row.length === 6, `${id}: four option reasons, check and fingerprint required`);
      const solution = parse(q.explanation).steps.join(' ').replace(/^[」』][。；]?\s*/, '');
      authored[id] = {
        focus: [q.hint], steps: [solution, row[q.answer]],
        options: row.slice(0, 4), check: [row[4]], fingerprint: row[5],
      };
    }
  }
  return authored;
}

module.exports = function enrich(bank, root) {
  const authored = load(bank, root);
  const legacy = JSON.parse(fs.readFileSync(path.join(root, 'content/question-legacy.json'), 'utf8'));
  const catalog = E.catalog(bank), byId = new Map(bank.map(question => [question.id, question]));
  const hash = question => crypto.createHash('sha256').update(E.fingerprint(question)).digest('hex');
  for (const q of catalog.unique) assert.ok(authored[q.id], `${q.id}: missing detailed explanation; complete all question analyses before building`);
  for (const [id, detail] of Object.entries(authored)) {
    const question = byId.get(id);
    assert.ok(question, `Unknown explanation: ${id}`);
    assert.equal(catalog.aliases.get(id), id, `Author canonical explanations only: ${id}`);
    assert.equal(detail.fingerprint, hash(question), `${id}: question changed; recheck its explanation`);
    for (const field of ['focus', 'steps', 'check']) {
      assert.ok(Array.isArray(detail[field]) && detail[field].length, `${id}: ${field}`);
      assert.ok(detail[field].every(line => typeof line === 'string' && line.trim()), `${id}: ${field} text`);
    }
    assert.ok(detail.steps.length >= 2, `${id}: reasoning must have multiple steps`);
    if (question.kind === 'choice') {
      assert.ok(Array.isArray(detail.options) && detail.options.length === question.options.length, `${id}: option coverage`);
      assert.ok(detail.options.every(line => typeof line === 'string' && line.trim()), `${id}: option reasons`);
      assert.equal(new Set(detail.options).size, question.options.length, `${id}: each option needs its own reason`);
      assert.ok(!detail.options.some(line => /其他選項均為|與題意核心概念不符|一般干擾項/.test(line)), `${id}: no boilerplate`);
    } else assert.ok(Array.isArray(detail.pitfalls) && detail.pitfalls.length, `${id}: numeric pitfalls`);
  }
  return bank.map(question => {
    const detail = { ...authored[catalog.aliases.get(question.id)] };
    delete detail.fingerprint;
    return { ...question, analysis: Object.keys(detail).length ? detail : parse(question.explanation),
      ...(legacy.questions[question.id] ? { legacy: legacy.questions[question.id] } : {}) };
  });
};
module.exports.load = load;
