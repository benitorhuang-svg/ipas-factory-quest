const fs = require('fs');
const path = require('path');

// 1. Units
const UNITS = [
  {
    id: "L111",
    subject: 1,
    title: "生產管理基本概念",
    room: "生產指揮室",
    mission: "接下訂單，排出做得到的生產計畫。",
    icon: "calendar",
    color: "mint",
    topics: ["S&OP 與 MPS 主生產排程", "生產形態 (MTS/MTO/ATO/ETO)", "前向與後向排程邏輯", "有限與無限負荷產能規劃", "生產控制與計畫受控變更"],
    badge: "排產指揮官",
    takeaway: "先對齊需求與產能，再安排品項、數量與時間。"
  },
  {
    id: "L112",
    subject: 1,
    title: "製造流程管理概念",
    room: "流程設計所",
    mission: "連好工序、拆開用料，讓現場照標準運作。",
    icon: "route",
    color: "blue",
    topics: ["途程規劃與工廠設備佈置", "EBOM 工程清單與 MBOM 製造清單", "多階 BOM 與低階編碼 (Low-Level Code)", "工序相依、瓶頸與平衡", "SOP 標準作業程序與版本管制"],
    badge: "流程建築師",
    takeaway: "BOM 管用料結構、途程管作業順序、SOP 管執行做法。"
  },
  {
    id: "L113",
    subject: 1,
    title: "物料管理概論",
    room: "物料補給站",
    mission: "在正確時間備齊物料，讓缺料與囤料都減少。",
    icon: "box",
    color: "amber",
    topics: ["MRP 邏輯展開與淨需求計算", "採購交期與前置時間 (LT)", "現場倉在製品 (WIP) 管理", "ABC 分類管制與 EOQ/EPQ 模型", "物料收發、批次狀態與全歷程追溯"],
    badge: "補給規劃師",
    takeaway: "需求日之後才到的物料不能扣抵當期；安全庫存是期末保留量。"
  },
  {
    id: "L114",
    subject: 1,
    title: "工業工程概論與標準工時",
    room: "效率研究室",
    mission: "找出真正的瓶頸，把時間變成有效產出。",
    icon: "gauge",
    color: "purple",
    topics: ["工作研究與 ECRS 改善手法", "17 動素與動作經濟原則", "觀測時間、正常時間與標準工時 (ST)", "寬放率基準 (外加法 vs 內含法)", "節拍時間 (Takt)、產能利用率與效率"],
    badge: "效率解題王",
    takeaway: "最慢站限制穩態產出；寬放公式先看題目指定基準。"
  },
  {
    id: "L115",
    subject: 1,
    title: "品質管理與統計製程管制",
    room: "品質偵查局",
    mission: "辨識異常、選對工具，讓改善有證據。",
    icon: "shield",
    color: "rose",
    topics: ["PAF 四類品質成本分類", "管制圖選擇 (X-bar/R) 與判讀", "管制界限 vs 規格界限", "製程能力指數 (Cp/Cpk)", "品管七大手法、PDCA 與 TQM 全面品質管制"],
    badge: "品質守門員",
    takeaway: "製程穩定不等於符合規格；相關不等於因果；預防成本重於失敗成本。"
  },
  {
    id: "L116",
    subject: 1,
    title: "精實生產與現場績效管理",
    room: "精實推進所",
    mission: "消除現場浪費，落實 TPM 與 OEE 綜合效率提升。",
    icon: "flame",
    color: "mint",
    topics: ["TPS 七大浪費 (Muda，以過量生產為首)", "看板拉動系統 (Kanban) 與現場 5S", "防呆法 (Poka-Yoke) 五大層級", "全面生產維護 (TPM) 八大支柱", "OEE 設備綜合效率 (A × P × Q) 與六大損失"],
    badge: "精實大師",
    takeaway: "停機查 A、速度查 P、不良查 Q；不增值的活動即是浪費。"
  },
  {
    id: "L121",
    subject: 2,
    title: "智慧製造概論與 ISA-95 架構",
    room: "智造核心室",
    mission: "貫通企業金字塔，打通 IT 與 OT 垂直與水平整合。",
    icon: "network",
    color: "mint",
    topics: ["工業 4.0 核心演進與三大要素", "ISA-95 五層金字塔架構模型", "IT 與 OT 系統融合挑戰與邊界", "垂直整合與端到端水平價值鏈", "精實自動化與數位轉型原則"],
    badge: "智造架構師",
    takeaway: "Level 4 管企業營運、Level 3 管製造執行、Level 0-2 管現場控制。"
  },
  {
    id: "L122",
    subject: 2,
    title: "工業物聯網 IIoT 與通訊協定",
    room: "聯網感測站",
    mission: "採集設備訊號，以工業協定安全傳遞與邊緣運算。",
    icon: "wrench",
    color: "blue",
    topics: ["工業感測元件 (光電/接近/振動/溫度)", "Modbus RTU / TCP 暫存器通訊", "OPC UA 跨平台資訊模型與語意表達", "MQTT 發布／訂閱架構與輕量傳輸", "邊緣運算 (Edge Computing) vs 雲端平台架構"],
    badge: "物聯先鋒",
    takeaway: "OT 通訊標準化首選 OPC UA/MQTT，及時於邊緣進行資料清洗與預處理。"
  },
  {
    id: "L123",
    subject: 2,
    title: "人工智慧 AI 與機器視覺檢測",
    room: "AI 視覺中心",
    mission: "運用機器學習與 AOI 光學檢測，精準攔截缺陷。",
    icon: "eye",
    color: "purple",
    topics: ["監督式學習 (分類/迴歸) 與非監督式分群", "AOI 自動光學檢測流程與打光取像", "過殺率 (Overkill) 與漏判率 (Underkill)", "混淆矩陣指標 (準確率、精確率、召回率)", "避免資料洩漏 (Data Leakage) 與過度擬合 (Overfitting)"],
    badge: "視覺辨識官",
    takeaway: "檢測成敗八成取決於光學打光；演算法嚴防資料洩漏與過度擬合。"
  },
  {
    id: "L124",
    subject: 2,
    title: "網宇實體系統 CPS 與數位雙生",
    room: "數位雙生館",
    mission: "建構虛擬鏡像，落實閉迴路即時回饋控制。",
    icon: "brain",
    color: "amber",
    topics: ["CPS 虛實整合系統 5C 架構層級", "數位雙生 (Digital Twin) 實體、虛擬與資料三維", "虛實同步與閉迴路回饋控制 (Closed-loop)", "虛擬調試 (Virtual Commissioning) 降本增效", "以模型驅動之即時預測與自主決策"],
    badge: "虛實導航員",
    takeaway: "5C 依序為連接、轉換、網路、認知、配置；閉迴路才算完整 CPS。"
  },
  {
    id: "L125",
    subject: 2,
    title: "智動化生產設備與傳送系統",
    room: "智動控制塔",
    mission: "掌握 PLC 控制邏輯、工業機器人與 AGV/AMR 自主移動。",
    icon: "factory",
    color: "mint",
    topics: ["PLC 循環掃描週期 (輸入取樣/程式執行/輸出刷新)", "工業機器人自由度與協作機器人 (Cobot)", "設備原點復歸 (Homing) 與安全互鎖連動", "AGV 磁導/二維碼 vs AMR SLAM 自主導航", "自動倉儲系統 (AS/RS) 與穿梭車整合"],
    badge: "自動化工程師",
    takeaway: "PLC 掃描週期決定即時性；AMR 比 AGV 具備更強之自主避障彈性。"
  },
  {
    id: "L126",
    subject: 2,
    title: "智慧工廠生產模式與 MES 整合",
    room: "MES 營運中心",
    mission: "整合 ERP 與 MES，實現即時派工、追溯與 Run-to-Run 管制。",
    icon: "chart",
    color: "rose",
    topics: ["MES 製造執行系統核心模組功能", "ERP 與 MES 雙向串接邊界與職能分工", "工單生命週期、即時報工與狀態追蹤", "Run-to-Run (R2R) 批次間回饋控制機制", "條碼／RFID 生產履歷與電子看板管理"],
    badge: "系統整合專家",
    takeaway: "ERP 管企業資源、MES 管製造執行；R2R 達成批次間動態閉環補正。"
  }
];

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

