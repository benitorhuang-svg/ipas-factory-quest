import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '../dist');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return ['vendor', 'previews'].includes(entry.name) ? [] : walk(file);
    return /\.(png|jpe?g)$/i.test(entry.name) ? [file] : [];
  });
}
fs.mkdirSync(path.join(root, 'assets/previews'), { recursive: true });
const previews = {};
let originalBytes = 0, previewBytes = 0;
for (const file of walk(path.join(root, 'assets'))) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  const source = fs.readFileSync(file);
  const hash = crypto.createHash('sha256').update(source).digest('hex').slice(0, 16);
  const name = `assets/previews/${hash}.webp`, target = path.join(root, name);
  if (!fs.existsSync(target)) await sharp(source).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 78, effort: 5 }).toFile(target);
  const meta = await sharp(target).metadata();
  previews[relative] = { src: name, width: meta.width, height: meta.height, bytes: fs.statSync(target).size };
  originalBytes += source.length; previewBytes += previews[relative].bytes;
}
fs.writeFileSync(path.join(root, 'preview-data.js'), `window.FactoryPreviews = ${JSON.stringify(previews)};\n`);
console.log(`Built ${Object.keys(previews).length} previews: ${originalBytes} -> ${previewBytes} bytes; originals preserved.`);
