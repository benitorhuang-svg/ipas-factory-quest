const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\benit\\Desktop\\iPAS智慧生產工程師';
const dstDir = 'C:\\Users\\benit\\Desktop\\ipas-factory-quest-source';

function copyRecursive(src, dst) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
    fs.readdirSync(src).forEach(child => {
      copyRecursive(path.join(src, child), path.join(dst, child));
    });
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

// 1. Copy public/assets to dist/assets
console.log('Copying public/assets...');
copyRecursive(path.join(srcDir, 'public', 'assets'), path.join(dstDir, 'dist', 'assets'));

// 2. Copy output/infographics to dist/assets/infographics
console.log('Copying output/infographics...');
copyRecursive(path.join(srcDir, 'output', 'infographics'), path.join(dstDir, 'dist', 'assets', 'infographics'));

// 3. Copy src/data/study-materials to content/study-materials
console.log('Copying study-materials...');
copyRecursive(path.join(srcDir, 'src', 'data', 'study-materials'), path.join(dstDir, 'content', 'study-materials'));

console.log('Done copying all assets.');
