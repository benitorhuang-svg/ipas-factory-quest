import { fileURLToPath } from 'node:url';
import { chromium } from 'file:///C:/Users/benit/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const directory = new URL('.', import.meta.url);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.stack));
try {
  await page.goto('http://127.0.0.1:57840/#/topic/M13201');
  await page.locator('.unit-summary__frame[data-diagram-state="ready"]').waitFor({ timeout: 30000 });
  const frame = page.frameLocator('.unit-summary__frame');
  const details = await frame.locator('body').evaluate((body) => {
    const text = body.querySelector('text[data-node-label]');
    const matrix = text.getScreenCTM();
    const canvas = body.querySelector('.diagram-container');
    return { mode: body.ownerDocument.documentElement.dataset.present, api: !!window.Archify, fontPx: parseFloat(getComputedStyle(text).fontSize) * Math.hypot(matrix.a, matrix.b), bodyHeight: body.scrollHeight, viewportHeight: innerHeight,
      camera: window.Archify.view.state(), canvas: canvas.getBoundingClientRect().toJSON(), scrollLeft: canvas.scrollLeft,
      svg: body.querySelector('svg').getBoundingClientRect().toJSON(), node: text.closest('[data-node-id]').getBoundingClientRect().toJSON() };
  });
  const host = await page.locator('.unit-summary').evaluate((section) => ({ width: section.getBoundingClientRect().width, page: document.documentElement.scrollWidth, viewport: innerWidth, hint: section.querySelector('.unit-summary__hint').textContent, scale: section.querySelector('output').textContent }));
  await page.screenshot({ path: fileURLToPath(new URL('probe-mobile.png', directory)) });
  await page.getByRole('tab', { name: '文字導讀', exact: true }).click();
  await page.locator('.unit-summary-reader__detail h3').waitFor();
  const reader = await page.locator('.unit-summary-reader').evaluate((element) => ({ font: getComputedStyle(element).fontSize, label: element.querySelector('h3').textContent, options: element.querySelectorAll('option').length, width: element.scrollWidth }));
  await page.screenshot({ path: fileURLToPath(new URL('probe-reader.png', directory)) });
  console.log(JSON.stringify({ details, host, reader, errors }, null, 2));
} finally { await browser.close(); }
