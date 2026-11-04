const fs = require('fs');
const path = require('path');

// 1. Units with visual links
const UNITS = require('./legacy/units.cjs');

const q1 = JSON.parse(fs.readFileSync('content/questions-subject1.json', 'utf8'));
const q2 = JSON.parse(fs.readFileSync('content/questions-subject2.json', 'utf8'));

// 1. Original 100 questions from Subject 1
const orig100 = q1.filter(q => /^[A-Z0-9]{4}-\d{2}$/.test(q.id));

// 2. Original 14 questions moved to L116
const orig14_L116 = q1.filter(q => q.id.startsWith('L116-E')).map((q, i) => ({
  ...q,
  id: 'L116-' + String(i + 1).padStart(2, '0')
}));

// 3. Original 46 questions in q2
const unitCounters = {};
const orig46_Subject2 = q2.slice(0, 46).map(q => {
  unitCounters[q.unit] = (unitCounters[q.unit] || 0) + 1;
  return {
    ...q,
    id: q.unit + '-' + String(unitCounters[q.unit]).padStart(2, '0')
  };
});

// 4. Raw 316 questions from raw-quiz-banks
const topicMap = {
  'M11101': 'L111', 'M11102': 'L112', 'M11103': 'L113',
  'M11201': 'L114', 'M11202': 'L115', 'M11203': 'L116',
  'M12101': 'L121', 'M12102': 'L122', 'M12103': 'L123',
  'M12201': 'L124', 'M12202': 'L125', 'M12203': 'L126'
};
const ansMap = { A: 0, B: 1, C: 2, D: 3 };
const rawQuestions = [];
const rawBanksDir = 'content/raw-quiz-banks';

for (const [topicCode, unitId] of Object.entries(topicMap)) {
  const dir = path.join(rawBanksDir, topicCode);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
  files.forEach((f, idx) => {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const ansIdx = ansMap[raw.answer];
    const stem = raw.prompt.trim();
    const isCalc = /計算|公式|為多少|幾件|幾小時|幾秒|％|%/.test(stem) || /計算/.test(raw.explanation);
    const isScenario = /某|客戶|現場|工廠|產線|機台|工單|批次|作業員/.test(stem);
    const skill = isCalc ? 'calculation' : (isScenario ? 'scenario' : 'concept');

    let hint = '思考 ' + unitId + ' 的核心概念與題目要點。';
    if (raw.explanation) {
      const firstSentence = raw.explanation.split(/。|；/)[0].trim();
      if (firstSentence && firstSentence.length > 5) {
        hint = firstSentence.slice(0, 50) + '。';
      }
    }

    rawQuestions.push({
      id: unitId + '-B' + String(idx + 1).padStart(2, '0'),
      unit: unitId,
      kind: 'choice',
      skill,
      stem,
      options: [raw.options.A.trim(), raw.options.B.trim(), raw.options.C.trim(), raw.options.D.trim()],
      answer: ansIdx,
      hint,
      explanation: raw.explanation.trim()
    });
  });
}

const all = [...orig100, ...orig14_L116, ...orig46_Subject2, ...rawQuestions];

// Separate by subject
const subject1 = all.filter(q => q.unit.startsWith('L11'));
const subject2 = all.filter(q => q.unit.startsWith('L12'));

console.log(`Rebuild complete: Total: ${all.length}, S1: ${subject1.length}, S2: ${subject2.length}`);

// Terminology
const glossary = JSON.parse(fs.readFileSync('content/glossary.json', 'utf8'));

// Study materials (all 28 units)
const studyMaterials = JSON.parse(fs.readFileSync('content/study-materials.json', 'utf8'));

// Guides & PDFs
const formulasMd = fs.readFileSync('docs/歷屆試題與解題技巧/核心公式與計算題彙整.md', 'utf8');
const trapsMd = fs.readFileSync('docs/歷屆試題與解題技巧/考古題盲點與常見陷阱.md', 'utf8');

const pdfList = [
  { name: "115年第一次初級智慧生產_L11_生產與作業管理基礎_公告試題.pdf", title: "115年第一次初級・科目一公告試題", subject: 1, size: "414 KB" },
  { name: "115年第一次初級智慧生產_L12_智慧製造生產線管理基礎_公告試題.pdf", title: "115年第一次初級・科目二公告試題", subject: 2, size: "417 KB" },
  { name: "115年第一次中級智慧生產_L21製造生產與作業管理之實務應用_公告試題.pdf", title: "115年第一次中級・L21實務應用公告試題", subject: 1, size: "443 KB" },
  { name: "115年第一次中級智慧生產_L22智慧製造之設備與製程管理之實務應用_公告試題.pdf", title: "115年第一次中級・L22實務應用公告試題", subject: 2, size: "389 KB" },
  { name: "官方樣題_考科3_智慧生產與管理實務_實作器材及評分標準與答題參考.pdf", title: "考科3 術科實作・器材與評分答題參考", subject: 3, size: "904 KB" },
  { name: "115年度智慧生產工程師能力鑑定簡章(初、中級)_0410_20260410140735.pdf", title: "115年度能力鑑定官方簡章 (初級／中級)", subject: 0, size: "785 KB" },
  { name: "智慧生產工程師職能基準.pdf", title: "經濟部智慧生產工程師職能基準標準", subject: 0, size: "369 KB" }
];

const visualAssets = {
  isa95Interactive: "assets/interactive-diagrams/isa95-smart-factory.html",
  unitSummariesIndex: "assets/interactive-diagrams/unit-summaries/index.html",
  infographics: [
    { id: "competency-3d", title: "智慧生產工程師職能 3D 分解爆炸圖", path: "assets/infographics/智慧生產工程師職能-分解爆炸圖-imagegen-3D-v2.png", desc: "立體剖析生產管理與智動化現場兩大軸心職能能力分佈" },
    { id: "competency-flat", title: "智慧生產工程師職能架構圖 (平面版)", path: "assets/infographics/智慧生產工程師職能-分解爆炸圖.png", desc: "經濟部官方職能基準 10 大關鍵能力與單元映射" },
    { id: "bom-hierarchy", title: "BOM 產品用料結構與多階展開圖", path: "assets/learning-diagrams/bom-hierarchy-v1.png", desc: "解析低階編碼 (Low-Level Code) 與 MRP 邏輯展開關係" },
    { id: "hero-dashboard", title: "智慧工廠戰情中心全景圖", path: "assets/smart-factory-dashboard-hero.png", desc: "MES、SCADA、IIoT 與 ERP 整合戰情總覽" }
  ]
};

// Write files
fs.writeFileSync('content/units.json', JSON.stringify(UNITS, null, 2), 'utf8');
fs.writeFileSync('content/questions-subject1.json', JSON.stringify(subject1, null, 2), 'utf8');
fs.writeFileSync('content/questions-subject2.json', JSON.stringify(subject2, null, 2), 'utf8');

const bundleData = {
  units: UNITS,
  questions: all,
  glossary: glossary,
  studyMaterials: studyMaterials,
  visualAssets: visualAssets,
  formulasMarkdown: formulasMd,
  trapsMarkdown: trapsMd,
  pdfs: pdfList
};

fs.writeFileSync('dist/data.js', `window.FACTORY_QUEST_DATA = ${JSON.stringify(bundleData)};\n`, 'utf8');
console.log('Clean build with study materials and visual assets written to dist/data.js!');
