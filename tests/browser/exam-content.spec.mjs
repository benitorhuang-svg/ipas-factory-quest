import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ready, go } from './helpers.mjs';

test('chapter cores link to the official question explanation, including offline', async ({ page, context }) => {
  await ready(page);
  await go(page, 'guide/materials/M12203');
  await expect(page.locator('.reader-article')).toBeVisible();
  await expect(page.locator('.reader-article')).not.toContainText('常見誤選理由');
  await expect(page.locator('.reader-article')).toContainText('對應考題核心');
  await page.locator('.reader-article a[href="#/guide/questions/L12-7"]').click();
  await expect(page.locator('.reader-article')).toContainText('常見誤選理由');
  await expect(page.locator('.reader-article')).toContainText('將時間、產量及品質整合的 OEE 模組');
  await expect(page.getByRole('link', { name: '對照公告試題 PDF' })).toHaveAttribute('href', /L12.*\.pdf$/);
  await context.setOffline(true);
  await go(page, 'guide/questions/L12-46');
  await expect(page.locator('.reader-article')).toContainText('第一次合格 90 件');
  await page.reload();
  await expect(page.locator('.reader-article')).toContainText('第一次合格 90 件');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('local file question entry loads explanations and formulas', async ({ page }) => {
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '#/guide/questions/L11-26');
  await expect(page.locator('.reader-article')).toContainText('175');
  await expect(page.locator('.reader-article .katex').first()).toBeVisible();
  await page.getByRole('link', { name: '全部公告試題說明' }).click();
  await expect(page.locator('.exam-result')).toHaveCount(25);
  await expect(page.locator('#exam-result-count')).toContainText('/ 200 題');
});

test('returning to a long catalog restores its scroll position', async ({ page }) => {
  await ready(page); await go(page, 'guide/questions');
  await page.locator('.exam-result').nth(20).scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  expect(before).toBeGreaterThan(100);
  await page.locator('.exam-result').nth(20).click();
  await expect(page.locator('.question-reasoning')).toBeVisible();
  await page.getByRole('link', { name: '全部公告試題說明' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(before, -1);
});

test('question catalog filters exact IDs, preserves state and paginates', async ({ page }) => {
  await ready(page); await go(page, 'guide/questions');
  await page.locator('#exam-question-subject').selectOption('L12');
  await expect(page.locator('#exam-result-count')).toContainText('/ 50 題');
  await page.getByRole('button', { name: '下一頁', exact: true }).click();
  await expect(page.locator('.exam-result').first()).toContainText('第 26 題');
  await page.reload();
  await expect(page.locator('#exam-question-subject')).toHaveValue('L12');
  await expect(page.locator('.exam-result').first()).toContainText('第 26 題');
  await page.locator('#exam-question-search').fill('L12-7');
  await expect(page.locator('.exam-result')).toHaveCount(1);
  await page.locator('.exam-result').click();
  await expect(page.locator('#exam-question-title')).toContainText('OEE');
  await page.getByRole('link', { name: '全部公告試題說明' }).click();
  await expect(page.locator('#exam-question-search')).toHaveValue('L12-7');
  await expect(page.locator('.exam-result')).toHaveCount(1);
  await page.locator('#exam-question-search').fill('<img src=x onerror=alert(1)>');
  await expect(page.locator('#exam-results img')).toHaveCount(0);
  await expect(page.locator('#exam-result-count')).toContainText('找不到');
  await page.getByRole('button', { name: '清除篩選' }).click();
  await page.locator('#exam-question-notes').check();
  await page.locator('.exam-result').first().click();
  await expect(page.locator('.exam-caveat')).toBeVisible();
});

test('returns to the exact chapter row and navigates by original subject number', async ({ page }) => {
  await ready(page); await go(page, 'guide/materials/M12203');
  const link = page.locator('#exam-core-L12-7 a');
  await link.click();
  await expect(page.locator('.exam-context')).not.toHaveAttribute('open', '');
  await expect(page.locator('.reader-heading h2')).toHaveCount(1);
  await expect(page.locator('.reader-article h2')).toHaveCount(0);
  await page.reload();
  await page.getByRole('link', { name: '返回原章節位置', exact: true }).click();
  await expect(page.locator('#exam-core-L12-7')).toBeFocused();
  await expect(page.locator('#exam-core-L12-7')).toBeInViewport();
  await link.click();
  await page.locator('#exam-question-jump').selectOption('L12-46');
  await expect(page.locator('.reader-article')).toContainText('第一次合格 90 件');
  await expect(page.locator('.reader-pagination a').first()).toHaveAttribute('href', '#/guide/questions/L12-45');
  await go(page, 'guide/questions/L22-41');
  await expect(page.locator('.question-reasoning')).not.toContainText('第 6 題');
  await expect(page.locator('.question-reasoning')).toContainText('9.6');
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('question bundle errors can retry without overwriting valid chapter data', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    let failed = false;
    window.fetch = async (url, options) => {
      if (String(url) === 'materials/M12203.json' && !failed) {
        failed = true;
        return new Response(JSON.stringify({ topicCode: 'M12203', details: '<p>bad</p>', questions: {}, notes: {} }), { headers: { 'Content-Type': 'application/json' } });
      }
      return original(url, options);
    };
  });
  await ready(page); await go(page, 'guide/questions/L12-7');
  await expect(page.locator('.reader-article')).toContainText('不完整');
  await page.getByRole('button', { name: '重新載入內容' }).click();
  await expect(page.locator('.question-reasoning')).toContainText('OEE');
  await expect(page.locator('.reader-article')).not.toContainText('bad');
});

test('a completed request cannot pull the reader back after navigating away', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    const original = window.fetch.bind(window);
    window.fetch = async (url, options) => {
      if (String(url) === 'materials/M12203.json') await new Promise(resolve => { window.releaseExamRequest = resolve; });
      return original(url, options);
    };
  });
  await go(page, 'guide/questions/L12-7');
  await expect(page.locator('[data-material-loading]')).toBeVisible();
  await go(page, 'home'); await page.evaluate(() => window.releaseExamRequest());
  await expect(page.locator('.dashboard-unit')).toHaveCount(12);
  await expect(page.locator('.reader-article')).toHaveCount(0);
  await go(page, 'guide/questions/L12-46');
  await expect(page.locator('.reader-article')).toContainText('第一次合格 90 件');
});
