import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const data = { window: {} };
vm.runInNewContext(fs.readFileSync('dist/data.js', 'utf8'), data);
const meta = data.window.FACTORY_QUEST_DATA.studyMaterials.find(chapter => chapter.topicCode === 'M12203');
const payload = JSON.parse(fs.readFileSync(`dist/${meta.file}`, 'utf8'));
const dom = new JSDOM('<!doctype html>', { url: 'https://local.test/factory/', runScripts: 'outside-only' });
const { window } = dom;
window.eval(fs.readFileSync('dist/materials.js', 'utf8'));
let release, calls = 0;
window.fetch = async () => {
  calls++;
  await new Promise(resolve => { release = resolve; });
  return { ok: true, json: async () => payload };
};
const material = { ...meta };
const first = window.FactoryMaterials.load(material), second = window.FactoryMaterials.load(material);
assert.equal(first, second, 'Chapter and sibling question readers share the same in-flight request');
assert.equal(calls, 1);
release(); await Promise.all([first, second]);
assert.ok(material.questions['L12-7'].details.includes('OEE'));
await window.FactoryMaterials.load(material); assert.equal(calls, 1, 'Loaded chapter serves every question without fetching again');

const retry = { ...meta };
window.fetch = async () => ({ ok: true, json: async () => ({ ...payload, questions: {} }) });
await assert.rejects(window.FactoryMaterials.load(retry), /不完整/);
assert.equal(retry.details, undefined, 'Invalid bundles never partially update chapter state');
window.fetch = async () => ({ ok: true, json: async () => payload });
await window.FactoryMaterials.load(retry);
assert.ok(retry.questions['L12-46']);

window.fetch = async () => ({ ok: true, json: async () => ({ ...payload, topicCode: 'M11101' }) });
await assert.rejects(window.FactoryMaterials.load({ ...meta }), /格式/);
window.fetch = async () => { throw new Error('disconnected'); };
await assert.rejects(window.FactoryMaterials.load({ ...meta }), /disconnected/);
window.fetch = async () => ({ ok: true, json: async () => payload });
await window.FactoryMaterials.load({ ...meta });
dom.window.close();
console.log('PASS: shared requests/cache, atomic bundle validation, wrong-chapter rejection and retry after malformed/offline responses.');
