import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ready, go } from './helpers.mjs';
import { createRequire } from 'node:module';
const revision = createRequire(import.meta.url)('../../dist/engine.js').questionRevision;

async function seed(page) {
  await page.addInitScript(revision => {
    if (localStorage.getItem('factory-quest-ipas-v1')) return;
    localStorage.setItem('factory-quest-ipas-v1', JSON.stringify({
      version: 1, questionRevision: revision, earnedCorrectIds: [], passedUnits: [], best: {}, history: [], studyDates: [], ledger: {},
      active: { id: 'analysis-browser', mode: 'quick', unitId: 'L116', questionIds: ['L116-07'], answers: {}, startedAt: Date.now() },
    }));
  }, revision);
}
async function answerAndCheck(page) {
  await page.locator('[data-action=resume]').click();
  const input = page.locator('input[data-answer="L116-07"][value="1"]');
  const letter = await input.locator('..').locator('.option-letter').textContent();
  await input.check();
  await page.locator('#submit-run').click();
  const card = page.locator('.explanation-card');
  await expect(card.locator('h4')).toHaveText(['破題關鍵', '解題步驟', '選項辨析', '結果檢核與遷移']);
  await expect(card.locator('.expl-steps li')).toHaveCount(3);
  await expect(card.locator('.expl-option')).toHaveCount(3);
  await expect(card.locator('.is-selected strong')).toContainText(`${letter}. 78.75`);
  await expect(card.locator('.is-selected')).toContainText('你的選擇');
  await expect(card.locator('.is-selected')).toContainText('分母仍用整班 480 分鐘');
  await expect(card).not.toContainText('其他選項均為');
  await expect(card).not.toContainText('【重點辨析】');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
test.beforeEach(async ({ request }) => { await request.post('/__release?v=A'); });
for (const width of [390, 1440]) test(`granular result follows shuffled choices at ${width}px`, async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 950 });
  await seed(page); await ready(page); await answerAndCheck(page);
  await page.locator('.feedback-card').screenshot({ path: info.outputPath(`explanation-${width}.png`) });
  await page.reload();
  await expect(page.locator('.is-selected')).toContainText('78.75');
  await expect(page.locator('.expl-steps li')).toHaveCount(3);
  expect(errors).toEqual([]);
});
test('unvisited result explanation is bundled for offline use', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Native service worker offline coverage uses Chromium.');
  await seed(page); await ready(page);
  await context.setOffline(true); await page.reload(); await answerAndCheck(page);
  await go(page, 'progress'); await page.reload();
  await page.locator('[data-action=report]').first().click();
  await expect(page.locator('.is-selected')).toContainText('78.75');
});
test('local file entry renders the same result explanation', async ({ page }) => {
  await seed(page);
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '#/home');
  await answerAndCheck(page);
});

for (const subject of [1, 2]) for (const difficulty of ['standard', 'hardcore']) {
  test(`every question in subject ${subject} ${difficulty} mock has granular analysis`, async ({ page, context, browserName }, info) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 950 });
    await ready(page); await go(page, 'exam');
    if (browserName === 'chromium') await context.setOffline(true);
    await page.locator(`[data-action=start][data-subject="${subject}"][data-difficulty="${difficulty}"]`).click();
    await expect(page.locator('.question-card')).toHaveCount(50);
    const questions = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('factory-quest-ipas-v1'));
      return state.active.questionIds.map(id => window.FACTORY_QUEST_DATA.questions.find(q => q.id === id));
    });
    const labels = [];
    for (const question of questions) {
      const index = (question.answer + 1) % question.options.length;
      const input = page.locator(`input[data-answer="${question.id}"][value="${index}"]`);
      labels.push(await input.locator('..').locator('.option-letter').textContent());
      await input.check();
    }
    await page.locator('#submit-run').click();
    const cards = page.locator('.feedback-card');
    await expect(cards).toHaveCount(50);
    for (let i = 0; i < questions.length; i++) {
      const card = cards.nth(i), question = questions[i], wrong = (question.answer + 1) % 4;
      await expect(card.locator('.expl-options .expl-option')).toHaveCount(3);
      await expect(card.locator('.expl-solution li')).toHaveCount(question.analysis.steps.length);
      await expect(card.locator('.expl-check')).toContainText(question.analysis.check[0]);
      await expect(card.locator('.is-selected strong')).toContainText(`${labels[i]}. ${question.options[wrong]}`);
      await expect(card.locator('.is-selected p')).toHaveText(question.analysis.options[wrong]);
      await expect(card).not.toContainText('其他選項均為');
    }
    await cards.first().screenshot({ path: info.outputPath(`mock-${subject}-${difficulty}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.reload();
    await expect(page.locator('.feedback-card .expl-options')).toHaveCount(50);
    expect(errors).toEqual([]);
  });
}
