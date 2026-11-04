import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const root = path.resolve(import.meta.dirname, '../dist');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), context);
const data = context.window.FACTORY_QUEST_DATA;
vm.runInNewContext(fs.readFileSync(path.join(root, 'preview-data.js'), 'utf8'), context);
const previews = context.window.FactoryPreviews;
const chapters = [];
const doc = new JSDOM('').window.document;
for (const material of data.studyMaterials) {
  const files = new Set([material.file]);
  const unit = data.units.find(u => u.topicCode === material.topicCode);
  const details = JSON.parse(fs.readFileSync(path.join(root, material.file), 'utf8')).details;
  const add = (reference, base = 'index.html') => {
    if (!reference || /^(?:https?:|data:|blob:|mailto:|#)/i.test(reference)) return;
    const url = new URL(reference, 'https://local.test/' + base);
    const local = decodeURIComponent(url.pathname.slice(1));
    const absolute = path.resolve(root, local);
    if (!absolute.startsWith(root + path.sep) || !fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) throw new Error(`Missing offline asset: ${local}`);
    const key = local + url.search;
    if (files.has(key)) return;
    files.add(key);
    if (previews[local]) files.add(previews[local].src);
    if (local.endsWith('.html')) {
      const source = fs.readFileSync(absolute, 'utf8');
      for (const match of source.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) add(match[1], local);
    }
  };
  for (const source of [material, unit || {}]) for (const key of ['diagram3D', 'explainerImg', 'interactiveUrl', 'structureDiagram']) add(source[key]);
  doc.body.innerHTML = details;
  for (const element of doc.querySelectorAll('[src], a[href]')) add(element.getAttribute('src') || element.getAttribute('href'));
  if (doc.querySelector('.mermaid')) add(data.rendererUrl);
  const assets = [...files].sort().map(file => {
    const bytes = fs.readFileSync(path.join(root, file.split('?')[0]));
    return { file, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
  });
  chapters.push({ topicCode: material.topicCode, title: material.title, assets, bytes: assets.reduce((sum, item) => sum + item.bytes, 0) });
}
fs.writeFileSync(path.join(root, 'offline-data.js'), `window.FactoryOfflineChapters = ${JSON.stringify(chapters)};\n`);
console.log(`Built ${chapters.length} offline chapters with explicit asset inventories.`);
