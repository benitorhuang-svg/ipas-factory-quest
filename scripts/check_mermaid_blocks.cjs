const fs = require('fs');
const path = require('path');

const smDir = path.join(__dirname, '..', 'content', 'study-materials');
const files = fs.readdirSync(smDir);

files.forEach(f => {
  const content = fs.readFileSync(path.join(smDir, f), 'utf8');
  const count = (content.match(/class=["']mermaid["']/g) || []).length;
  const preCount = (content.match(/<pre class=["']mermaid["']/g) || []).length;
  if (count || preCount) {
    console.log(f, 'mermaid count:', count, 'preCount:', preCount);
  }
});