// Parse Terminology
const termFile = fs.readFileSync('content/terminology.ts', 'utf8');
const termsMatch = termFile.match(/const TERMS:\s*readonly Term\[\]\s*=\s*(\[[\s\S]*?\]);/);
let glossary = [];
if (termsMatch) {
  glossary = eval(termsMatch[1]);
}

// Guides & PDFs
const formulasMd = fs.readFileSync('docs/歷屆試題與解題技巧/核心公式與計算題彙整.md', 'utf8');
const trapsMd = fs.readFileSync('docs/歷屆試題與解題技巧/考古題盲點與常見陷阱.md', 'utf8');

const pdfList = [
  { name: "115年第一次初級_L11_生產與作業管理基礎_公告試題.pdf", title: "115年第一次初級・科目一公告試題", subject: 1, size: "414 KB" },
  { name: "115年第一次初級_L12_智慧製造生產線管理基礎_公告試題.pdf", title: "115年第一次初級・科目二公告試題", subject: 2, size: "417 KB" },
  { name: "115年第一次中級智慧生產_L21製造生產與作業管理之實務應用_公告試題.pdf", title: "115年第一次中級・L21實務應用公告試題", subject: 1, size: "443 KB" },
  { name: "115年第一次中級智慧生產_L22智慧製造之設備與製程管理之實務應用_公告試題.pdf", title: "115年第一次中級・L22實務應用公告試題", subject: 2, size: "389 KB" },
  { name: "官方樣題_考科3_智慧生產與管理實務_實作器材及評分標準與答題參考.pdf", title: "考科3 術科實作・器材與評分答題參考", subject: 3, size: "904 KB" },
  { name: "115年度智慧生產工程師能力鑑定簡章(初、中級)_0410_20260410140735.pdf", title: "115年度能力鑑定官方簡章 (初級／中級)", subject: 0, size: "785 KB" },
  { name: "智慧生產工程師職能基準.pdf", title: "經濟部智慧生產工程師職能基準標準", subject: 0, size: "369 KB" }
];

// Write files
fs.writeFileSync('content/units.json', JSON.stringify(UNITS, null, 2), 'utf8');
fs.writeFileSync('content/questions-subject1.json', JSON.stringify(subject1, null, 2), 'utf8');
fs.writeFileSync('content/questions-subject2.json', JSON.stringify(subject2, null, 2), 'utf8');
fs.writeFileSync('content/glossary.json', JSON.stringify(glossary, null, 2), 'utf8');

const bundleData = {
  units: UNITS,
  questions: all,
  glossary: glossary,
  formulasMarkdown: formulasMd,
  trapsMarkdown: trapsMd,
  pdfs: pdfList
};

fs.writeFileSync('dist/data.js', `window.FACTORY_QUEST_DATA = ${JSON.stringify(bundleData)};\n`, 'utf8');
console.log('Clean build written to content/ and dist/data.js!');
