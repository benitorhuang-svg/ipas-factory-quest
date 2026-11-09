import { test, expect } from '@playwright/test';
import { ready, go, state, start, key } from './helpers.mjs';

test.beforeEach(async ({ request }) => { await request.post('/__release?v=A'); });

for (const width of [390, 1440]) test(`unseen card starts batches and keeps submitted progress at ${width}px`, async ({ page, context, browserName }, info) => {
  await page.setViewportSize({ width, height: 950 });
  await ready(page);
  if (browserName === 'chromium') { await context.setOffline(true); await page.reload(); }
  await go(page, 'progress');
  const card = page.getByRole('button', { name: /尚未練習題目/ });
  await expect(card).toContainText('每次最多 10 題');
  await card.focus();
  await page.screenshot({ path: info.outputPath(`unseen-entry-${width}.png`), animations: 'disabled' });
  await page.keyboard.press('Enter');
  await expect(page.locator('.question-card')).toHaveCount(10);
  await expect(page.locator('.quiz-top h1')).toHaveText('未練題目練習');
  const initial = await state(page);
  expect(initial.active.mode).toBe('unseen');
  expect(initial.ledger).toEqual({});
  await page.reload();
  await expect(page.locator('.question-card')).toHaveCount(10);
  expect((await state(page)).active).toEqual(initial.active);
  const answers = await page.evaluate(() => Object.fromEntries(window.FACTORY_QUEST_DATA.questions.map(q => [q.id, q.answer])));
  for (const id of initial.active.questionIds) {
    const radios = page.locator(`input[type=radio][data-answer="${id}"]`);
    if (await radios.count()) await page.locator(`[data-answer="${id}"][value="${answers[id]}"]`).check();
    else await page.locator(`[data-answer="${id}"]`).fill(String(answers[id]));
  }
  await page.locator('#submit-run').click();
  await expect(page.locator('.result-hero')).toBeVisible();
  await page.reload();
  await expect(page.locator('.result-hero')).toContainText('未練題目練習');
  expect((await state(page)).xp).toBe(100);
  await page.getByRole('link', { name: '回到成長紀錄', exact: true }).click();
  await expect(card).toContainText('406題');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await go(page, 'result/' + initial.active.id);
  await page.getByRole('button', { name: '繼續練習未練題目', exact: true }).click();
  await expect(page.locator('.question-card')).toHaveCount(10);
  expect((await state(page)).active.questionIds.every(id => !initial.active.questionIds.includes(id))).toBe(true);
});

test('unseen card preserves the current draft until replacement is chosen', async ({ page }) => {
  await ready(page); await start(page);
  await page.locator('input[type=radio]').first().check();
  const before = await state(page);
  await go(page, 'progress');
  const card = page.getByRole('button', { name: /尚未練習題目/ });
  await card.click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  expect(await state(page)).toEqual(before);
  await page.locator('dialog [data-action=close]').click();
  expect(await state(page)).toEqual(before);
  await card.click();
  await page.locator('dialog [data-action=resume]').click();
  await expect(page.locator('.question-card')).toHaveCount(10);
  expect((await state(page)).active).toEqual(before.active);
  await go(page, 'progress'); await card.click();
  await page.locator('dialog [data-action=force-start]').click();
  await expect(page.locator('.quiz-top h1')).toHaveText('未練題目練習');
  const after = await state(page);
  expect(after.active.mode).toBe('unseen');
  expect(after.active.id).not.toBe(before.active.id);
  expect(after.ledger).toEqual(before.ledger);
});

test('last few unseen questions are not padded and an exhausted card is disabled', async ({ page }) => {
  await ready(page);
  await page.evaluate(key => {
    const E = window.FactoryEngine, bank = window.FACTORY_QUEST_DATA.questions;
    const saved = E.emptyState(), unique = E.catalog(bank).unique;
    saved.ledger = Object.fromEntries(unique.slice(3).map(q => [q.id, { attempts: 1, correctCount: 1, lastCorrect: true, lastSeen: 1, dueAt: 0 }]));
    localStorage.setItem(key, JSON.stringify(saved));
  }, key);
  await page.reload(); await go(page, 'progress');
  const card = page.getByRole('button', { name: /尚未練習題目/ });
  await expect(card).toContainText('3題');
  await card.click();
  await expect(page.locator('.question-card')).toHaveCount(3);
  await page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key));
    for (const id of saved.active.questionIds) saved.ledger[id] = { attempts: 1, correctCount: 0, lastCorrect: false, lastSeen: 1, dueAt: 1 };
    saved.active = null;
    localStorage.setItem(key, JSON.stringify(saved));
  }, key);
  await page.reload(); await go(page, 'progress');
  await expect(card).toBeDisabled();
  await expect(card).toContainText('0題');
  await expect(card).toContainText('全部題目已練習');
});
