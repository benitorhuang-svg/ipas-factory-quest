import { chromium } from 'file:///C:/Users/benit/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
try {
  await page.goto('http://127.0.0.1:57840/#/topic/M11101');
  await page.locator('iframe[data-diagram-state="ready"]').waitFor();
  await page.getByRole('tab', { name: '文字導讀', exact: true }).click();
  await page.locator('.unit-summary-reader__detail h3').waitFor();
  const id = await page.locator('select option').last().getAttribute('value');
  await page.locator('.unit-summary-reader__select').selectOption(id);
  await page.getByRole('button', { name: '在互動圖中定位' }).click();
  const frame = page.frameLocator('.unit-summary__frame');
  await frame.locator(`[data-node-id="${id}"][aria-pressed="true"]`).waitFor({ state: 'attached' });
  const metric = () => frame.locator('body').evaluate((body, id) => {
    const canvas = body.querySelector('.diagram-container'), svg = body.querySelector('svg');
    const node = [...body.querySelectorAll('[data-node-id]')].find((node) => node.dataset.nodeId === id);
    return { camera: window.Archify.view.state(), scroll: [canvas.scrollLeft, canvas.scrollTop],
      node: node.getBoundingClientRect().toJSON(), label: node.querySelector('text').getBoundingClientRect().toJSON(),
      canvas: canvas.getBoundingClientRect().toJSON(), svg: svg.getBoundingClientRect().toJSON(),
      box: node.getBBox(), vb: svg.getAttribute('viewBox'), width: svg.clientWidth, height: svg.clientHeight, mode: body.ownerDocument.documentElement.dataset.studyMode };
  }, id);
  console.log(JSON.stringify({ immediate: await metric() }, null, 2));
  console.log(await frame.locator('.diagram-container').evaluate((element) => { element.scrollLeft = 330; return { scroll: element.scrollLeft, sw: element.scrollWidth, cw: element.clientWidth, overflow: getComputedStyle(element).overflow }; }));
  await page.waitForTimeout(500);
  console.log(JSON.stringify({ settled: await metric() }, null, 2));
} finally { await browser.close(); }
