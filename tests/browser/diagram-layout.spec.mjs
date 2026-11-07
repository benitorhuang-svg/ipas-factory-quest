import { test, expect } from '@playwright/test';
import { ready, go } from './helpers.mjs';

async function expectCompleteDiagram(figure) {
  await figure.scrollIntoViewIfNeeded();
  const geometry = await figure.evaluate(figure => {
    const viewport = figure.querySelector('.diagram-viewport');
    const svg = figure.querySelector('svg');
    const graphic = svg.getBoundingClientRect(), frame = viewport.getBoundingClientRect();
    return {
      overflow: viewport.scrollWidth - viewport.clientWidth,
      left: graphic.left - frame.left, right: frame.right - graphic.right,
      width: graphic.width,
      labelOverflow: Math.max(0, ...[...svg.querySelectorAll('.node foreignObject')].map(label => {
        const text = label.querySelector('p');
        return text ? text.getBoundingClientRect().height - label.getBoundingClientRect().height : 0;
      })),
    };
  });
  expect(geometry.width).toBeGreaterThan(0);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeGreaterThanOrEqual(-1);
  expect(geometry.labelOverflow).toBeLessThanOrEqual(1);
}

for (const width of [390, 1200, 1440, 1920]) {
  test(`quality-cost diagram uses available space and retains full-size reading at ${width}px`, async ({ page }, info) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 960 });
    await ready(page); await go(page, 'guide/materials/M11202');
    await expect(page.locator('.study-diagram svg')).toHaveCount(4);
    const figure = page.locator('.study-diagram').first();
    const diagram = figure.locator('svg');
    const originalID = await diagram.getAttribute('id');
    for (const label of ['預防成本', '鑑定成本', '內部失敗成本', '外部失敗成本']) {
      await expect(diagram).toContainText(label);
    }
    if (width >= 1200) {
      const geometry = await page.evaluate(() => {
        const bounds = selector => document.querySelector(selector).getBoundingClientRect();
        return { workspace: bounds('.workspace').width, reader: bounds('.reading-page').width,
          article: bounds('.reader-article').width, outline: bounds('.reader-tools').width };
      });
      expect(geometry.workspace - geometry.reader).toBeLessThanOrEqual(65);
      expect(geometry.article).toBeGreaterThan(width >= 1600 ? geometry.reader - 225 : geometry.reader - 1);
    }
    for (const item of await page.locator('.study-diagram').all()) await expectCompleteDiagram(item);
    await expectCompleteDiagram(figure);
    await page.screenshot({ path: info.outputPath(`quality-cost-${width}.png`) });
    const inlineWidth = (await diagram.boundingBox()).width;
    const trigger = figure.getByRole('button', { name: '放大閱讀' });
    await trigger.click();
    const enlarged = page.locator('.diagram-dialog[open] svg');
    await expect(enlarged).toBeVisible();
    const naturalWidth = await enlarged.evaluate(svg => parseFloat(svg.style.getPropertyValue('--diagram-width')));
    expect(Math.abs((await enlarged.boundingBox()).width - naturalWidth)).toBeLessThan(1);
    expect((await enlarged.boundingBox()).width).toBeGreaterThanOrEqual(inlineWidth - 1);
    await expect(page.locator('svg[id="' + originalID + '"]')).toHaveCount(1);
    await expect(page.getByRole('region', { name: '放大圖解，可橫向與縱向捲動' })).toHaveAttribute('tabindex', '0');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(diagram).toHaveAttribute('id', originalID);
    await expectCompleteDiagram(figure);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('diagram adapts when the desktop sidebar expands and the viewport changes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await ready(page); await go(page, 'guide/materials/M11202');
  const figure = page.locator('.study-diagram').first();
  await expect(figure.locator('svg')).toBeVisible();
  await expectCompleteDiagram(figure);
  await page.locator('.sidebar').hover();
  await expect.poll(() => page.locator('.sidebar').evaluate(node => Math.round(node.getBoundingClientRect().width))).toBe(216);
  await expectCompleteDiagram(figure);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectCompleteDiagram(figure);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expectCompleteDiagram(figure);
});
