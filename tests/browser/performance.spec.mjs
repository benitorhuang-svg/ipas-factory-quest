import { test, expect } from '@playwright/test';
import { ready, go } from './helpers.mjs';

test.beforeEach(async ({ request }) => { await request.post('/__release?v=A'); });

test('reader uses static diagrams, prebuilt math and previews without downloading renderer engines', async ({ page }, info) => {
  const engines = [], errors = [];
  page.on('request', request => { if (/\/(?:mermaid|katex)\.min\.js/.test(request.url())) engines.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page); await go(page, 'guide/materials/M11101');
  await expect(page.locator('.study-diagram svg')).toHaveCount(5);
  await expect(page.locator('.katex').first()).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-katex-ready', 'true');
  expect(await page.evaluate(() => !!window.mermaid || !!window.katex)).toBe(false);
  const graphics = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('.study-diagram svg [id], .study-diagram svg[id]')].map(node => node.id);
    const references = [...document.querySelectorAll('.study-diagram svg *')].flatMap(node => [...node.attributes].flatMap(attribute => [...attribute.value.matchAll(/url\(#([^)'"\s]+)\)/g)].map(match => match[1])));
    return { count: ids.length, unique: new Set(ids).size, missing: references.filter(id => !document.getElementById(id)) };
  });
  expect(graphics.count).toBeGreaterThan(20); expect(graphics.unique).toBe(graphics.count); expect(graphics.missing).toEqual([]);
  const diagram = page.locator('.diagram-toolbar button').first();
  await diagram.click(); await expect(page.locator('.diagram-dialog[open] svg')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(diagram).toBeFocused();
  const preview = page.locator('.reader-image-button').first();
  await expect(preview.locator('img')).toHaveAttribute('src', /previews\/.*\.webp/);
  await preview.evaluate(node => node.scrollIntoView({ block: 'center' }));
  await preview.click(); await expect(page.locator('dialog[open] img')).toHaveAttribute('src', /learning-units\/.*\.png/);
  await page.keyboard.press('Escape'); await expect(preview).toBeFocused();
  await go(page, 'home'); await go(page, 'guide/materials/M11101');
  await expect(page.locator('.study-diagram svg')).toHaveCount(5);
  expect(engines).toEqual([]); expect(errors).toEqual([]);
  await page.screenshot({ path: info.outputPath('prebuilt-reader.png'), fullPage: false, animations: 'disabled' });
  await page.locator('.study-diagram').first().evaluate(node => node.scrollIntoView({ block: 'center' }));
  await page.locator('.study-diagram').first().screenshot({ path: info.outputPath('prebuilt-diagram.png'), animations: 'disabled' });
});

test.describe('static graphic network fallback', () => {
test.use({ serviceWorkers: 'block' });
test('a failed static graphic falls back to Mermaid and can retry the static asset later', async ({ page }) => {
  let failures = 0;
  await page.route('**/assets/diagrams/*.svg', async route => {
    if (failures++ === 0) await route.abort(); else await route.continue();
  });
  // Browser routing cannot intercept requests owned by a Service Worker.
  // This case isolates renderer recovery; native offline behavior is in pwa.spec.
  await page.goto('./'); await expect(page.locator('.dashboard-unit').first()).toBeVisible();
  await go(page, 'guide/materials/M11101');
  await expect(page.locator('.study-diagram svg')).toHaveCount(5);
  expect(await page.evaluate(() => !!window.mermaid)).toBe(true);
  await expect(page.locator('.study-diagram svg[data-prebuilt-diagram]')).toHaveCount(4);
  await expect(page.locator('.diagram-error')).toHaveCount(0);
  await go(page, 'home'); await go(page, 'guide/materials/M11101');
  await expect(page.locator('.study-diagram svg[data-prebuilt-diagram]')).toHaveCount(5);
});
});

test('reader survives slow networking without the previous renderer timeout', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP bandwidth and CPU throttling are Chromium-only.');
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 120, downloadThroughput: 1600 * 1000 / 8, uploadThroughput: 1600 * 1000 / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('./#/guide/materials/M11101');
  await expect(page.locator('.study-diagram svg')).toHaveCount(5, { timeout: 45000 });
  await expect(page.locator('.katex').first()).toBeVisible();
  await expect(page.locator('.diagram-error')).toHaveCount(0);
});

test('contained reading sections preserve paragraph jumps and same-tab resume', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page); await go(page, 'guide/materials/M11101');
  await expect(page.locator('.study-diagram svg')).toHaveCount(5);
  await page.locator('.reader-sections').evaluate(node => { node.open = true; });
  const paragraph = page.locator('.reader-outline button').nth(3);
  const target = await paragraph.getAttribute('data-target');
  await paragraph.click();
  await expect(paragraph).toHaveAttribute('aria-current', 'location');
  const aligned = () => page.locator('#' + target).evaluate(node => {
    const top = node.getBoundingClientRect().top;
    return top >= 0 && top < 180;
  });
  await expect.poll(aligned).toBe(true);
  await go(page, 'home'); await expect(page.locator('.dashboard-unit').first()).toBeVisible();
  await go(page, 'guide/materials/M11101');
  await expect(page.locator('.study-diagram svg')).toHaveCount(5);
  await expect.poll(aligned).toBe(true);
  await expect(page.locator('.reader-outline button').nth(3)).toHaveAttribute('aria-current', 'location');
});
