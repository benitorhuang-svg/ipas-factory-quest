import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { servePerformance } from './performance-server.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index === -1 ? fallback : args[index + 1]; };
const root = path.resolve(option('--root', 'dist'));
const output = path.resolve(option('--output', 'test-results/performance.json'));
const runs = Number(option('--runs', '3'));
const cpuRate = Number(option('--cpu', '4'));
const throughput = Number(option('--kbps', '4000')) * 1000 / 8;
const latency = Number(option('--latency', '120'));
if (!Number.isInteger(runs) || runs < 1 || !Number.isFinite(cpuRate) || cpuRate < 1 || throughput <= 0 || latency < 0) throw new Error('Invalid measurement profile');
const server = await servePerformance(root);
const browser = await chromium.launch();
const results = [];
try {
  for (let sample = 0; sample < runs; sample++) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency, downloadThroughput: throughput, uploadThroughput: throughput });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
    await page.addInitScript(() => {
      window.__performanceProbe = { lcp: 0, cls: 0, tasks: [] };
      for (const [type, record] of [
        ['largest-contentful-paint', entry => { window.__performanceProbe.lcp = entry.startTime; }],
        ['layout-shift', entry => { if (!entry.hadRecentInput) window.__performanceProbe.cls += entry.value; }],
        ['longtask', entry => window.__performanceProbe.tasks.push({ start: entry.startTime, duration: entry.duration })],
      ]) {
        try { new PerformanceObserver(list => list.getEntries().forEach(record)).observe({ type, buffered: true }); } catch {}
      }
    });
    const frame = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.goto(server.url, { waitUntil: 'load', timeout: 90000 });
    await page.locator('.dashboard-unit').first().waitFor(); await frame();
    const home = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return {
        readyMs: performance.now(), fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        ...window.__performanceProbe, requests: resources.length,
        bodyBytes: resources.reduce((sum, item) => sum + item.encodedBodySize, 0),
      };
    });
    console.log(`Sample ${sample + 1}: homepage ready in ${Math.round(home.readyMs)}ms`);
    const routes = [];
    for (const item of [
      { route: 'atlas', selector: '.atlas-unit', images: true },
      { route: 'guide/materials/M11101', selector: '.reader-article', diagrams: 5 },
      { route: 'home', selector: '.dashboard-unit' },
      { route: 'guide/materials/M11101', selector: '.reader-article', diagrams: 5 },
      { route: 'unit/L111', selector: '[data-mode="mission"]' },
      { route: 'quiz', selector: '#quiz-form', action: 'mission' },
    ]) {
      const profiling = args.includes('--profile') && item.diagrams && !routes.some(route => route.route === item.route);
      if (profiling) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.start'); }
      const before = await page.evaluate(() => ({ time: performance.now(), resources: performance.getEntriesByType('resource').length, tasks: window.__performanceProbe.tasks.length }));
      if (item.action === 'mission') await page.locator('[data-mode="mission"]').click();
      else await page.evaluate(route => { location.hash = '#/' + route; }, item.route);
      await page.locator(item.selector).first().waitFor({ timeout: 90000 }); await frame();
      console.log(`Sample ${sample + 1}: ${item.route} text ready`);
      const textReadyMs = await page.evaluate(start => performance.now() - start, before.time);
      if (item.diagrams) {
        try { await page.waitForFunction(count => document.querySelectorAll('.study-diagram svg').length === count || document.querySelectorAll('.diagram-error').length > 0, item.diagrams, { timeout: 90000 }); }
        catch (error) {
          console.error(await page.evaluate(() => ({ hash: location.hash, svg: document.querySelectorAll('.study-diagram svg').length, failures: [...document.querySelectorAll('.diagram-error')].map(e => e.textContent), sources: [...document.querySelectorAll('.mermaid')].map(e => e.dataset.diagramState) })), errors);
          throw error;
        }
      }
      if (item.images) await page.locator('.atlas-unit-previews img').first().evaluate(image => image.decode());
      await frame();
      const result = await page.evaluate(({ before, route, textReadyMs }) => {
        const resources = performance.getEntriesByType('resource').slice(before.resources);
        const tasks = window.__performanceProbe.tasks.slice(before.tasks);
        return {
          route, textReadyMs, enhancedReadyMs: performance.now() - before.time,
          requests: resources.length, bodyBytes: resources.reduce((sum, item) => sum + item.encodedBodySize, 0),
          longTaskMs: tasks.reduce((sum, task) => sum + task.duration, 0),
          maxTaskMs: Math.max(0, ...tasks.map(task => task.duration)),
          diagramCount: document.querySelectorAll('.study-diagram svg').length,
          diagramErrors: document.querySelectorAll('.diagram-error').length,
        };
      }, { before, route: item.route, textReadyMs });
      routes.push(result);
      if (profiling) {
        const { profile } = await cdp.send('Profiler.stop');
        fs.mkdirSync(path.dirname(output), { recursive: true });
        fs.writeFileSync(output.replace(/\.json$/, '') + `-${sample + 1}.cpuprofile`, JSON.stringify(profile));
      }
    }
    const answerStart = await page.evaluate(() => performance.now());
    await page.locator('input[type=radio]').first().check(); await frame();
    const answer = await page.evaluate(start => ({ readyMs: performance.now() - start, answered: document.getElementById('answered-count').textContent }), answerStart);
    results.push({ sample: sample + 1, home, routes, answer, errors });
    console.log(JSON.stringify({ sample: sample + 1, homeReadyMs: Math.round(home.readyMs), homeBytes: home.bodyBytes, reader: routes.filter(route => route.route.includes('M11101')) }));
    await context.close();
  }
  const report = { date: new Date().toISOString(), root, browser: browser.version(), profile: { viewport: '390x844', cpuRate, latencyMs: latency, downloadKbps: throughput * 8 / 1000, serviceWorkers: 'blocked', httpCache: 'disabled', compression: 'none', runs }, samples: results };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(`Saved ${output}`);
} finally {
  await browser.close(); await server.close();
}
