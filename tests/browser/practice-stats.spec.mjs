import { test, expect } from '@playwright/test';
import { ready, go, start, state } from './helpers.mjs';

test.beforeEach(async ({ request }) => { await request.post('/__release?v=A'); });
for (const width of [390, 1440]) test(`practice statistics count submitted answers at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  await ready(page);
  await expect(page.locator('[data-stat=practiced]')).toContainText('0 / 416 題');
  await expect(page.locator('[data-stat=attempts]')).toContainText('0 次');
  await start(page);
  const first = (await state(page)).active.questionIds;
  const answers = await page.evaluate(() => Object.fromEntries(window.FACTORY_QUEST_DATA.questions.map(q => [q.id, q.answer])));
  for (const id of first) {
    const radios = page.locator(`input[type=radio][data-answer="${id}"]`);
    if (await radios.count()) await page.locator(`[data-answer="${id}"][value="${answers[id]}"]`).check();
    else await page.locator(`[data-answer="${id}"]`).fill(String(answers[id]));
  }
  await go(page, 'home');
  await expect(page.locator('[data-stat=attempts]')).toContainText('0 次');
  await page.locator('[data-action=resume]').click();
  await page.locator('#submit-run').click();
  await expect(page.locator('.result-hero')).toBeVisible();
  await go(page, 'home');
  await expect(page.locator('[data-stat=practiced]')).toContainText('10 / 416 題');
  await expect(page.locator('[data-stat=attempts]')).toContainText('10 次');
  await page.screenshot({ path: info.outputPath(`practice-dashboard-${width}.png`), animations: 'disabled' });
  await go(page, 'progress');
  await expect(page.locator('[data-stat=practiced]')).toContainText('10／416 題');
  await expect(page.locator('[data-stat=attempts]')).toContainText('10次');
  await expect(page.locator('[data-stat=unseen]')).toContainText('406題');
  await page.getByLabel('作答狀態', { exact: true }).selectOption('practiced');
  await expect(page.locator('.practice-question-card')).toHaveCount(10);
  for (const id of first) await expect(page.locator(`[data-practice-question="${id}"] dd`)).toHaveText(['1 次', '1 次', '0 次', '最近答對']);
  await page.locator('.practice-breakdown summary').click();
  const row = page.locator('.practice-breakdown tbody tr').first();
  await expect(row).toContainText('10／');
  await expect(row.locator('td').last()).toHaveText('10 次');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath(`practice-progress-${width}.png`), animations: 'disabled' });
  await page.reload();
  await expect(page.locator('[data-stat=attempts]')).toContainText('10次');
  expect((await state(page)).history).toHaveLength(1);
});
