const fs = require('fs');
const path = require('path');

const smDir = path.join(__dirname, '..', 'content', 'study-materials');
const files = fs.readdirSync(smDir);

const materials = [];

for (const file of files) {
  if (!file.endsWith('.ts')) continue;
  const content = fs.readFileSync(path.join(smDir, file), 'utf-8');
  
  // Extract topicCode
  const topicMatch = content.match(/topicCode:\s*['"]([^'"]+)['"]/);
  const topicCode = topicMatch ? topicMatch[1] : path.basename(file, '.ts');
  
  // Extract title from comment or header
  const titleMatch = content.match(/\/\*\*\s*\n\s*\*\s*([^\n—]+)—\s*([^\n]+)/) || content.match(/<h1[^>]*>([^<]+)<\/h1>/);
  let title = '';
  if (titleMatch) {
    title = titleMatch[2] ? titleMatch[2].trim() : titleMatch[1].trim();
  }

  // Extract summary
  const summaryMatch = content.match(/summary:\s*["'`]([\s\S]*?)["'`]\s*,\s*coreConcepts:/);
  const summary = summaryMatch ? summaryMatch[1].replace(/\\"/g, '"').trim() : '';

  // Extract coreConcepts
  const conceptsMatch = content.match(/coreConcepts:\s*\[([\s\S]*?)\]/);
  let coreConcepts = [];
  if (conceptsMatch) {
    coreConcepts = conceptsMatch[1]
      .split('\n')
      .map(line => line.trim().replace(/^['"]|['"],?$/g, ''))
      .filter(Boolean);
  }

  // Extract details HTML
  const detailsMatch = content.match(/details:\s*["'`]([\s\S]*?)["'`]\s*[,;]?\s*\n\};?/);
  let details = '';
  if (detailsMatch) {
    details = detailsMatch[1]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .trim();
  }

  materials.push({
    file,
    topicCode,
    title,
    summary,
    coreConcepts,
    hasDetails: details.length > 0,
    detailsLength: details.length
  });
}

console.log(`Parsed ${materials.length} study materials:`);
materials.forEach(m => {
  console.log(`- [${m.topicCode}] ${m.title} (${m.coreConcepts.length} concepts, details: ${m.detailsLength} chars)`);
});
