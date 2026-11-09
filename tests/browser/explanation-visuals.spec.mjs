import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ready, go, state } from './helpers.mjs';

test.beforeEach(async ({ request }) => { await request.post('/__release?v=A'); });

for (const [width, local] of [[390, false], [1440, false], [390, true]]) {
  test(`planning explanation diagrams at ${width}px over ${local ? 'file' : 'HTTP'}`, async ({ page, context, browserName }, info) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 950 });
    if (local) await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '#/progress');
    else {
      await ready(page);
      if (browserName === 'chromium') { await context.setOffline(true); await page.reload(); }
    }
    for (const [id, type] of [['L111-01', 'mps'], ['L111-11', 'capacity'], ['L111-19', 'backward'], ['L114-08', 'standard-time']]) {
      await go(page, 'progress');
      await page.getByLabel('搜尋題目', { exact: true }).fill(id);
      await page.locator(`[data-practice-question="${id}"] [data-action=practice-start]`).click();
      await expect(page.locator('.question-card')).toHaveCount(1);
      const question = await page.evaluate(id => window.FACTORY_QUEST_DATA.questions.find(q => q.id === id), id);
      if (question.kind === 'number') await page.locator(`[data-answer="${id}"]`).fill(String(question.answer));
      else await page.locator(`[data-answer="${id}"][value="${question.answer}"]`).check();
      await page.locator('#submit-run').click();
      const diagram = page.locator(`.expl-${type}`);
      await expect(diagram).toBeVisible();
      if (type === 'mps') {
        await expect(diagram.locator('.planning-main dd')).toHaveText(['甲型成品', '200 件', '第 1 週']);
        await expect(diagram.locator('.planning-downstream > div')).toHaveCount(2);
      } else if (type === 'capacity') {
        await expect(diagram.locator('[role=img]')).toHaveAccessibleName('當日可用 8 小時，需求 16 小時，超載 8 小時，負荷為 200%');
        await expect(diagram.locator('.capacity-metrics strong')).toHaveText(['16 ÷ 8 × 100% ＝ 200%', '16 − 8 ＝ 8 小時']);
      } else if (type === 'backward') {
        await expect(diagram.locator('[role=img]')).toHaveAccessibleName('第 26 小時開工，經過 14 小時，第 40 小時完工');
        await expect(diagram.locator('.backward-milestones dd')).toHaveText(['第 26 小時', '第 40 小時']);
      } else {
        await expect(diagram.locator('[role=img]')).toHaveAccessibleName('標準時間 100 秒為 100%，正常時間 80 秒占 80%，寬放時間 20 秒占 20%');
        await expect(diagram.locator('.standard-time-total strong')).toHaveText('100 秒 ＝ 100%');
        await expect(diagram.locator('.standard-time-legend dd')).toHaveText(['80 秒占整體 80%', '20 秒占整體 20%']);
        const shares = await diagram.locator('.standard-time-bar > span').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));
        expect(shares[0] / shares[1]).toBeCloseTo(4, 1);
      }
      expect(await diagram.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect((await state(page)).history.at(-1).score).toBe(100);
      await diagram.screenshot({ path: info.outputPath(`${type}-${width}.png`) });
      await page.reload();
      await expect(page.locator(`.expl-${type}`)).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}
