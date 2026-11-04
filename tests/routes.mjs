import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';
import { hydrate } from './helpers/materials.mjs';

const errors = [];
const diagnostics = new VirtualConsole();
diagnostics.on('jsdomError', error => errors.push(error.message));
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', {
  runScripts: 'dangerously', url: 'https://localhost/#/guide/materials/M12103', virtualConsole: diagnostics,
});
const { window } = dom;
const doc = window.document;
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
// Real diagram syntax and lifecycle checks live in diagrams.mjs.
window.FactoryDiagrams = { render: async () => {} };
const html = fs.readFileSync('dist/index.html', 'utf8');
const scriptPaths = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
for (const file of scriptPaths.filter(file => !/^(https?:|assets\/|diagrams\.js)/.test(file))) {
  const script = doc.createElement('script');
  script.textContent = fs.readFileSync(`dist/${file}`, 'utf8');
  doc.body.append(script);
  if (file === 'data.js') hydrate(window.FACTORY_QUEST_DATA);
}
const data = window.FACTORY_QUEST_DATA;
const topics = data.studyMaterials.map(material => material.topicCode);
const readingTopics = topics.filter(topic => !['APPX01', 'APPX02'].includes(topic));
async function waitFor(predicate) {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, `Navigation timed out at ${window.location.hash}`);
    await new Promise(resolve => window.setTimeout(resolve, 10));
  }
}
async function go(route) {
  window.history.replaceState(null, '', `#/${route}`);
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
  if (/^guide\/materials\/APPX0[12]$/.test(route)) {
    const target = route.endsWith('1') ? 'formulas' : 'traps';
    await waitFor(() => window.location.hash === `#/guide/${target}` && doc.querySelector('.study-tab[aria-current="page"]')?.getAttribute('href') === `#/guide/${target}`);
  }
}

for (const topic of readingTopics) {
  await go(`guide/materials/${topic}`);
  const material = data.studyMaterials.find(m => m.topicCode === topic);
  assert.equal(doc.querySelector('.reader-heading h2').textContent, material.title, topic);
  assert.equal(doc.querySelectorAll('.workspace h1').length, 1, `${topic}: one page heading`);
  assert.equal(doc.querySelector('.section-title').textContent, '備考寶典');
  assert.equal(doc.querySelectorAll('.nav-sub-list, .topbar-chapter-nav, .material-hero').length, 0);
  for (const image of doc.querySelectorAll('.material-content img')) {
    assert.ok(fs.existsSync(`dist/${image.getAttribute('src')}`), `${topic}: ${image.src}`);
  }
  for (const button of doc.querySelectorAll('[data-action="reading-section"]')) {
    assert.ok(doc.getElementById(button.dataset.target), `${topic}: valid paragraph target`);
  }
}
await go('guide/materials/M12103');
doc.querySelector('.reader-next:last-child').click();
await waitFor(() => window.location.hash === '#/guide/materials/M12201' && doc.querySelector('.reader-heading h2')?.textContent === data.studyMaterials.find(m => m.topicCode === 'M12201').title);
assert.equal(window.location.hash, '#/guide/materials/M12201');
assert.equal(doc.querySelector('.reader-heading h2').textContent, data.studyMaterials.find(m => m.topicCode === 'M12201').title);
const outline = doc.querySelector('.reader-disclosure');
outline.open = true;
const sectionButton = outline.querySelector('button');
sectionButton.click();
assert.equal(outline.open, false);
assert.equal(doc.activeElement.id, sectionButton.dataset.target);
assert.equal(window.location.hash, '#/guide/materials/M12201', 'paragraph jumps preserve the route');

await go('guide');
assert.equal(doc.querySelectorAll('.library-entry').length, 26);
assert.equal(doc.querySelectorAll('.study-tab[aria-current="page"]').length, 1);
const search = doc.getElementById('library-search');
const group = doc.getElementById('library-group');
search.value = 'M12103';
search.dispatchEvent(new window.Event('input', { bubbles: true }));
assert.equal(doc.querySelectorAll('.library-entry:not([hidden])').length, 1);
group.value = 'subject1';
group.dispatchEvent(new window.Event('change', { bubbles: true }));
assert.equal(doc.querySelectorAll('.library-entry:not([hidden])').length, 0);
assert.equal(doc.getElementById('library-empty').hidden, false);
doc.querySelector('[data-action="clear-library"]').click();
assert.equal(doc.querySelectorAll('.library-entry:not([hidden])').length, 26);
assert.equal(doc.activeElement.id, 'library-search');
group.value = 'subject2';
group.dispatchEvent(new window.Event('change', { bubbles: true }));
assert.equal(doc.querySelectorAll('.library-entry:not([hidden])').length, 6);
doc.querySelector('.library-entry:not([hidden])').click();
await waitFor(() => !!doc.querySelector('.reader-article'));
assert.ok(doc.querySelector('.reader-article'));
doc.querySelector('.reader-back').click();
await waitFor(() => window.location.hash === '#/guide/materials' && !!doc.querySelector('.guide-library'));
assert.ok(doc.querySelector('.guide-library'));

