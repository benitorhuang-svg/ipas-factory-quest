// Cache revision: e91d4fad8e5a24df
importScripts('precache.js');
const SCOPE = new URL(self.registration.scope);
const PREFIX = 'factory-quest-pwa-' + encodeURIComponent(SCOPE.pathname) + '-';
const CACHE_NAME = PREFIX + self.FACTORY_PRECACHE.version;
const CONTENT_CACHE = 'factory-quest-content-' + encodeURIComponent(SCOPE.pathname) + '-v1';
const ASSETS = self.FACTORY_PRECACHE.assets;
const CORE = new Set(ASSETS.map(asset => new URL(asset, SCOPE).href));
const INDEX = new URL('index.html', SCOPE).href;
const inScope = request => {
  const url = new URL(request.url || request);
  return url.origin === SCOPE.origin && url.pathname.startsWith(SCOPE.pathname);
};
const isContent = request => new URL(request.url || request).pathname.startsWith(SCOPE.pathname + 'assets/') && !CORE.has(request.url || request);

self.addEventListener('install', event => {
  // Keep the new version waiting until every page using the old release closes.
  // This includes pages with unfinished exams and delayed renderer requests.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'FACTORY_VERSION') event.ports?.[0]?.postMessage({ version: self.FACTORY_PRECACHE.version });
  if (event.data?.type === 'FACTORY_ACTIVATE_ON_BOOT' && event.source?.id) {
    event.waitUntil((async () => {
      const clients = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).filter(inScope);
      // A freshly reopened single page can otherwise reattach to the old worker
      // before default activation runs, keeping an update waiting indefinitely.
      if (clients.length === 1 && clients[0].id === event.source.id) await self.skipWaiting();
    })());
  }
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const content = await caches.open(CONTENT_CACHE);
    for (const name of await caches.keys()) {
      if (name === CACHE_NAME || (!name.startsWith(PREFIX) && !/^factory-quest-pwa-v\d+$/.test(name))) continue;
      const previous = await caches.open(name);
      const requests = await previous.keys();
      let preserved = true;
      for (const request of requests.filter(request => inScope(request) && isContent(request))) {
        try {
          if (!await content.match(request)) {
            const response = await previous.match(request);
            if (response) await content.put(request, response);
          }
        } catch { preserved = false; }
      }
      // Mixed legacy caches may also contain another installation's resources.
      if (preserved && requests.every(inScope)) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

function offline(request) {
  const url = new URL(request.url);
  const headers = { 'Cache-Control': 'no-store', 'X-Factory-Offline': 'uncached' };
  if (request.destination === 'image' || /\.(?:png|jpe?g|svg|webp)$/i.test(url.pathname)) {
    headers['Content-Type'] = 'image/svg+xml; charset=utf-8';
    return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="#f0f3eb"/><text x="400" y="210" text-anchor="middle" font-size="28" fill="#46634e">這張圖尚未儲存於離線快取</text><text x="400" y="255" text-anchor="middle" font-size="20" fill="#657664">恢復連線後，重新開啟即可閱讀</text></svg>', { status: 503, headers });
  }
  if (request.mode === 'navigate' || /\.html$/i.test(url.pathname)) {
    headers['Content-Type'] = 'text/html; charset=utf-8';
    return new Response('<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>此頁尚未儲存</title><style>body{margin:0;padding:32px;background:#f5f6f2;color:#245b45;font:16px/1.9 system-ui,sans-serif}main{max-width:520px;margin:12vh auto}h1{font-size:24px}p{color:#617363}button{font:inherit;padding:10px 20px;color:#fff;background:#245b45;border:0;border-radius:8px;cursor:pointer}</style><main><h1>這份內容尚未儲存於離線快取</h1><p>目前無法連線。恢復網路後重新載入，即可開啟並儲存這份內容。</p><button onclick="location.reload()">重新載入</button></main></html>', { status: 503, headers });
  }
  headers['Content-Type'] = /\.css$/i.test(url.pathname) ? 'text/css; charset=utf-8' : /\.js$/i.test(url.pathname) ? 'application/javascript; charset=utf-8' : 'text/plain; charset=utf-8';
  return new Response('/* 此資源尚未儲存，恢復連線後請重新載入。 */', { status: 503, headers });
}

async function network(request, cache, event, key = request) {
  const response = await fetch(request);
  if (response.status === 200 && response.type !== 'opaque' && cache) {
    event.waitUntil(cache.put(key, response.clone()).catch(() => {}));
  }
  return response;
}

async function handle(event) {
  const request = event.request;
  const url = new URL(request.url);
  const rootNavigation = request.mode === 'navigate' && (url.pathname === SCOPE.pathname || url.pathname === new URL(INDEX).pathname);
  const key = rootNavigation ? INDEX : request;
  const core = rootNavigation || CORE.has(request.url);
  let cache;
  try { cache = await caches.open(core ? CACHE_NAME : CONTENT_CACHE); } catch {}
  if (!core && request.headers?.has('X-Factory-Download')) {
    try { return await network(request, cache, event); } catch { return offline(request); }
  }
  let cached;
  try { cached = await cache?.match(key); } catch {}
  if (!core && !cached) {
    try { cached = await caches.match(request); } catch {}
  }
  // Installed shell files are immutable within one release. Never mix modules
  // from the next deployment into a currently running version.
  if (cached && core) return cached;
  if (cached) {
    event.waitUntil(network(request, cache, event).catch(() => {}));
    return cached;
  }
  try { return await network(request, cache, event, key); }
  catch { return offline(request); }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !inScope(event.request) || event.request.headers?.has('range')) return;
  event.respondWith(handle(event));
});
