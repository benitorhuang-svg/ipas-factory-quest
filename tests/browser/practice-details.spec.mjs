import { test, expect } from '@playwright/test';
import { ready, go, state } from './helpers.mjs';

test.beforeEach(async ({ request }) => { await request.post('/__release?v=A'); });
for (const width of [390, 1440]) test(`per-question counts, results and filters at ${width}px`, async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(() => {
    if (localStorage.getItem('factory-quest-ipas-v1')) return;
    const entry = (attempts, correctCount, lastCorrect, lastSeen) => ({ attempts, correctCount, lastCorrect, lastSeen, dueAt: 0 });
    localStorage.setItem('factory-quest-ipas-v1', JSON.stringify({
      version: 1, earnedCorrectIds: ['L111-01', 'L111-02', 'L111-B09'], passedUnits: [], best: {}, history: [], studyDates: [], active: null,
      ledger: { 'L111-01': entry(3, 2, false, 3), 'L111-02': entry(2, 2, true, 2), 'L111-B05': entry(1, 1, true, 4), 'L111-B09': entry(4, 3, false, 5) },
    }));
  });
  await ready(page); await go(page, 'progress');
  const before = await state(page);
  await expect(page.locator('[data-stat=practiced]')).toContainText('3／416 題');
  await expect(page.locator('[data-stat=attempts]')).toContainText('9次');
  await expect(page.locator('.practice-question-card')).toHaveCount(20);
  await expect(page.locator('#practice-detail-count')).toHaveText('顯示 1–20／416 題');
  await expect(page.locator('[data-action=practice-page]').first()).toBeDisabled();
  await page.getByRole('button', { name: '下一頁', exact: true }).click();
  await expect(page.locator('#practice-detail-count')).toHaveText('顯示 21–40／416 題');
  const firstOnPage = await page.locator('.practice-question-card').first().getAttribute('data-practice-question');
  await page.reload();
  await expect(page.locator('.practice-question-card').first()).toHaveAttribute('data-practice-question', firstOnPage);
  const search = page.getByLabel('搜尋題目', { exact: true });
  const status = page.getByLabel('作答狀態', { exact: true });
  await search.fill('L111-01');
  await expect(page.locator('.practice-question-card')).toHaveCount(1);
  await expect(page.locator('[data-practice-question="L111-01"] dd')).toHaveText(['3 次', '2 次', '1 次', '最近答錯']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.locator('.practice-details').screenshot({ path: info.outputPath(`question-details-${width}.png`), animations: 'disabled' });
  await search.fill('l111-b09');
  await expect(page.locator('[data-practice-question="L111-B01"] dd')).toHaveText(['4 次', '3 次', '1 次', '最近答錯']);
  await expect(page.locator('.practice-question-card')).toHaveCount(1);
  await search.fill('');
  await status.selectOption('practiced');
  await expect(page.locator('.practice-question-card')).toHaveCount(3);
  await status.selectOption('wrong');
  await expect(page.locator('.practice-question-card')).toHaveCount(2);
  await status.selectOption('correct');
  await expect(page.locator('[data-practice-question="L111-02"] dd')).toHaveText(['2 次', '2 次', '0 次', '最近答對']);
  await expect(page.locator('.practice-question-card')).toHaveCount(1);
  await status.selectOption('unseen');
  await expect(page.locator('#practice-detail-count')).toHaveText('顯示 1–20／413 題');
  await expect(page.locator('.practice-question-card').first().locator('dd')).toHaveText(['0 次', '0 次', '0 次', '未練習']);
  await status.selectOption('practiced');
  await page.getByLabel('單元', { exact: true }).selectOption('L121');
  await expect(page.locator('.practice-question-card')).toHaveCount(0);
  await expect(page.locator('#practice-detail-count')).toHaveText('找不到符合條件的題目');
  await page.getByRole('button', { name: '清除篩選', exact: true }).first().click();
  await expect(search).toBeFocused();
  const stemWord = await page.evaluate(() => window.FACTORY_QUEST_DATA.questions.find(q => q.id === 'L111-01').stem.slice(0, 8));
  await search.fill(stemWord);
  await expect(page.locator('[data-practice-question="L111-01"]')).toBeVisible();
  await search.fill('<img data-probe src=x>');
  await expect(page.locator('[data-probe]')).toHaveCount(0);
  await expect(page.locator('.practice-question-card')).toHaveCount(0);
  expect(await state(page)).toEqual(before);
  expect(errors).toEqual([]);
});
