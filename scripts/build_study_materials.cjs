const fs = require('fs');
const path = require('path');

const smDir = path.join(__dirname, '..', 'content', 'study-materials');
const files = fs.readdirSync(smDir);

const unit3DMap = {
  'M11101': '01_生產管理基本概念_3D.png',
  'M11102': '02_製造流程管理概念_3D.png',
  'M11103': '03_物料管理概論_3D.png',
  'M11201': '04_工業工程概論與標準工時_3D.png',
  'M11202': '05_品質管理與統計製程管制_3D.png',
  'M11203': '06_精實生產與現場績效管理_3D.png',
  'M12101': '07_智慧製造概論與ISA95架構_3D.png',
  'M12102': '08_工業物聯網IIoT與通訊協定_3D.png',
  'M12103': '09_人工智慧AI與機器視覺檢測_3D.png',
  'M12201': '10_網宇實體系統CPS與數位雙生_3D.png',
  'M12202': '11_智動化生產設備與傳送系統_3D.png',
  'M12203': '12_智慧工廠生產模式與MES系統整合_3D.png',
};

const unitIdMap = {
  'M11101': 'L111', 'M11102': 'L112', 'M11103': 'L113',
  'M11201': 'L114', 'M11202': 'L115', 'M11203': 'L116',
  'M12101': 'L121', 'M12102': 'L122', 'M12103': 'L123',
  'M12201': 'L124', 'M12202': 'L125', 'M12203': 'L126'
};

const materials = [];

for (const file of files) {
  if (!file.endsWith('.ts')) continue;
  const content = fs.readFileSync(path.join(smDir, file), 'utf-8');
  
  const topicMatch = content.match(/topicCode:\s*['"]([^'"]+)['"]/);
  const topicCode = topicMatch ? topicMatch[1] : path.basename(file, '.ts');
  
  const commentTitleMatch = content.match(/\/\*\*\s*\n\s*\*\s*([^\n—]+)—\s*([^\n]+)/);
  let title = '';
  if (commentTitleMatch) {
    title = commentTitleMatch[2].trim();
  } else {
    const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (h1Match) title = h1Match[1].replace(/^單元[一二三四五六七八九十百]+[：: ]*/, '').trim();
    else title = topicCode;
  }

  // Summary
  const summaryMatch = content.match(/summary:\s*(["'`])([\s\S]*?)\1\s*,\s*coreConcepts:/);
  const summary = summaryMatch ? summaryMatch[2].replace(/\\"/g, '"').replace(/\\n/g, ' ').trim() : '';

  // Core concepts
  const conceptsMatch = content.match(/coreConcepts:\s*\[([\s\S]*?)\]\s*,/);
  let coreConcepts = [];
  if (conceptsMatch) {
    coreConcepts = conceptsMatch[1]
      .split('\n')
      .map(line => line.trim().replace(/^['"`]|['"`],?$/g, ''))
      .filter(Boolean);
  }

  // Details
  // Find where details: starts
  const detailsIdx = content.indexOf('details:');
  let details = '';
  if (detailsIdx !== -1) {
    const after = content.slice(detailsIdx + 8).trim();
    const quoteChar = after[0];
    if (quoteChar === '"' || quoteChar === "'" || quoteChar === '`') {
      // Find closing quote matching quoteChar
      // To be safe, scan forward
      let i = 1;
      let escaped = false;
      while (i < after.length) {
        const c = after[i];
        if (escaped) {
          escaped = false;
        } else if (c === '\\') {
          escaped = true;
        } else if (c === quoteChar) {
          details = after.slice(1, i);
          break;
        }
        i++;
      }
    }
  }

  // Clean details
  details = details
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, '\n')
    // adjust relative asset paths like ./assets/ or /assets/ to assets/
    .replace(/src=["'](?:\.\/|\/)?assets\//g, 'src="assets/');

  const unitId = unitIdMap[topicCode] || null;
  const diagram3D = unit3DMap[topicCode] ? `assets/learning-units/${unit3DMap[topicCode]}` : null;
  const explainerImg = fs.existsSync(path.join(__dirname, '..', 'dist', 'assets', 'learning-explainers', `${topicCode}-explainer.jpg`))
    ? `assets/learning-explainers/${topicCode}-explainer.jpg`
    : null;
  const interactiveUrl = fs.existsSync(path.join(__dirname, '..', 'dist', 'assets', 'interactive-diagrams', 'unit-summaries', `${topicCode}.html`))
    ? `assets/interactive-diagrams/unit-summaries/${topicCode}.html`
    : null;

  materials.push({
    topicCode,
    unitId,
    title,
    summary,
    coreConcepts,
    diagram3D,
    explainerImg,
    interactiveUrl,
    details
  });
}

// Sort: L111~L116, L121~L126, M13101~M13201, M21101~M22301, APPX01~APPX05
materials.sort((a, b) => a.topicCode.localeCompare(b.topicCode));

console.log(`Successfully parsed ${materials.length} materials.`);
materials.slice(0, 5).forEach(m => {
  console.log(`[${m.topicCode}] ${m.unitId || 'N/A'} - ${m.title}: 3D=${!!m.diagram3D}, Explainer=${!!m.explainerImg}, Interactive=${!!m.interactiveUrl}, detailsLen=${m.details.length}`);
});

fs.writeFileSync(path.join(__dirname, '..', 'content', 'study-materials.json'), JSON.stringify(materials, null, 2), 'utf-8');
console.log('Saved to content/study-materials.json');
