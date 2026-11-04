import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'file:///C:/Users/benit/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const base = process.env.SUMMARY_QA_URL ?? 'http://127.0.0.1:57840';
const folder = new URL('.', import.meta.url);
const assetRoot = new URL('../../public/assets/interactive-diagrams/unit-summaries/', folder);
const manifest = JSON.parse(await fs.readFile(new URL('manifest.json', assetRoot), 'utf8'));
const browser = await chromium.launch({ headless: true });
const results = [];
const failures = [];
const errors = [];
async function testContext(options = {}) {
  const context = await browser.newContext(options);
  // Isolate fault injection from prefetch; a separate case exercises the real service worker.
  await context.route('**/registerSW.js', (route) => route.fulfill({ contentType: 'text/javascript', body: '' }));
  context.on('page', (page) => page.on('pageerror', (error) => errors.push({ message: error.stack })));
  return context;
}
const ready = async (page, code) => {
  await page.locator(`[data-unit-summary="${code}"] iframe[data-diagram-state="ready"]`).waitFor({ timeout: 30000 });
  return page.frameLocator(`[data-unit-summary="${code}"] iframe`);
};
const metric = async (frame) => frame.locator('body').evaluate((body) => {
  const canvas = body.querySelector('.diagram-container');
  const labels = [...body.querySelectorAll('text[data-node-label]')].filter((e) => e.textContent.trim());
  const size = (e) => { const m = e.getScreenCTM(); return parseFloat(getComputedStyle(e).fontSize) * Math.hypot(m.a, m.b); };
  return { font: Math.min(...labels.map(size)), mode: body.ownerDocument.documentElement.dataset.studyMode,
    bodyHeight: body.scrollHeight, viewportHeight: innerHeight, theme: body.ownerDocument.documentElement.dataset.theme,
    scale: window.Archify.view.state().scale, canvas: canvas.getBoundingClientRect().toJSON(),
    svg: body.querySelector('.diagram-container > svg').getBoundingClientRect().toJSON() };
});
const goto = async (page, code) => { await page.goto(`${base}/#/topic/${code}`); return ready(page, code); };
const shot = async (locator, name) => locator.screenshot({ path: fileURLToPath(new URL(name, folder)) });
async function attempt(name, action) {
  try { const detail = await action(); results.push({ name, ok: true, ...detail }); }
  catch (error) { failures.push({ name, message: error.stack }); console.log(`FAIL ${name}: ${error.message}`); }
}

