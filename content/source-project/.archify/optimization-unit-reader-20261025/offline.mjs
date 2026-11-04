import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'file:///C:/Users/benit/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const base = process.env.SUMMARY_QA_URL ?? 'http://127.0.0.1:57841';
const folder = new URL('.', import.meta.url);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.stack));
const ready = (code) => page.locator(`[data-unit-summary="${code}"] iframe[data-diagram-state="ready"]`).waitFor({ timeout: 30000 });
const results = [];
try {
  await page.goto(`${base}/#/topic/M11101`);
  await ready('M11101');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const installed = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return { controller: navigator.serviceWorker.controller.scriptURL, state: registration.active.state, caches: await caches.keys() };
  });
  await context.setOffline(true);
  await page.reload();
  await ready('M11101');
  for (const code of ['M11101', 'M13201', 'M22301']) {
    await page.goto(`${base}/#/topic/${code}`);
    await ready(code);
    await page.getByRole('tab', { name: '文字導讀', exact: true }).click();
    await page.locator('.unit-summary-reader__detail h3').waitFor();
    const reader = await page.locator('.unit-summary-reader').evaluate((element) => ({ font: getComputedStyle(element).fontSize, concepts: element.querySelectorAll('option').length, title: element.querySelector('h3').textContent }));
    assert.equal(reader.font, '18px');
    results.push({ code, ...reader });
  }
  assert.equal(errors.length, 0, JSON.stringify(errors));
  await page.screenshot({ path: fileURLToPath(new URL('offline-mobile.png', folder)) });
  const report = { ok: true, base, installed, offlineUnits: results, errors, date: new Date().toISOString() };
  await fs.writeFile(new URL('offline-verification.json', folder), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await fs.writeFile(new URL('offline-verification.json', folder), JSON.stringify({ ok: false, error: error.stack, results, errors }, null, 2), 'utf8');
  throw error;
} finally { await browser.close(); }
