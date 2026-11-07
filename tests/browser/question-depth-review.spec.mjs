import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { ready, go } from './helpers.mjs';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const audit = read('content/official-question-review.json');
const checks = Object.assign({}, ...['L11', 'L12', 'L21', 'L22'].map(s => read(`content/official-question-checks/${s}.json`)));

test('all 200 official checks and original PDF pages render on a narrow screen', async ({ page }, info) => {
  test.setTimeout(180000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  for (const [id, row] of Object.entries(checks)) {
    await go(page, `guide/questions/${id}`);
    await expect(page.locator('.question-check p')).toHaveText(row[2]);
    await expect(page.locator('.exam-answer strong')).toHaveText(row[0]);
    await expect(page.getByRole('link', { name: /對照公告試題 PDF/ })).toHaveAttribute('href', new RegExp(`\\.pdf#page=${audit.questions[id][1]}$`));
    if (row[1] === 'ambiguous') await expect(page.locator('.exam-caveat')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), id).toBe(true);
  }
  await go(page, 'guide/questions/L21-28');
  await expect(page.locator('.question-check')).toContainText('60.98% 或 62.5%');
  await page.locator('.question-check').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('official-oee-discrepancy-mobile.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go(page, 'guide/questions/L21-7');
  await expect(page.locator('.exam-caveat')).toContainText('B 不宜一概說成錯誤');
  await page.reload();
  await expect(page.locator('.question-check p')).toHaveText(checks['L21-7'][2]);
  expect(errors).toEqual([]);
});
