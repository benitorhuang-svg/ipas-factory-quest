import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

const root = path.resolve(import.meta.dirname, '../dist');
const require = createRequire(import.meta.url);
const katex = require(path.join(root, 'assets/vendor/katex/katex.min.js'));
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'math.js'), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), context);
let count = 0;
for (const material of context.window.FACTORY_QUEST_DATA.studyMaterials) {
  const file = path.join(root, material.file);
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const dom = new JSDOM(payload.details);
  const blocks = dom.window.document.querySelectorAll('.math-block, .math-inline');
  for (const block of blocks) {
    const raw = block.getAttribute('data-raw-math') || block.textContent.trim();
    const tex = context.window.FactoryMath.clean(raw);
    block.innerHTML = katex.renderToString(tex, { displayMode: block.classList.contains('math-block'), throwOnError: true });
    block.setAttribute('data-raw-math', raw);
    block.setAttribute('data-math-done', 'katex');
    count++;
  }
  if (blocks.length) {
    payload.details = dom.window.document.body.innerHTML;
    fs.writeFileSync(file, JSON.stringify(payload) + '\n');
  }
  dom.window.close();
}
console.log(`Built ${count} KaTeX formulas as HTML/MathML; raw formulas preserved for fallback.`);