try {
  if (process.env.SUMMARY_QA_FOCUS !== '1') for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const context = await testContext({ viewport, colorScheme: 'light', locale: 'zh-TW' });
    const page = await context.newPage();
    for (const [index, entry] of manifest.diagrams.entries()) {
      await attempt(`${viewport.width}/${entry.code}`, async () => {
        const frame = await goto(page, entry.code);
        const section = page.locator(`[data-unit-summary="${entry.code}"]`);
        const metrics = await metric(frame);
        assert(metrics.font >= 13.9, `primary label is ${metrics.font}px`);
        assert(metrics.bodyHeight <= metrics.viewportHeight + 1, 'nested page vertical scrollbar');
        const layout = await section.evaluate((section) => {
          const children = [...section.parentElement.children];
          return { summary: children.indexOf(section), knowledge: children.findIndex((el) => [...el.querySelectorAll('h3')].some((h) => h.textContent.includes('重點知識解析與圖表'))), pageWidth: document.documentElement.scrollWidth, viewport: innerWidth };
        });
        assert.equal(layout.summary, 1);
        assert(layout.knowledge > layout.summary);
        assert(layout.pageWidth <= layout.viewport, 'host page horizontal overflow');
        await page.locator('.study-toc__item').first().waitFor({ state: 'attached' });
        assert.equal(await page.locator('.study-toc__item').first().textContent(), '單元總結・互動關聯圖');
        if (entry.code === 'M13201') await shot(section, `graph-${viewport.width}.png`);
        const data = JSON.parse(await fs.readFile(new URL(`${entry.code}.reader.json`, assetRoot), 'utf8'));
        await section.getByRole('tab', { name: '文字導讀', exact: true }).click();
        const detail = section.locator('.unit-summary-reader__detail');
        await detail.locator('h3').waitFor();
        assert.equal(await detail.locator('h3').textContent(), data.nodes[0].label);
        assert.equal(await section.locator('select option').count(), data.nodes.length);
        const reader = await section.locator('.unit-summary-reader').evaluate((el) => ({ font: parseFloat(getComputedStyle(el).fontSize), width: el.scrollWidth, box: el.clientWidth }));
        assert(reader.font >= 18);
        assert(reader.width <= reader.box + 1, 'reader horizontal overflow');
        if (entry.code === 'M13201') await shot(section, `reader-${viewport.width}.png`);
        const last = data.nodes.at(-1);
        await section.getByRole('combobox', { name: '選擇本章概念' }).selectOption(last.id);
        assert.equal(await detail.locator('h3').textContent(), last.label);
        await detail.getByRole('button', { name: '在互動圖中定位', exact: true }).click();
        await frame.locator(`[data-node-id="${last.id}"][aria-pressed="true"]`).waitFor({ state: 'attached', timeout: 5000 });
        const positioned = await frame.locator(`[data-node-id="${last.id}"] text[data-node-label]`).evaluate((text) => {
          const rect = text.getBoundingClientRect(), canvas = text.closest('.diagram-container').getBoundingClientRect();
          return { x: rect.x, right: rect.right, y: rect.y, bottom: rect.bottom, canvas: canvas.toJSON() };
        });
        assert(positioned.right > positioned.canvas.left && positioned.x < positioned.canvas.right, 'located concept is outside canvas');
        return { font: +metrics.font.toFixed(2), scale: metrics.scale, nodes: data.nodes.length, relations: data.relations.length };
      });
      if ((index + 1) % 6 === 0) console.log(`Checked ${viewport.width}: ${index + 1}/23`);
    }
    await context.close();
  }
  await attempt('controls-preferences-fullscreen-theme', async () => {
    console.log('Checking zoom, preferences, fullscreen and theme');
    const context = await testContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    let frame = await goto(page, 'M13201');
    await page.getByRole('button', { name: '顯示完整關聯圖', exact: true }).click();
    await frame.locator('html[data-study-mode="overview"]').waitFor();
    const overview = await metric(frame);
    assert.equal(overview.scale, 1);
    assert(overview.svg.width <= overview.canvas.width + 1, 'overview does not fit width');
    assert(overview.svg.height <= overview.canvas.height + 1, 'overview does not fit height');
    frame = await goto(page, 'M11101');
    assert.equal((await metric(frame)).mode, 'overview', 'overview preference not restored');
    await page.getByRole('button', { name: '自動放大節點文字', exact: true }).click();
    await frame.locator('html[data-study-mode="readable"]').waitFor();
    const readable = await metric(frame);
    assert(readable.font >= 13.9);
    await page.getByRole('button', { name: '放大互動圖與文字', exact: true }).click();
    await page.waitForFunction((before) => Number(document.querySelector('output').textContent.replace('%', '')) > before, readable.scale * 100);
    const larger = await metric(frame);
    assert(larger.scale > readable.scale);
    await page.getByRole('button', { name: '縮小互動圖與文字', exact: true }).click();
    await page.waitForFunction((value) => document.querySelector('output').textContent === value, `${readable.scale * 100}%`);
    for (let step = readable.scale; step < 3; step += .25) {
      await page.getByRole('button', { name: '放大互動圖與文字', exact: true }).click();
      await page.waitForFunction((value) => document.querySelector('output').textContent === value, `${(step + .25) * 100}%`);
    }
    assert(await page.getByRole('button', { name: '放大互動圖與文字', exact: true }).isDisabled());
    for (let step = 3; step > .25; step -= .25) {
      await page.getByRole('button', { name: '縮小互動圖與文字', exact: true }).click();
      await page.waitForFunction((value) => document.querySelector('output').textContent === value, `${(step - .25) * 100}%`);
    }
    assert(await page.getByRole('button', { name: '縮小互動圖與文字', exact: true }).isDisabled());
    await page.getByRole('button', { name: '自動放大節點文字', exact: true }).click();
    await page.getByRole('tab', { name: '文字導讀', exact: true }).click();
    await page.locator('.unit-summary-reader__detail h3').waitFor();
    await page.getByRole('button', { name: '加大文字', exact: true }).click();
    frame = await goto(page, 'M11102');
    await page.getByRole('tab', { name: '文字導讀', exact: true }).click();
    await page.locator('.unit-summary-reader__detail h3').waitFor();
    assert.equal(await page.locator('.unit-summary-reader').evaluate((el) => getComputedStyle(el).fontSize), '16px');
    await page.getByRole('button', { name: '加大文字', exact: true }).click();
    await page.getByRole('tab', { name: '文字導讀', exact: true }).press('ArrowLeft');
    assert.equal(await page.getByRole('tab', { name: '互動圖', exact: true }).getAttribute('aria-selected'), 'true');
    await page.getByRole('button', { name: '全螢幕閱讀互動總結', exact: true }).click();
    await page.waitForFunction(() => !!document.fullscreenElement);
    await shot(page, 'fullscreen.png');
    await page.getByRole('button', { name: '離開全螢幕閱讀', exact: true }).click();
    await page.waitForFunction(() => !document.fullscreenElement);
    await page.getByRole('button', { name: '🌙', exact: true }).click();
    await frame.locator('html[data-theme="dark"]').waitFor();
    await context.close();
    return { overview: overview.scale, readable: readable.scale, zoomed: larger.scale };
  });
  for (const failure of ['http', 'bridge', 'timeout']) {
    await attempt(`recovery-${failure}`, async () => {
      console.log(`Checking recovery: ${failure}`);
      const context = await testContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      let requests = 0, stalled;
      await page.route('**/unit-summaries/M11101.html', async (route) => {
        requests++;
        if (requests > 1) return route.continue();
        if (failure === 'http') return route.fulfill({ status: 503, body: 'Unavailable' });
        if (failure === 'bridge') return route.fulfill({ contentType: 'text/html', body: '<html><body>Incomplete diagram</body></html>' });
        stalled = route;
      });
      await page.goto(`${base}/#/topic/M11101`);
      await page.getByRole('button', { name: '重新載入互動圖', exact: true }).waitFor({ timeout: 25000 });
      assert(await page.getByRole('button', { name: '放大互動圖與文字', exact: true }).isDisabled());
      await page.getByRole('tab', { name: '文字導讀', exact: true }).click();
      await page.locator('.unit-summary-reader__detail h3').waitFor();
      await page.getByRole('tab', { name: '互動圖', exact: true }).click();
      await page.getByRole('button', { name: '重新載入互動圖', exact: true }).click();
      await ready(page, 'M11101');
      // A newly activated worker can satisfy the retry from its valid precache.
      assert(requests >= 1, 'the injected failure was not exercised');
      if (stalled) await stalled.abort().catch(() => {});
      await context.close();
      return { requests };
    });
  }
  await attempt('legacy-isa95', async () => {
    const context = await testContext(); const page = await context.newPage();
    await goto(page, 'M12101');
    const selector = 'iframe[title="ISA-95 五層架構與智慧工廠關聯互動圖"]';
    await page.locator('.study-toc__item').first().waitFor({ state: 'attached' });
    await page.locator(`${selector}[data-diagram-source]`).waitFor({ state: 'attached' });
    await page.locator(selector).scrollIntoViewIfNeeded();
    await page.locator(`${selector}[data-diagram-state="ready"]`).waitFor({ timeout: 15000 });
    const frame = page.frameLocator(selector);
    assert.equal(await frame.locator('html').getAttribute('data-study-viewer'), null);
    assert(await frame.getByRole('button', { name: '放大', exact: true }).isVisible());
    await context.close();
  });
  await attempt('rapid-navigation', async () => {
    const context = await testContext(); const page = await context.newPage();
    let requested;
    const requestSeen = new Promise((resolve) => { requested = resolve; });
    await page.route('**/unit-summaries/M11101.html', async (route) => {
      requested();
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.continue().catch(() => {});
    });
    await page.goto(`${base}/#/topic/M11101`);
    await requestSeen;
    await goto(page, 'M11102');
    assert.equal(await page.locator('[data-unit-summary]').count(), 1);
    assert.equal(await page.locator('[data-unit-summary]').getAttribute('data-unit-summary'), 'M11102');
    await context.close();
  });
  await attempt('touch-pan', async () => {
    const context = await testContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage(); const frame = await goto(page, 'M13201');
    await page.locator('.unit-summary__figure').scrollIntoViewIfNeeded();
    const canvas = frame.locator('.diagram-container');
    const box = await canvas.boundingBox();
    const point = await canvas.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      for (const y of [.4, .55, .65]) for (const x of [.25, .5, .75]) {
        const target = document.elementFromPoint(rect.x + rect.width * x, rect.y + rect.height * y);
        if (target && !target.closest('[data-node-id], button, .diagram-nav')) return { x: rect.width * x, y: rect.height * y };
      }
    });
    assert(point, 'no panning surface');
    const before = await frame.locator('body').evaluate(() => window.Archify.view.state());
    const scrollBefore = await page.evaluate(() => window.scrollY);
    const session = await context.newCDPSession(page);
    const origin = { x: box.x + point.x, y: box.y + point.y };
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] });
    for (let index = 1; index <= 5; index++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: origin.x - index * 12, y: origin.y - index * 8 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const after = await frame.locator('body').evaluate(() => window.Archify.view.state());
    assert(before.x !== after.x || before.y !== after.y, 'touch drag did not move the map');
    assert(Math.abs(await page.evaluate(() => window.scrollY) - scrollBefore) < 2, 'map touch unexpectedly scrolls the lesson');
    await context.close();
    return { before, after };
  });
  if (process.env.SUMMARY_QA_OFFLINE === '1') await attempt('offline-unvisited-units', async () => {
    console.log('Checking production service worker and offline reading');
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await goto(page, 'M11101');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.reload();
    await ready(page, 'M11101');
    for (const code of ['M13201', 'M22301']) {
      await goto(page, code);
      await page.getByRole('tab', { name: '文字導讀', exact: true }).click();
      await page.locator('.unit-summary-reader__detail h3').waitFor();
    }
    await shot(page, 'offline-mobile.png');
    await context.close();
    return { units: ['M11101', 'M13201', 'M22301'] };
  });
  assert.equal(errors.length, 0, JSON.stringify(errors));
} catch (error) { failures.push({ name: 'global', message: error.stack }); }
finally {
  await browser.close();
  const report = { base, date: new Date().toISOString(), passed: results.length, failures, errors, results };
  await fs.writeFile(new URL('verification.json', folder), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify({ passed: results.length, failures: failures.map(({ name, message }) => ({ name, message: message.split('\n')[0] })), errors }, null, 2));
  if (failures.length) process.exitCode = 1;
}
