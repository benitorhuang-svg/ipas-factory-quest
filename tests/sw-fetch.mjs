import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const base = 'https://example.test/factory/';
const stores = new Map();
const events = {};
const deleted = [];
let fetcher = async () => { throw new Error('offline'); };
let failWrites = false;
let skipRequests = 0, clients = [];
const urlOf = key => new URL(key.url || key, base).href;
function store(name) {
  if (!stores.has(name)) stores.set(name, new Map());
  return stores.get(name);
}
const cacheAPI = {
  open: async name => ({
    addAll: async keys => {
      for (const key of keys) {
        assert.ok(fs.existsSync(`dist/${key}`), key);
        store(name).set(urlOf(key), new Response(fs.readFileSync(`dist/${key}`)));
      }
    },
    match: async key => store(name).get(urlOf(key))?.clone(),
    put: async (key, response) => {
      if (failWrites) throw new Error('quota');
      await new Promise(resolve => setTimeout(resolve, 2));
      store(name).set(urlOf(key), response.clone());
    },
    keys: async () => [...store(name).keys()].map(url => ({ url })),
  }),
  keys: async () => [...stores.keys()],
  delete: async name => { deleted.push(name); return stores.delete(name); },
  match: async key => {
    for (const values of stores.values()) if (values.has(urlOf(key))) return values.get(urlOf(key)).clone();
  },
};
const context = {
  URL, Response, Set, caches: cacheAPI, fetch: request => fetcher(request),
  self: { registration: { scope: base }, addEventListener: (name, handler) => { events[name] = handler; }, skipWaiting: async () => { skipRequests++; }, clients: { claim: async () => {}, matchAll: async () => clients } },
};
context.importScripts = file => vm.runInContext(fs.readFileSync(`dist/${file}`, 'utf8'), context);
vm.createContext(context);
vm.runInContext(fs.readFileSync('dist/sw.js', 'utf8'), context);
const manifest = context.self.FACTORY_PRECACHE;
const currentName = 'factory-quest-pwa-' + encodeURIComponent('/factory/') + '-' + manifest.version;
const contentName = 'factory-quest-content-' + encodeURIComponent('/factory/') + '-v1';
const digest = crypto.createHash('sha256');
for (const asset of [...manifest.assets.filter(file => file !== 'precache.js'), 'sw.js']) {
  const raw = fs.readFileSync(`dist/${asset}`);
  const data = asset === 'sw.js' ? raw.toString().replace(/\/\/ Cache revision: \S+/, '// Cache revision: generated') : asset === 'index.html' ? raw.toString().replace(/(<meta name="factory-release" content=")[^"]+/, '$1generated') : raw;
  digest.update(asset + '\0').update(data);
}
assert.equal(digest.digest('hex').slice(0, 16), manifest.version, 'Built cache version matches current shell bytes');
async function lifecycle(name) {
  let task;
  events[name]({ waitUntil: value => { task = value; } });
  await task;
}
function request(path, options = {}) {
  return { url: new URL(path, base).href, method: 'GET', headers: new Headers(), destination: '', mode: 'cors', ...options };
}
async function dispatch(req) {
  const tasks = [];
  let response;
  events.fetch({ request: req, respondWith: value => { response = value; }, waitUntil: value => tasks.push(value) });
  return { response: await response, tasks, drain: async () => { while (tasks.length) await Promise.all(tasks.splice(0)); } };
}

