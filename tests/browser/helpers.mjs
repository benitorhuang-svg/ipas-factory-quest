import { expect } from '@playwright/test';
export const key = 'factory-quest-ipas-v1';
export async function ready(page) {
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  await expect.poll(() => page.evaluate(() => !!document.querySelector('.dashboard-unit'))).toBe(true);
  await expect(page.locator('#storage-notice')).toHaveCount(0);
}
export async function go(page, route) { await page.evaluate(route => { location.hash = '#/' + route; }, route); }
export async function state(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), key); }
export async function start(page) {
  await go(page, 'unit/L111');
  await page.locator('[data-action="start"][data-mode="mission"]').click();
  await expect(page.locator('#quiz-form')).toBeVisible();
}
