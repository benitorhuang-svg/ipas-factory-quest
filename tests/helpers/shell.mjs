import fs from 'node:fs';
export const shell = JSON.parse(fs.readFileSync('content/shell-assets.json', 'utf8'));
export function bundled(file) {
  const bundle = file.endsWith('.css') ? 'shell-bundle.css' : 'app-bundle.js';
  return shell[file.endsWith('.css') ? 'styles' : 'scripts'].includes(file)
    && fs.readFileSync(`dist/${bundle}`, 'utf8').includes(`/* Source: ${file} */`);
}
