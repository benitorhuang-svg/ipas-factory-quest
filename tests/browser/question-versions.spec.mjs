import { test, expect } from '@playwright/test';
import { ready, go, state } from './helpers.mjs';
test.beforeEach(async ({ request }) => { await request.post('/__release?v=A'); });
test('published draft and report keep original option meaning after upgrade', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('factory-quest-ipas-v1')) return;
    localStorage.setItem('factory-quest-ipas-v1', JSON.stringify({
      version: 1, earnedCorrectIds: ['L111-02'], passedUnits: [], best: {}, studyDates: [], ledger: {},
      active: { id: 'published-draft', mode: 'quick', unitId: 'L111', startedAt: Date.now(), questionIds: ['L111-02'], answers: { 'L111-02': 0 } },
      history: [{ runId: 'published-report', mode: 'quick', unitId: 'L111', results: [{ id: 'L111-02', answer: 0, correct: true }] }],
    }));
  });
  await ready(page); await page.locator('[data-action=resume]').click();
  const checked = page.locator('input[data-answer="L111-02"]:checked');
  await expect(checked).toHaveValue('0');
  await expect(checked.locator('..')).toContainText('依需求預測先備妥成品的存貨生產');
  await expect(checked.locator('..').locator('.option-letter')).toHaveText('A');
  await page.reload(); await expect(checked).toBeChecked();
  await page.locator('#submit-run').click();
  await expect(page.locator('.result-score')).toContainText('100');
  await expect(page.locator('.answer-lines')).toContainText('A. 依需求預測先備妥成品的存貨生產');
  await go(page, 'progress');
  await page.locator('[data-action=report][data-id=published-report]').click();
  await expect(page.locator('.result-score')).toContainText('100');
  await expect(page.locator('.answer-lines')).toContainText('A. 依需求預測先備妥成品的存貨生產');
  await go(page, 'unit/L111');
  await page.locator('[data-action=start][data-mode=quick]').click();
  expect((await state(page)).active.questionRevision).toBe('questions-2026-11-07');
});

test('the previous reviewed revision keeps numeric tolerance after reload and submission', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('factory-quest-ipas-v1')) return;
    localStorage.setItem('factory-quest-ipas-v1', JSON.stringify({
      version: 1, questionRevision: 'questions-2026-11-05', earnedCorrectIds: [], passedUnits: [], best: {}, studyDates: [], ledger: {},
      active: { id: 'previous-rounding', mode: 'quick', unitId: 'L116', startedAt: Date.now(), questionIds: ['L116-14'], answers: { 'L116-14': '88.88' } },
      history: [{ runId: 'previous-rounding-report', mode: 'quick', unitId: 'L116', results: [{ id: 'L116-14', answer: '88.88' }] }],
    }));
  });
  await ready(page); await page.locator('[data-action=resume]').click();
  await expect(page.locator('#number-L116-14')).toHaveValue('88.88');
  await expect(page.locator('.section-description')).toContainText('保留原題目');
  await page.reload();
  await expect(page.locator('#number-L116-14')).toHaveValue('88.88');
  await page.locator('#submit-run').click();
  await expect(page.locator('.result-score')).toContainText('100');
  await expect(page.locator('.feedback-card .tag')).toContainText('原版試卷');
  expect((await state(page)).history.find(r => r.runId === 'previous-rounding').questionRevision).toBe('questions-2026-11-05');
  await go(page, 'progress');
  await page.locator('[data-action=report][data-id=previous-rounding-report]').click();
  await expect(page.locator('.result-score')).toContainText('100');
});

test('previous-revision aliases retain the original wording and shuffled answer', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('factory-quest-ipas-v1')) return;
    localStorage.setItem('factory-quest-ipas-v1', JSON.stringify({
      version: 1, questionRevision: 'questions-2026-11-05', earnedCorrectIds: ['L125-B02'], passedUnits: [], best: {}, studyDates: [], ledger: {}, history: [],
      active: { id: 'previous-alias', mode: 'quick', unitId: 'L125', startedAt: Date.now(), questionIds: ['L125-B05'], answers: { 'L125-B05': 1 } },
    }));
  });
  await ready(page); await page.locator('[data-action=resume]').click();
  const checked = page.locator('input[data-answer="L125-B05"]:checked');
  await expect(checked.locator('..')).toContainText('AMR 可用 SLAM 自主定位與避障');
  const letter = await checked.locator('..').locator('.option-letter').textContent();
  await page.reload();
  await expect(checked.locator('..').locator('.option-letter')).toHaveText(letter);
  await page.locator('#submit-run').click();
  await expect(page.locator('.result-score')).toContainText('100');
  await expect(page.locator('.feedback-card')).toContainText('AMR 與固定路徑 AGV 最大差異為何？');
  await expect(page.locator('.answer-lines')).toContainText(`${letter}. AMR 可用 SLAM 自主定位與避障`);
  expect((await state(page)).history.at(-1).earnedXP).toBe(0);
});
