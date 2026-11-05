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
  expect((await state(page)).active.questionRevision).toBe('questions-2026-11-05');
});
