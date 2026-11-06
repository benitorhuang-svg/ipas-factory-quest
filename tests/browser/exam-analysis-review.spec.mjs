import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { ready, go } from './helpers.mjs';
const E = createRequire(import.meta.url)('../../dist/engine.js');
const raw = [1, 2].flatMap(id => JSON.parse(fs.readFileSync(`content/questions-subject${id}.json`, 'utf8')));
const choices = E.catalog(raw).unique.filter(q => q.kind === 'choice');
const batches = Array.from({ length: Math.ceil(choices.length / 50) }, (_, index) => choices.slice(index * 50, (index + 1) * 50));
test.beforeEach(async ({ request }) => { await request.post('/__release?v=A'); });

for (const width of [390, 1440]) test(`all 396 mock-pool analyses and ISA-95 explanation at ${width}px`, async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 1000 });
  await page.addInitScript(({ batches, revision }) => {
    localStorage.setItem('factory-quest-ipas-v1', JSON.stringify({
      version: 1, questionRevision: revision, earnedCorrectIds: [], passedUnits: [], best: {}, studyDates: [], ledger: {},
      history: batches.map((questions, index) => ({ runId: `mock-pool-${index}`, questionRevision: revision, mode: 'exam',
        results: questions.map(q => ({ id: q.id, answer: (q.answer + 1) % 4 })) })),
    }));
  }, { batches, revision: E.questionRevision });
  await ready(page);
  let rendered = 0;
  for (const [index, questions] of batches.entries()) {
    await go(page, `result/mock-pool-${index}`);
    const cards = page.locator('.feedback-card');
    await expect(cards).toHaveCount(questions.length);
    await expect(page.locator('.expl-options')).toHaveCount(questions.length);
    await expect(page.locator('.expl-option')).toHaveCount(questions.length * 3);
    await expect(page.locator('.expl-option.is-selected')).toHaveCount(questions.length);
    for (const text of await cards.allTextContents()) {
      expect(text).toContain('本題檢核');
      expect(text).not.toMatch(/其他選項均為|與題意核心概念不符|【重點辨析】/);
    }
    if (questions.some(q => q.id === 'L121-B10')) {
      const isa = cards.filter({ has: page.getByRole('heading', { name: '依 ISA-95 常見分層，負責連結企業規劃與現場控制、執行生產作業的層級為何？', exact: true }) });
      await expect(isa).toHaveCount(1);
      await expect(isa.locator('.expl-solution')).toContainText('本週生產 500 件');
      await expect(isa.locator('.is-selected')).toContainText('Level 4');
      await expect(isa.locator('.is-selected p')).toContainText('企業規劃與物流');
      await expect(isa).not.toContainText('MQTT');
      await expect(isa.locator('.expl-sources a')).toHaveAttribute('href', 'https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard');
      await isa.scrollIntoViewIfNeeded();
      await isa.screenshot({ path: info.outputPath(`isa95-reviewed-${width}.png`) });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    rendered += questions.length;
  }
  expect(rendered).toBe(396);
  await page.reload(); await expect(page.locator('.expl-options')).toHaveCount(batches.at(-1).length);
  expect(errors).toEqual([]);
});
