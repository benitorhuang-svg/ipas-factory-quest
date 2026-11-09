import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { ready, key } from './helpers.mjs';
const revision = createRequire(import.meta.url)('../../dist/engine.js').questionRevision;

test.beforeEach(async ({ request }) => { await request.post('/__release?v=A'); });

for (const width of [390, 1440]) test(`EDD and SPT Gantt comparison at ${width}px`, async ({ page, context, browserName }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 950 });
  await page.addInitScript(({ key, revision }) => {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, JSON.stringify({
      version: 1, questionRevision: revision, earnedCorrectIds: [], passedUnits: [], best: {}, history: [], studyDates: [], ledger: {},
      active: { id: 'scheduling-browser', mode: 'quick', unitId: 'L111', questionIds: ['L111-B26'], answers: {}, startedAt: Date.now() },
    }));
  }, { key, revision });
  await ready(page);
  // The result and its diagrams must also render when first opened offline.
  if (browserName === 'chromium') { await context.setOffline(true); await page.reload(); }
  await page.locator('[data-action=resume]').click();
  await page.locator('input[data-answer="L111-B26"][value="1"]').check();
  await page.locator('#submit-run').click();
  const comparison = page.locator('.expl-schedule');
  await expect(comparison).toBeVisible();
  await expect(comparison.locator('.gantt-maximum strong')).toHaveText(['2 小時', '4 小時']);
  await expect(comparison.locator('[role=img]')).toHaveCount(2);
  await expect(comparison.locator('[role=img]').first()).toHaveAccessibleName(/甲：第 0 至 6 小時加工，逾期 2 小時；乙：第 6 至 8 小時加工，提早 2 小時/);
  await expect(comparison.locator('.gantt-calculations').first()).toContainText('8 − 10 ＝ −2');
  await expect(comparison.locator('.gantt-calculations').last()).toContainText('2 − 10 ＝ −8');
  await expect(comparison.locator('.gantt-takeaway')).toContainText('最大延遲不可能低於 2 小時');
  const cards = await comparison.locator('.gantt-card').all();
  const first = await cards[0].boundingBox(), second = await cards[1].boundingBox();
  if (width < 760) expect(second.y).toBeGreaterThan(first.y + first.height);
  else expect(second.x).toBeGreaterThan(first.x + first.width);
  for (const card of cards) expect(await card.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await comparison.screenshot({ path: info.outputPath(`scheduling-${width}.png`) });
  await page.reload();
  await expect(page.locator('.gantt-maximum strong')).toHaveText(['2 小時', '4 小時']);
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) test(`CR time coverage diagram at ${width}px`, async ({ page, context, browserName }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 950 });
  await page.addInitScript(({ key, revision }) => {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, JSON.stringify({
      version: 1, questionRevision: revision, earnedCorrectIds: [], passedUnits: [], best: {}, history: [], studyDates: [], ledger: {},
      active: { id: 'cr-browser', mode: 'quick', unitId: 'L111', questionIds: ['L111-B27'], answers: {}, startedAt: Date.now() },
    }));
  }, { key, revision });
  await ready(page);
  if (browserName === 'chromium') { await context.setOffline(true); await page.reload(); }
  await page.locator('[data-action=resume]').click();
  await page.locator('input[data-answer="L111-B27"][value="1"]').check();
  await page.locator('#submit-run').click();
  const diagram = page.locator('.expl-cr');
  await expect(diagram).toBeVisible();
  await expect(diagram.locator('.cr-formula strong')).toHaveText('8 ÷ 10 ＝ 0.8');
  await expect(diagram.locator('.cr-verdict strong')).toHaveText('時間不足 2 小時');
  await expect(diagram.locator('.cr-shortage')).toHaveText('＋2');
  await expect(diagram.locator('[role=img]')).toHaveAccessibleName('距交期剩 8 小時，剩餘加工需 10 小時；時間不足 2 小時');
  await expect(diagram.locator('.cr-guide strong')).toHaveText(['CR ＜ 1', 'CR ＝ 1', 'CR ＞ 1']);
  const available = await diagram.locator('.cr-available').boundingBox();
  const needed = await diagram.locator('.cr-required').boundingBox();
  const shortage = await diagram.locator('.cr-shortage').boundingBox();
  expect(Math.abs(available.width - needed.width)).toBeLessThan(1);
  expect(Math.abs(needed.width / shortage.width - 4)).toBeLessThan(0.05);
  expect(await diagram.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await diagram.screenshot({ path: info.outputPath(`cr-${width}.png`) });
  await page.reload();
  await expect(page.locator('.cr-verdict strong')).toHaveText('時間不足 2 小時');
  expect(errors).toEqual([]);
});
