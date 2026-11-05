import { test, expect } from '@playwright/test';
import { ready, go, start, state } from './helpers.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

test.beforeEach(async ({ request }) => { await request.post('/__release?v=A'); });
for (const width of [390, 1440]) test(`layout, reader and original image at ${width}px`, async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 900 }); await ready(page);
  await go(page, 'atlas');
  const preview = page.locator('.atlas-unit-previews button').first();
  const image = preview.locator('img'); await expect(image).toHaveAttribute('src', /previews\/.*\.webp/);
  await image.evaluate(image => image.decode());
  const previewBytes = await image.evaluate(async image => (await (await fetch(image.currentSrc)).arrayBuffer()).byteLength);
  await preview.click(); await expect(page.locator('dialog[open] img')).toBeVisible();
  const originalBytes = await page.locator('dialog img').evaluate(async image => { await image.decode(); return (await (await fetch(image.currentSrc)).arrayBuffer()).byteLength; });
  expect(previewBytes).toBeLessThan(originalBytes);
  await page.keyboard.press('Escape'); await expect(preview).toBeFocused();
  await go(page, 'guide/materials/M11101'); await expect(page.locator('.reader-article')).toBeVisible();
  await expect(page.locator('.study-diagram svg').first()).toBeVisible();
  await expect(page.locator('.katex').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath(`reader-${width}.png`), fullPage: false });
  await info.attach('image-bytes', { body: JSON.stringify({ previewBytes, originalBytes }), contentType: 'application/json' });
  expect(errors).toEqual([]);
});
test('backup import cannot render untrusted markup', async ({ page }) => {
  await ready(page); await go(page, 'progress');
  const payload = await page.evaluate(() => {
    const question = window.FACTORY_QUEST_DATA.questions[0];
    return { ...window.FactoryEngine.emptyState(), history: [{ runId: 'imported', unitId: '<b data-probe>audit</b>', mode: 'exam', score: 10, correct: '<img src=x>', total: 1, earnedXP: '<b>xp</b>', results: [{ id: question.id, answer: question.answer, correct: true }] }] };
  });
  await page.locator('input[type=file]').setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(payload)) });
  await page.locator('#confirm-import').click();
  await expect(page.locator('[data-probe]')).toHaveCount(0);
  await page.locator('[data-action=report]').first().click();
  await expect(page.locator('.result-hero')).toBeVisible(); await expect(page.locator('[data-probe]')).toHaveCount(0);
  expect((await state(page)).history[0].unitId).toBeNull();
});
test('one writer protects two tabs and transfers ownership', async ({ page, context }) => {
  await ready(page); await start(page);
  await page.locator('input[type=radio]').first().check();
  const before = await state(page);
  const other = await context.newPage(); await other.goto('./');
  await expect(other.locator('#storage-notice')).toContainText('另一個分頁');
  await go(other, 'unit/L112'); await other.locator('[data-action=start][data-mode=mission]').click();
  await expect(other.locator('#quiz-form')).toHaveCount(0);
  expect((await state(other)).active).toEqual(before.active);
  await page.close(); await other.getByRole('button', { name: '重新取得作答權' }).click();
  await expect(other.locator('#storage-notice')).toHaveCount(0);
  await go(other, 'home'); await other.locator('[data-action=resume]').click();
  await expect(other.locator('#quiz-form')).toBeVisible();
  expect((await state(other)).active.answers).toEqual(before.active.answers);
});
test('local file entry loads split materials without an HTTP server', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.text().startsWith('Study diagram')) errors.push(message.text()); });
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '#/guide/materials/M11101');
  await expect(page.locator('.reader-article')).toBeVisible();
  await expect(page.locator('.study-diagram svg')).toHaveCount(5);
  await expect(page.locator('.study-diagram svg').first()).toBeVisible();
  await expect(page.locator('.diagram-error')).toHaveCount(0);
  await expect(page.locator('.katex').first()).toBeVisible();
  expect(errors).toEqual([]);
});
test('due review rotates questions and survives reload', async ({ page, context, browserName }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('factory-quest-ipas-v1')) localStorage.setItem('factory-quest-ipas-v1', JSON.stringify({
    version: 1, earnedCorrectIds: ['L111-01'], passedUnits: [], best: {}, history: [], studyDates: [], active: null,
    ledger: { 'L111-01': { attempts: 1, correctCount: 1, lastCorrect: true, lastSeen: Date.now() - 4 * 86400000, dueAt: Date.now() - 86400000 } },
  })); });
  await ready(page);
  await go(page, 'repair');
  await expect(page.getByRole('heading', { name: '到期複習', exact: true })).toBeVisible();
  await expect(page.locator('.repair-summary')).toContainText('0 題待加強 · 1 題已到期');
  await page.locator('.repair-summary [data-action=review]').click();
  await expect(page.locator('.question-card')).toHaveCount(1);
  const run = (await state(page)).active, id = run.questionIds[0];
  expect(id).not.toBe('L111-01');
  expect(run.reviewTargets[id]).toBe('L111-01');
  if (browserName === 'chromium') await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.question-card')).toHaveCount(1);
  expect((await state(page)).active.reviewTargets).toEqual(run.reviewTargets);
  const question = await page.evaluate(id => window.FACTORY_QUEST_DATA.questions.find(q => q.id === id), id);
  if (question.kind === 'choice') await page.locator(`[data-answer="${id}"][value="${question.answer}"]`).check();
  else await page.locator(`[data-answer="${id}"]`).fill(String(question.answer));
  await page.locator('#submit-run').click(); await expect(page.locator('.result-hero')).toBeVisible();
  await go(page, 'repair'); await expect(page.locator('.empty h2')).toHaveText('今日複習已完成');
  expect((await state(page)).ledger['L111-01'].attempts).toBe(1);
  expect((await state(page)).ledger[id].correctCount).toBe(1);
});
