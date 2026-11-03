const fs = require('fs');
const path = require('path');
const srcDir = 'C:\\Users\\benit\\Desktop\\iPAS智慧生產工程師';

// Check cards
const cardsFile = path.join(srcDir, 'src/game/cards/index.ts');
let cardCount = 0;
if (fs.existsSync(cardsFile)) {
  const content = fs.readFileSync(cardsFile, 'utf-8');
  const matches = content.match(/id:\s*['"`]([^'"`]+)['"`]/g);
  cardCount = matches ? matches.length : 0;
  console.log('Cards found:', cardCount);
}

// Check levels
const levelsFile = path.join(srcDir, 'src/game/levels/index.ts');
let levelCount = 0;
if (fs.existsSync(levelsFile)) {
  const content = fs.readFileSync(levelsFile, 'utf-8');
  const matches = content.match(/id:\s*['"`]([^'"`]+)['"`]/g);
  levelCount = matches ? matches.length : 0;
  console.log('Levels found:', levelCount);
}

// Check study materials
const smDir = path.join(srcDir, 'src/data/study-materials');
const smFiles = fs.readdirSync(smDir);
console.log('Study materials count:', smFiles.length);