await lifecycle('install');
assert.equal(skipRequests, 0, 'Install must not interrupt a running release');
async function boot(id) {
  let task;
  events.message({ data: { type: 'FACTORY_ACTIVATE_ON_BOOT' }, source: { id }, waitUntil: value => { task = value; } });
  await task;
}
clients = [{ id: 'fresh', url: base }, { id: 'other', url: base }];
await boot('fresh'); assert.equal(skipRequests, 0, 'Other open pages keep the update waiting');
clients = [{ id: 'fresh', url: base }];
await boot('wrong'); assert.equal(skipRequests, 0, 'Only the requesting page may authorize its boot');
await boot('fresh'); assert.equal(skipRequests, 1);
assert.equal(store(currentName).size, manifest.assets.length);
store('factory-quest-pwa-v14').set(urlOf('assets/old.png'), new Response('saved diagram'));
store('factory-quest-pwa-v14').set(urlOf('app.js'), new Response('old application'));
store('factory-quest-pwa-v13').set('https://example.test/other/index.html', new Response('other installation'));
store('another-project-pwa-v1').set('https://example.test/other/asset', new Response('unrelated'));
await lifecycle('activate');
assert.ok(deleted.includes('factory-quest-pwa-v14'));
assert.ok(!deleted.includes('factory-quest-pwa-v13'), 'Mixed legacy caches retain other installations');
assert.ok(!deleted.includes('another-project-pwa-v1'));
assert.equal(await store(contentName).get(urlOf('assets/old.png')).clone().text(), 'saved diagram');

fetcher = async () => { throw new Error('Core shell must use its installed snapshot'); };
let result = await dispatch(request('app.js'));
assert.equal(await result.response.text(), fs.readFileSync('dist/app.js', 'utf8'));
result = await dispatch(request('./?from=test', { mode: 'navigate' }));
assert.equal(await result.response.text(), fs.readFileSync('dist/index.html', 'utf8'));
result = await dispatch(request('assets/old.png', { destination: 'image' }));
assert.equal(await result.response.text(), 'saved diagram');
await result.drain();

fetcher = async () => new Response('fresh interactive page', { status: 200 });
result = await dispatch(request('assets/new.html', { mode: 'navigate' }));
assert.equal(await result.response.text(), 'fresh interactive page');
await result.drain();
assert.equal(await store(contentName).get(urlOf('assets/new.html')).clone().text(), 'fresh interactive page');
fetcher = async () => { throw new Error('offline'); };
result = await dispatch(request('assets/new.html', { mode: 'navigate' }));
assert.equal(await result.response.text(), 'fresh interactive page');
await result.drain();
for (const [file, destination, type] of [['assets/unseen.html', 'document', 'text/html'], ['assets/unseen.png', 'image', 'image/svg+xml'], ['missing.js', 'script', 'application/javascript'], ['assets/missing.pdf', '', 'text/plain']]) {
  result = await dispatch(request(file, { destination, mode: destination === 'document' ? 'navigate' : 'cors' }));
  assert.ok(result.response instanceof Response, file);
  assert.equal(result.response.status, 503, file);
  assert.ok(result.response.headers.get('content-type').startsWith(type), file);
  assert.equal(result.response.headers.get('x-factory-offline'), 'uncached');
  assert.equal(store(contentName).has(urlOf(file)), false, 'Fallback is never stored as the actual asset');
}
fetcher = async () => new Response('not found', { status: 404 });
result = await dispatch(request('assets/not-found.png'));
await result.drain();
assert.equal(result.response.status, 404);
assert.equal(store(contentName).has(urlOf('assets/not-found.png')), false);
failWrites = true;
fetcher = async () => new Response('available even when cache is full');
result = await dispatch(request('assets/full.html'));
await result.drain();
assert.equal(await result.response.text(), 'available even when cache is full');
store('factory-quest-pwa-v12').set(urlOf('assets/retained.png'), new Response('retain until migration succeeds'));
await lifecycle('activate');
assert.ok(stores.has('factory-quest-pwa-v12'), 'A failed migration never discards the old saved content');
for (const req of [request('https://outside.test/file'), request('../other/file'), request('data', { method: 'POST' }), request('assets/video', { headers: new Headers({ Range: 'bytes=0-10' }) })]) {
  assert.equal((await dispatch(req)).response, undefined, 'Leave cross-scope, non-GET and range traffic to the browser');
}
console.log(`PASS: ${manifest.assets.length}-asset install; content-preserving scoped migration and quota failure; immutable shell; awaited cache writes; offline/corrupt/missing responses; HTTP/range handling. Simulated worker events only.`);
