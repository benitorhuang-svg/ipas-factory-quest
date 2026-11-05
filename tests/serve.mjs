import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';

const root = path.resolve('dist'), snapshots = new Map();
let release = 'A', downloadDelay = 0;
function snapshot(version) {
  if (snapshots.has(version)) return snapshots.get(version);
  const context = { self: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'precache.js'), 'utf8'), context);
  const assets = context.self.FACTORY_PRECACHE.assets;
  const files = new Map(assets.map(asset => [asset, fs.readFileSync(path.join(root, asset))]));
  files.set('app-bundle.js', Buffer.from(files.get('app-bundle.js').toString() + `\nwindow.__testRelease = '${version}';\n`));
  const normalizedHTML = files.get('index.html').toString().replace(/(<meta name="factory-release" content=")[^"]+/, '$1generated');
  files.set('index.html', Buffer.from(normalizedHTML));
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8').replace(/\/\/ Cache revision: \S+/, '// Cache revision: generated');
  const digest = crypto.createHash('sha256');
  for (const asset of [...assets.filter(file => file !== 'precache.js'), 'sw.js']) digest.update(asset + '\0').update(asset === 'sw.js' ? worker : files.get(asset));
  const hash = digest.digest('hex').slice(0, 16);
  files.set('precache.js', Buffer.from(`self.FACTORY_PRECACHE=${JSON.stringify({ version: hash, assets })};\n`));
  files.set('sw.js', Buffer.from(worker.replace('// Cache revision: generated', '// Cache revision: ' + hash)));
  files.set('index.html', Buffer.from(normalizedHTML.replace('name="factory-release" content="generated"', `name="factory-release" content="${hash}"`)));
  snapshots.set(version, files); return files;
}
const types = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json' };
http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:4173');
  if (request.method === 'POST' && url.pathname === '/__release') { release = url.searchParams.get('v') === 'B' ? 'B' : 'A'; response.end(release); return; }
  if (request.method === 'POST' && url.pathname === '/__download-delay') { downloadDelay = Math.min(1000, Number(url.searchParams.get('ms')) || 0); response.end('ok'); return; }
  if (!url.pathname.startsWith('/factory/')) { response.writeHead(404).end(); return; }
  const relative = decodeURIComponent(url.pathname.slice('/factory/'.length) || 'index.html');
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) { response.writeHead(404).end('missing'); return; }
  const bytes = snapshot(release).get(relative) || fs.readFileSync(target);
  const send = () => {
    response.writeHead(200, { 'Content-Type': (types[path.extname(relative)] || 'application/octet-stream') + (/\.(js|css|json|html|svg|webmanifest)$/.test(relative) ? '; charset=utf-8' : ''), 'Cache-Control': 'no-store', 'Content-Length': bytes.length });
    response.end(bytes);
  };
  if (request.headers['x-factory-download'] && downloadDelay) setTimeout(send, downloadDelay);
  else send();
}).listen(4173, '127.0.0.1');
