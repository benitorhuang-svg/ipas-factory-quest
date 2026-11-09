const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const E = require('../dist/engine.js');

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
      assert.ok(row && typeof row === 'object' && !Array.isArray(row), `${id}: explicit authored analysis required`);
      authored[id] = row;
    }
  }
  return authored;
}

module.exports = function enrich(bank, root) {
  const authored = load(bank, root);
  const legacy = JSON.parse(fs.readFileSync(path.join(root, 'content/question-legacy.json'), 'utf8'));
  const previous = JSON.parse(fs.readFileSync(path.join(root, 'content/question-revisions.json'), 'utf8'));
  assert.equal(previous.revision, E.previousRevision, 'Historical snapshot revision must match the engine');
  for (const [id, snapshot] of Object.entries(previous.questions)) {
    assert.equal(snapshot.question.id, id, 'Historical snapshot ID');
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(snapshot.question)).digest('hex'), snapshot.sha256, `${id}: historical snapshot changed`);
  }
  const catalog = E.catalog(bank), byId = new Map(bank.map(question => [question.id, question]));
  const hash = question => crypto.createHash('sha256').update(E.fingerprint(question)).digest('hex');
  for (const q of catalog.unique) assert.ok(authored[q.id], `${q.id}: missing detailed explanation; complete all question analyses before building`);
  for (const [id, detail] of Object.entries(authored)) {
    const question = byId.get(id);
    assert.ok(question, `Unknown explanation: ${id}`);
    assert.equal(catalog.aliases.get(id), id, `Author canonical explanations only: ${id}`);
    assert.equal(detail.fingerprint, hash(question), `${id}: question changed; recheck its explanation`);
    for (const field of ['focus', 'steps', 'check']) {
      assert.ok(Array.isArray(detail[field]) && (field === 'focus' || detail[field].length), `${id}: ${field}`);
      assert.ok(detail[field].every(line => typeof line === 'string' && line.trim()), `${id}: ${field} text`);
    }
    assert.ok(detail.steps.length >= 2, `${id}: reasoning must have multiple steps`);
    assert.equal(new Set(detail.steps).size, detail.steps.length, `${id}: repeated reasoning`);
    assert.ok(!detail.steps.some(step => detail.check.includes(step)), `${id}: repeated check`);
    if (detail.visual) {
      const visual = detail.visual;
      assert.ok(['mps', 'capacity', 'backward', 'standard-time'].includes(visual.type), `${id}: supported explanation visual`);
      if (visual.type === 'standard-time') assert.ok(Number.isFinite(visual.normal) && visual.normal > 0 && Number.isFinite(visual.allowanceRate) && visual.allowanceRate > 0 && visual.allowanceRate < 1, `${id}: normal time and allowance as a fraction of standard time`);
      if (visual.type === 'mps') assert.ok(typeof visual.product === 'string' && visual.product.trim() && typeof visual.period === 'string' && visual.period.trim() && Number.isFinite(visual.quantity) && visual.quantity > 0, `${id}: MPS product, quantity and period`);
      if (visual.type === 'capacity') assert.ok(Number.isFinite(visual.available) && visual.available > 0 && Number.isFinite(visual.required) && visual.required > visual.available, `${id}: capacity overload example`);
      if (visual.type === 'backward') assert.ok(Number.isFinite(visual.due) && Number.isFinite(visual.duration) && visual.duration > 0 && visual.due >= visual.duration, `${id}: backward scheduling example`);
    }
    if (detail.criticalRatio) {
      const { available, required } = detail.criticalRatio;
      assert.ok(Number.isFinite(available) && available >= 0 && Number.isFinite(required) && required > 0, `${id}: critical ratio needs nonnegative available time and positive remaining work`);
    }
    if (detail.scheduleComparison) {
      const { jobs, sequences, takeaway } = detail.scheduleComparison;
      assert.ok(Array.isArray(jobs) && jobs.length === 2, `${id}: two-job schedule comparison`);
      const ids = jobs.map(job => job.id);
      assert.equal(new Set(ids).size, jobs.length, `${id}: unique schedule jobs`);
      assert.ok(jobs.every(job => typeof job.id === 'string' && job.id.trim() && Number.isFinite(job.duration) && job.duration > 0 && Number.isFinite(job.due) && job.due >= 0), `${id}: schedule job data`);
      assert.ok(Array.isArray(sequences) && sequences.length === 2, `${id}: two schedule orders`);
      assert.ok(sequences.every(row => typeof row.label === 'string' && row.label.trim() && Array.isArray(row.order) && row.order.length === ids.length && new Set(row.order).size === ids.length && row.order.every(job => ids.includes(job))), `${id}: schedule order must include every job once`);
      assert.notDeepEqual(sequences[0].order, sequences[1].order, `${id}: compare different orders`);
      assert.ok(typeof takeaway === 'string' && takeaway.trim(), `${id}: schedule takeaway`);
    }
    for (const reference of detail.references || []) {
      assert.ok(reference.title?.trim() && /^https:\/\//.test(reference.url), `${id}: reference`);
    }
    if (question.kind === 'choice') {
      assert.ok(Array.isArray(detail.options) && detail.options.length === question.options.length, `${id}: option coverage`);
      assert.ok(detail.options.every(line => typeof line === 'string' && line.trim()), `${id}: option reasons`);
      assert.equal(new Set(detail.options).size, question.options.length, `${id}: each option needs its own reason`);
      assert.ok(!detail.options.some(line => /其他選項均為|與題意核心概念不符|一般干擾項/.test(line)), `${id}: no boilerplate`);
    } else assert.ok(Array.isArray(detail.pitfalls) && detail.pitfalls.length, `${id}: numeric pitfalls`);
  }
  const enriched = bank.map(question => {
    const detail = { ...authored[catalog.aliases.get(question.id)] };
    delete detail.fingerprint;
    const original = legacy.questions[question.id];
    let historical = original;
    // Only reuse analysis when the original wording and option meanings match.
    // Historical answers and option order remain exactly as originally published.
    if (original && original.stem === question.stem) {
      if (question.kind === 'number' && original.answer === question.answer) historical = { ...original, analysis: detail };
      else if (original.options?.every(option => question.options.includes(option)) && original.options[original.answer] === question.options[question.answer]) {
        historical = { ...original, analysis: { ...detail, options: original.options.map(option => detail.options[question.options.indexOf(option)]) } };
      }
    }
    const snapshot = previous.questions[question.id]?.question;
    return { ...question, analysis: detail, ...(historical ? { legacy: historical } : {}), ...(snapshot ? { versions: { [previous.revision]: snapshot } } : {}) };
  });
  const priorDigest = crypto.createHash('sha256').update(JSON.stringify(enriched.map(question => {
    const historical = { ...E.questionFor(question, { questionRevision: previous.revision }) };
    delete historical.legacy; delete historical.versions;
    return [question.id, crypto.createHash('sha256').update(JSON.stringify(historical)).digest('hex')];
  }))).digest('hex');
  assert.equal(priorDigest, previous.bankFingerprint, 'Previous revision content changed; preserve all affected IDs and aliases with snapshots');
  return enriched;
};
module.exports.load = load;
