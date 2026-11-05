import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const [beforeFile, afterFile, output = 'docs/evidence/performance-comparison.json'] = process.argv.slice(2);
if (!beforeFile || !afterFile) throw new Error('Usage: node scripts/compare-performance.mjs before.json after.json [output.json]');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const before = read(beforeFile), after = read(afterFile);
for (const key of ['viewport', 'cpuRate', 'latencyMs', 'downloadKbps', 'serviceWorkers', 'httpCache', 'compression']) {
  if (before.profile[key] !== after.profile[key]) throw new Error(`Profiles differ: ${key}`);
}
const median = values => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return Math.round((sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2) * 10) / 10;
};
const range = values => ({ median: median(values), min: Math.round(Math.min(...values)), max: Math.round(Math.max(...values)) });
function summarize(report) {
  const readers = index => report.samples.map(sample => sample.routes.filter(route => route.route === 'guide/materials/M11101')[index]);
  const reader = index => {
    const routes = readers(index), successful = routes.filter(route => route.diagramCount === 5 && route.diagramErrors === 0);
    return {
      successful: successful.length, attempts: routes.length,
      textReadyMs: range(routes.map(route => route.textReadyMs)),
      diagramsReadyMs: successful.length ? range(successful.map(route => route.enhancedReadyMs)) : null,
      maxTaskMs: range(routes.map(route => route.maxTaskMs)),
      completedBodyBytes: median(routes.map(route => route.bodyBytes)),
    };
  };
  const context = { self: {} };
  vm.runInNewContext(fs.readFileSync(path.join(report.root, 'precache.js'), 'utf8'), context);
  const cache = context.self.FACTORY_PRECACHE;
  const html = fs.readFileSync(path.join(report.root, 'index.html'), 'utf8');
  return {
    homeReadyMs: range(report.samples.map(sample => sample.home.readyMs)),
    homeFcpMs: range(report.samples.map(sample => sample.home.fcpMs)),
    homeBodyBytes: median(report.samples.map(sample => sample.home.bodyBytes)),
    shellRequests: [...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^\"]+\.(?:js|css))"/g)].length,
    precache: { version: cache.version, assets: cache.assets.length, bytes: cache.assets.reduce((sum, file) => sum + fs.statSync(path.join(report.root, file)).size, 0) },
    firstReader: reader(0), repeatReader: reader(1),
    atlasReadyMs: range(report.samples.map(sample => sample.routes.find(route => route.route === 'atlas').textReadyMs)),
    quizReadyMs: range(report.samples.map(sample => sample.routes.find(route => route.route === 'quiz').textReadyMs)),
    answerReadyMs: range(report.samples.map(sample => sample.answer.readyMs)),
    pageErrors: report.samples.flatMap(sample => sample.errors),
  };
}
const comparison = { date: new Date().toISOString(), profile: before.profile, browserBefore: before.browser, browserAfter: after.browser, before: summarize(before), after: summarize(after), note: 'Local uncompressed HTTP with fresh browser contexts; not public CDN, physical device, Lighthouse score or field INP. Incomplete or failed requests are absent from completedBodyBytes.' };
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(output, JSON.stringify(comparison, null, 2) + '\n');
console.log(JSON.stringify(comparison, null, 2));