for (const [topic, tab] of [['APPX01', 'formulas'], ['APPX02', 'traps']]) {
  await go(`guide/materials/${topic}`);
  assert.equal(window.location.hash, `#/guide/${tab}`);
  assert.equal(doc.querySelector('.study-tab[aria-current="page"]').getAttribute('href'), `#/guide/${tab}`);
  assert.ok(doc.querySelector('.reader-article').textContent.length > 1000);
  if (tab === 'formulas') assert.equal(doc.querySelectorAll('.reader-article > h2').length, 7);
  else {
    assert.equal(doc.querySelectorAll('.reader-article > h3').length, 10);
    assert.ok(doc.querySelector('.reader-supplements').textContent.includes('MRP'));
  }
}
await go('guide/glossary');
const glossary = doc.getElementById('glossary-input');
glossary.focus();
for (const [query, expected] of [['OEE', 1], ['no-such-term-123', 0], ['', data.glossary.length]]) {
  glossary.value = query;
  glossary.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.ok(doc.getElementById('glossary-result').textContent.startsWith(`顯示 ${expected} /`));
  assert.equal(doc.querySelectorAll('.glossary-abbr').length, expected);
  assert.equal(doc.activeElement, glossary, 'search preserves focus');
}
await go('guide/materials/unknown');
assert.ok(doc.querySelector('.guide-empty'));
for (const [filter, units, overviews] of [['all', 12, 5], ['s1', 6, 0], ['s2', 6, 0], ['overview', 0, 5]]) {
  await go('atlas');
  const target = `#/atlas/${filter}`;
  doc.querySelector(`.section-tabs a[href="${target}"]`).click();
  await waitFor(() => window.location.hash === target && doc.querySelector('.section-tabs a[aria-current="page"]')?.getAttribute('href') === target);
  assert.equal(doc.querySelectorAll('.unit-atlas-card').length, units, filter);
  assert.equal(doc.querySelectorAll('.diagram-hub-card').length, overviews, filter);
  assert.equal(doc.querySelectorAll('main .page-intro, main .atlas-filter-tabs, main h1').length, 0);
  assert.equal(doc.querySelectorAll('nav[aria-label="圖鑑單元分類"]').length, 1);
  assert.equal(doc.querySelector('.section-title').textContent, '單元架構與視覺圖鑑');
}
for (const route of ['guide/materials', 'guide/glossary', 'guide/formulas', 'guide/traps', 'exam/quiz', 'exam/pdfs']) {
  await go(route);
  assert.equal(doc.querySelector('.section-tabs [aria-current="page"]').getAttribute('href'), `#/${route}`);
  assert.equal(doc.querySelectorAll('main .guide-tabs, main .study-tabs, main .guide-masthead, main .page-intro').length, 0);
  assert.equal(doc.querySelectorAll('.workspace h1').length, 1);
}
for (const route of ['home', 'atlas', 'exam', 'exam/pdfs', 'progress', 'repair']) {
  await go(route);
  assert.ok(doc.querySelector('.workspace'), route);
  assert.equal(doc.querySelectorAll('.side-nav > a').length, 6);
}
await go('exam/pdfs');
assert.equal(new Set([...doc.querySelectorAll('a[href$=".pdf"]')].map(link => link.href)).size, 9);
const precache = { self: {} };
vm.runInNewContext(fs.readFileSync('dist/precache.js', 'utf8'), precache);
for (const file of ['guide.js', 'guide-reading.js', 'guide-notes.js', 'guide.css', 'shell.js', 'shell.css']) {
  assert.ok(html.includes(file) && precache.self.FACTORY_PRECACHE.assets.includes(file), `${file}: shell and precache`);
  assert.ok(fs.readFileSync(`dist/${file}`, 'utf8').split('\n').length <= 300, `${file}: focused module`);
}
assert.deepEqual(errors, []);
dom.window.close();
console.log('PASS: compact page headers; all 4 atlas filters; 26 readers; 2 reference aliases; catalog filters; paragraph, chapter and tab navigation; glossary; 9 PDFs; shell precache. DOM checks only.');
