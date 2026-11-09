import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ready, go, state, start } from './helpers.mjs';

test.beforeEach(async ({ request }) => { await request.post('/__release?v=A'); });

async function choose(page, id) {
  await go(page, 'progress');
  await page.getByLabel('搜尋題目', { exact: true }).fill(id);
  return page.locator(`[data-practice-question="${id}"] [data-action=practice-start]`);
}
async function answer(page, correct = true) {
  const question = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('factory-quest-ipas-v1'));
    return window.FACTORY_QUEST_DATA.questions.find(q => q.id === saved.active.questionIds[0]);
  });
  if (question.kind === 'number') await page.locator(`[data-answer="${question.id}"]`).fill(String(question.answer));
  else await page.locator(`[data-answer="${question.id}"][value="${correct ? question.answer : (question.answer + 1) % 4}"]`).check();
  await page.locator('#submit-run').click();
  await expect(page.locator('.explanation-card')).toBeVisible();
}

for (const width of [390, 1440]) test(`start an unseen question and update its counts at ${width}px`, async ({ page, context, browserName }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 950 });
  await ready(page);
  if (browserName === 'chromium') { await context.setOffline(true); await page.reload(); }
  const button = await choose(page, 'L111-B27');
  await page.getByLabel('單元', { exact: true }).selectOption('L111');
  await page.getByLabel('作答狀態', { exact: true }).selectOption('unseen');
  await expect(button).toContainText('開始作答');
  await page.locator('.practice-details').screenshot({ path: info.outputPath(`single-question-entry-${width}.png`) });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.question-card')).toHaveCount(1);
  await expect(page.locator('.quiz-top h1')).toHaveText('單題練習');
  await expect(page.locator('.quiz-top')).not.toContainText('5題快練');
  const initial = await state(page);
  expect(initial.active.questionIds).toEqual(['L111-B27']);
  expect(initial.active.mode).toBe('quick');
  expect(initial.ledger['L111-B27']).toBeUndefined();
  await page.reload();
  await expect(page.locator('#question-L111-B27')).toBeVisible();
  expect((await state(page)).active.id).toBe(initial.active.id);
  await answer(page);
  const after = await state(page);
  expect(after.ledger['L111-B27']).toMatchObject({ attempts: 1, correctCount: 1, lastCorrect: true });
  expect(after.xp).toBe(10);
  expect(after.passedUnits).toEqual([]);
  expect(after.best).toEqual({});
  await page.getByRole('link', { name: '回到練習明細', exact: true }).click();
  await expect(page.getByLabel('搜尋題目', { exact: true })).toHaveValue('L111-B27');
  await expect(page.getByLabel('單元', { exact: true })).toHaveValue('L111');
  await expect(page.getByLabel('作答狀態', { exact: true })).toHaveValue('unseen');
  await expect(page.locator('.practice-question-card')).toHaveCount(0);
  await page.getByLabel('作答狀態', { exact: true }).selectOption('all');
  await expect(page.locator('[data-practice-question="L111-B27"] dd')).toHaveText(['1 次', '1 次', '0 次', '最近答對']);
  await expect(button).toContainText('再次練習');
  await button.click(); await answer(page, false);
  expect((await state(page)).ledger['L111-B27']).toMatchObject({ attempts: 2, correctCount: 1, lastCorrect: false });
  expect((await state(page)).xp).toBe(10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
});

test('single-question choice preserves a draft until the user replaces it', async ({ page }) => {
  await ready(page); await start(page);
  await page.locator('input[type=radio]').first().check();
  const before = await state(page);
  const button = await choose(page, 'L111-B27');
  await button.click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  expect(await state(page)).toEqual(before);
  await page.locator('dialog [data-action=close]').click();
  expect(await state(page)).toEqual(before);
  await button.click();
  await page.locator('dialog [data-action=resume]').click();
  await expect(page.locator('.question-card')).toHaveCount(10);
  expect((await state(page)).active).toEqual(before.active);
  const again = await choose(page, 'L111-B27');
  await again.click();
  await page.locator('dialog [data-action=force-start]').click();
  await expect(page.locator('.question-card')).toHaveCount(1);
  const after = await state(page);
  expect(after.active.questionIds).toEqual(['L111-B27']);
  expect(after.active.id).not.toBe(before.active.id);
  expect(after.history).toEqual(before.history);
  expect(after.ledger).toEqual(before.ledger);
});

test('local file entry supports numeric single-question grading and return', async ({ page }) => {
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '#/progress');
  const button = await choose(page, 'L111-18');
  await button.click();
  await expect(page.locator('.question-card')).toHaveCount(1);
  await answer(page);
  await page.reload();
  await expect(page.locator('.feedback-card.right')).toHaveCount(1);
  await page.getByRole('link', { name: '回到練習明細', exact: true }).click();
  await expect(page.locator('[data-practice-question="L111-18"] dd')).toHaveText(['1 次', '1 次', '0 次', '最近答對']);
});
