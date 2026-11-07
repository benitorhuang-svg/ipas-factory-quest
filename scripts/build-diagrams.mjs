import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { chromium } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '../dist');
const target = path.join(root, 'assets/diagrams');
fs.mkdirSync(target, { recursive: true });
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const revision = hash(Buffer.concat(['assets/mermaid.min.js', 'diagrams.js'].map(file => fs.readFileSync(path.join(root, file))).concat(fs.readFileSync(import.meta.filename))));
let previous = {};
try { previous = JSON.parse(fs.readFileSync(path.join(target, 'manifest.json'), 'utf8')).entries || {}; } catch {}
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), context);
const entries = {}, local = {};
let browser, page, rendered = 0, count = 0;
async function render(source) {
  if (!browser) {
    browser = await chromium.launch(); page = await browser.newPage();
    await page.setContent('<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><body></body></html>');
    await page.addScriptTag({ path: path.join(root, 'assets/mermaid.min.js') });
    await page.addScriptTag({ path: path.join(root, 'diagrams.js') });
    await page.evaluate(() => document.fonts.ready);
  }
  return page.evaluate(async source => {
    const { svg } = await window.mermaid.render('factory-prebuilt', source);
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const root = document.documentElement;
    const ids = new Map([...root.querySelectorAll('[id]'), root].filter(node => node.id).map((node, i) => [node.id, `FQ_DIAGRAM_INSTANCE-${i}`]));
    for (const node of [root, ...root.querySelectorAll('*')]) {
      for (const attribute of [...node.attributes]) {
        let value = attribute.value;
        if (attribute.name === 'id') value = ids.get(value);
        else if (attribute.name === 'aria-labelledby' || attribute.name === 'aria-describedby') value = value.split(/\s+/).map(id => ids.get(id) || id).join(' ');
        else {
          value = value.replace(/url\(["']?#([^)'"\s]+)["']?\)/g, (match, id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
          if (/^(?:xlink:)?href$/.test(attribute.name) && value.startsWith('#') && ids.has(value.slice(1))) value = '#' + ids.get(value.slice(1));
        }
        node.setAttribute(attribute.name, value);
      }
      if (node.localName === 'style') {
        for (const [oldId, newId] of ids) {
          const escaped = oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          node.textContent = node.textContent.replace(new RegExp('#' + escaped + '(?![\\w-])', 'g'), '#' + newId);
        }
      }
    }
    root.setAttribute('data-prebuilt-diagram', 'true');
    return root.outerHTML;
  }, source);
}
try {
  for (const material of context.window.FACTORY_QUEST_DATA.studyMaterials) {
    const file = path.join(root, material.file);
    const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
    const dom = new JSDOM(payload.details);
    const blocks = [...dom.window.document.querySelectorAll('.mermaid, .language-mermaid')];
    for (const block of blocks) {
      const source = block.textContent.replace(/\r\n?/g, '\n').trim();
      const key = hash(revision + '\0' + source).slice(0, 16);
      const asset = `assets/diagrams/${key}.svg`;
      const output = path.join(root, asset);
      let valid = false;
      if (previous[key] && fs.existsSync(output)) valid = hash(fs.readFileSync(output)) === previous[key].sha256;
      if (!valid && !entries[key]) { fs.writeFileSync(output, await render(source)); rendered++; }
      entries[key] = { file: asset, sha256: hash(fs.readFileSync(output)), bytes: fs.statSync(output).size };
      block.setAttribute('data-diagram-src', asset);
      count++;
    }
    if (blocks.length) {
      payload.details = dom.window.document.body.innerHTML;
      fs.writeFileSync(file, JSON.stringify(payload) + '\n');
    }
    local[material.topicCode] = payload.details;
    dom.window.close();
  }
  for (const file of fs.readdirSync(target)) {
    if (file.endsWith('.svg') && !entries[file.slice(0, -4)]) fs.unlinkSync(path.join(target, file));
  }
  fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify({ revision, count, entries }, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'materials-local.js'), `window.FactoryLocalMaterials = ${JSON.stringify(local)};\n`);
  console.log(`Built ${count} pre-rendered diagrams (${rendered} rendered, ${count - rendered} reused); Mermaid sources preserved.`);
} finally { await browser?.close(); }
