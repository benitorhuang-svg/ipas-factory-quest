import { chromium } from 'file:///C:/Users/benit/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('pageerror', (error) => console.log('ERROR', error.message));
page.on('console', (message) => { if (message.type() === 'warning') console.log('WARN', message.text()); });
try {
  await page.goto('http://127.0.0.1:57840/#/topic/M12101');
  await page.locator('.unit-summary__frame[data-diagram-state="ready"]').waitFor();
  const frame = page.locator('iframe[title="ISA-95 五層架構與智慧工廠關聯互動圖"]');
  await frame.scrollIntoViewIfNeeded();
  await page.waitForTimeout(5000);
  console.log(await frame.evaluate((f) => ({ data: { ...f.dataset }, rect: f.getBoundingClientRect().toJSON(), src: f.getAttribute('src'), srcdoc: !!f.getAttribute('srcdoc'), connected: f.isConnected })));
  console.log(await page.frameLocator('iframe[title="ISA-95 五層架構與智慧工廠關聯互動圖"]').locator('body').evaluate((b) => ({ text: b.innerText.slice(0,300), api: !!window.Archify, svg: !!b.querySelector('svg') })));
} finally { await browser.close(); }
