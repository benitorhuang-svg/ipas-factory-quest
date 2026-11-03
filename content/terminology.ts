interface Term {
  readonly abbreviation: string;
  readonly chinese: string;
  readonly english: string;
}

interface ChineseTerm extends Term {
  readonly aliases: readonly string[];
}

const TERMS: readonly Term[] = [
  { abbreviation: '4M1E', chinese: '人、機、料、法與環境', english: 'Man-Machine-Material-Method-Environment' },
  { abbreviation: '5S', chinese: '整理、整頓、清掃、清潔與素養', english: 'Sort-Set in Order-Shine-Standardize-Sustain' },
  { abbreviation: '5W2H', chinese: '七何分析法', english: 'What-Why-Where-When-Who-How-How Much' },
  { abbreviation: '8D', chinese: '八步驟問題解決法', english: 'Eight Disciplines Problem Solving' },
  { abbreviation: 'ABC', chinese: 'ABC 存貨分類法', english: 'ABC Inventory Classification' },
  { abbreviation: 'AGV', chinese: '自動導引車', english: 'Automated Guided Vehicle' },
  { abbreviation: 'AI', chinese: '人工智慧', english: 'Artificial Intelligence' },
  { abbreviation: 'AMR', chinese: '自主移動機器人', english: 'Autonomous Mobile Robot' },
  { abbreviation: 'AOI', chinese: '自動光學檢測', english: 'Automated Optical Inspection' },
  { abbreviation: 'AQL', chinese: '允收品質水準', english: 'Acceptable Quality Limit' },
  { abbreviation: 'AS/RS', chinese: '自動化倉儲系統', english: 'Automated Storage and Retrieval System' },
  { abbreviation: 'ATO', chinese: '接單組裝', english: 'Assemble to Order' },
  { abbreviation: 'ATP', chinese: '可承諾量', english: 'Available to Promise' },
  { abbreviation: 'BD', chinese: '平衡損失', english: 'Balance Delay' },
  { abbreviation: 'BOM', chinese: '物料清單', english: 'Bill of Materials' },
  { abbreviation: 'CAD', chinese: '電腦輔助設計', english: 'Computer-Aided Design' },
  { abbreviation: 'CAE', chinese: '電腦輔助工程', english: 'Computer-Aided Engineering' },
  { abbreviation: 'CAM', chinese: '電腦輔助製造', english: 'Computer-Aided Manufacturing' },
  { abbreviation: 'CAPP', chinese: '電腦輔助工藝規劃', english: 'Computer-Aided Process Planning' },
  { abbreviation: 'CBT', chinese: '電腦化測驗', english: 'Computer-Based Test' },
  { abbreviation: 'CNC', chinese: '電腦數值控制', english: 'Computer Numerical Control' },
  { abbreviation: 'CNN', chinese: '卷積神經網路', english: 'Convolutional Neural Network' },
  { abbreviation: 'Cobot', chinese: '協作型機器人', english: 'Collaborative Robot' },
  { abbreviation: 'CODP', chinese: '客戶訂單解耦點', english: 'Customer Order Decoupling Point' },
  { abbreviation: 'COGS', chinese: '銷貨成本', english: 'Cost of Goods Sold' },
  { abbreviation: 'COQ', chinese: '品質成本', english: 'Cost of Quality' },
  { abbreviation: 'Cp', chinese: '製程能力指數', english: 'Process Capability Index' },
  { abbreviation: 'Cpk', chinese: '製程能力指數', english: 'Process Capability Index' },
  { abbreviation: 'CPS', chinese: '網宇實體系統', english: 'Cyber-Physical System' },
  { abbreviation: 'CR', chinese: '臨界比法則', english: 'Critical Ratio' },
  { abbreviation: 'CRP', chinese: '產能需求規劃', english: 'Capacity Requirements Planning' },
  { abbreviation: 'CT', chinese: '週期時間', english: 'Cycle Time' },
  { abbreviation: 'CTQ', chinese: '品質關鍵特性', english: 'Critical to Quality' },
  { abbreviation: 'DCS', chinese: '分散式控制系統', english: 'Distributed Control System' },
  { abbreviation: 'DPM', chinese: '直接零件標記', english: 'Direct Part Marking' },
  { abbreviation: 'DT', chinese: '數位雙生', english: 'Digital Twin' },
  { abbreviation: 'E-SOP', chinese: '電子標準作業程序', english: 'Electronic Standard Operating Procedure' },
  { abbreviation: 'EBOM', chinese: '工程物料清單', english: 'Engineering Bill of Materials' },
  { abbreviation: 'ECM', chinese: '工程變更管理', english: 'Engineering Change Management' },
  { abbreviation: 'ECN', chinese: '工程變更通知', english: 'Engineering Change Notice' },
  { abbreviation: 'ECO', chinese: '工程變更命令', english: 'Engineering Change Order' },
  { abbreviation: 'ECR', chinese: '工程變更申請', english: 'Engineering Change Request' },
  { abbreviation: 'ECRS', chinese: '取消、合併、重排與簡化原則', english: 'Eliminate-Combine-Rearrange-Simplify' },
  { abbreviation: 'EDD', chinese: '最早交期優先', english: 'Earliest Due Date' },
  { abbreviation: 'EOQ', chinese: '經濟訂購量', english: 'Economic Order Quantity' },
  { abbreviation: 'EPQ', chinese: '經濟生產量', english: 'Economic Production Quantity' },
  { abbreviation: 'ERP', chinese: '企業資源規劃', english: 'Enterprise Resource Planning' },
  { abbreviation: 'ETO', chinese: '接單設計生產', english: 'Engineer to Order' },
  { abbreviation: 'FAI', chinese: '首件檢驗', english: 'First Article Inspection' },
  { abbreviation: 'FBD', chinese: '功能方塊圖', english: 'Function Block Diagram' },
  { abbreviation: 'FCFS', chinese: '先到先服務', english: 'First-Come First-Served' },
  { abbreviation: 'FEFO', chinese: '先到期先出', english: 'First-Expired First-Out' },
  { abbreviation: 'FFT', chinese: '快速傅立葉轉換', english: 'Fast Fourier Transform' },
  { abbreviation: 'FG', chinese: '最終成品', english: 'Finished Goods' },
  { abbreviation: 'FMEA', chinese: '失效模式與效應分析', english: 'Failure Mode and Effects Analysis' },
  { abbreviation: 'FMS', chinese: '彈性製造系統', english: 'Flexible Manufacturing System' },
  { abbreviation: 'FOQ', chinese: '固定訂購量', english: 'Fixed Order Quantity' },
  { abbreviation: 'GR', chinese: '毛需求', english: 'Gross Requirements' },
  { abbreviation: 'HF', chinese: '高頻', english: 'High Frequency' },
  { abbreviation: 'HiL', chinese: '硬體迴路模擬', english: 'Hardware in the Loop' },
  { abbreviation: 'HMI', chinese: '人機介面', english: 'Human-Machine Interface' },
  { abbreviation: 'HMLV', chinese: '高混合低產量', english: 'High Mix Low Volume' },
  { abbreviation: 'IE', chinese: '工業工程', english: 'Industrial Engineering' },
  { abbreviation: 'IEC', chinese: '國際電工委員會', english: 'International Electrotechnical Commission' },
  { abbreviation: 'IIoT', chinese: '工業物聯網', english: 'Industrial Internet of Things' },
  { abbreviation: 'IMU', chinese: '慣性量測單元', english: 'Inertial Measurement Unit' },
  { abbreviation: 'IP', chinese: '網際網路協定', english: 'Internet Protocol' },
  { abbreviation: 'iPAS', chinese: '產業人才能力鑑定', english: 'Industry Professional Assessment System' },
  { abbreviation: 'IPC', chinese: '工業電腦', english: 'Industrial Personal Computer' },
  { abbreviation: 'IPQC', chinese: '製程品質管制', english: 'In-Process Quality Control' },
  { abbreviation: 'IQC', chinese: '進料品質管制', english: 'Incoming Quality Control' },
  { abbreviation: 'ISA', chinese: '國際自動化學會', english: 'International Society of Automation' },
  { abbreviation: 'ISA-95', chinese: '企業控制系統整合標準', english: 'Enterprise-Control System Integration' },
  { abbreviation: 'ISO', chinese: '國際標準化組織', english: 'International Organization for Standardization' },
  { abbreviation: 'IT', chinese: '資訊技術', english: 'Information Technology' },
  { abbreviation: 'JIT', chinese: '及時生產', english: 'Just-in-Time' },
  { abbreviation: 'KPI', chinese: '關鍵績效指標', english: 'Key Performance Indicator' },
  { abbreviation: 'LE', chinese: '線平衡效率', english: 'Line Efficiency' },
  { abbreviation: 'LiDAR', chinese: '光學雷達', english: 'Light Detection and Ranging' },
  { abbreviation: 'LSL', chinese: '規格下限', english: 'Lower Specification Limit' },
  { abbreviation: 'LT', chinese: '生產前置時間', english: 'Lead Time' },
  { abbreviation: 'MBAP', chinese: 'Modbus 應用協定標頭', english: 'Modbus Application Protocol' },
  { abbreviation: 'MBOM', chinese: '製造物料清單', english: 'Manufacturing Bill of Materials' },
  { abbreviation: 'ME', chinese: '製造工程', english: 'Manufacturing Engineering' },
  { abbreviation: 'MES', chinese: '製造執行系統', english: 'Manufacturing Execution System' },
  { abbreviation: 'MESA', chinese: '製造企業解決方案協會', english: 'Manufacturing Enterprise Solutions Association' },
  { abbreviation: 'MESA-11', chinese: '製造企業解決方案協會第 11 項模型', english: 'Manufacturing Enterprise Solutions Association-11' },
  { abbreviation: 'MLT', chinese: '製造前置時間', english: 'Manufacturing Lead Time' },
  { abbreviation: 'Modbus', chinese: 'Modbus 工業通訊協定', english: 'Modbus Protocol' },
  { abbreviation: 'MOM', chinese: '製造營運管理', english: 'Manufacturing Operations Management' },
  { abbreviation: 'MPI', chinese: '製造程序指導書', english: 'Manufacturing Process Instruction' },
  { abbreviation: 'MPS', chinese: '主生產排程', english: 'Master Production Schedule' },
  { abbreviation: 'MQTT', chinese: '訊息佇列遙測傳輸', english: 'Message Queuing Telemetry Transport' },
  { abbreviation: 'MRP', chinese: '物料需求規劃', english: 'Material Requirements Planning' },
  { abbreviation: 'MSA', chinese: '量測系統分析', english: 'Measurement System Analysis' },
  { abbreviation: 'MTBF', chinese: '平均故障間隔時間', english: 'Mean Time Between Failures' },
  { abbreviation: 'MTO', chinese: '接單生產', english: 'Make to Order' },
  { abbreviation: 'MTS', chinese: '備貨生產', english: 'Make to Stock' },
  { abbreviation: 'MTTR', chinese: '平均修復時間', english: 'Mean Time To Repair' },
  { abbreviation: 'NR', chinese: '淨需求', english: 'Net Requirements' },
  { abbreviation: 'NT', chinese: '正常工時', english: 'Normal Time' },
  { abbreviation: 'OEE', chinese: '整體設備效率', english: 'Overall Equipment Effectiveness' },
  { abbreviation: 'OPC', chinese: '開放式平台通訊', english: 'Open Platform Communications' },
  { abbreviation: 'OPC UA', chinese: '開放式平台通訊統一架構', english: 'Open Platform Communications Unified Architecture' },
  { abbreviation: 'OQC', chinese: '出貨品質管制', english: 'Outgoing Quality Control' },
  { abbreviation: 'OT', chinese: '營運技術', english: 'Operational Technology' },
  { abbreviation: 'PAC', chinese: '可程式自動化控制器', english: 'Programmable Automation Controller' },
  { abbreviation: 'PAF', chinese: '預防、鑑定與失敗品質成本', english: 'Prevention-Appraisal-Failure' },
  { abbreviation: 'PC', chinese: '生產管制', english: 'Production Control' },
  { abbreviation: 'PCA', chinese: '主成分分析', english: 'Principal Component Analysis' },
  { abbreviation: 'PCB', chinese: '印刷電路板', english: 'Printed Circuit Board' },
  { abbreviation: 'PdM', chinese: '預測性維護', english: 'Predictive Maintenance' },
  { abbreviation: 'PHM', chinese: '預後與健康管理', english: 'Prognostics and Health Management' },
  { abbreviation: 'PID', chinese: '比例、積分、微分控制', english: 'Proportional-Integral-Derivative Control' },
  { abbreviation: 'PLC', chinese: '可程式邏輯控制器', english: 'Programmable Logic Controller' },
  { abbreviation: 'PLM', chinese: '產品全生命週期管理', english: 'Product Lifecycle Management' },
  { abbreviation: 'PM', chinese: '預防保養', english: 'Preventive Maintenance' },
  { abbreviation: 'POH', chinese: '預計現有庫存', english: 'Projected On Hand' },
  { abbreviation: 'PPM', chinese: '每百萬件不良數', english: 'Parts Per Million' },
  { abbreviation: 'PWA', chinese: '漸進式網頁應用程式', english: 'Progressive Web App' },
  { abbreviation: 'QMS', chinese: '品質管理系統', english: 'Quality Management System' },
  { abbreviation: 'QoS', chinese: '服務品質', english: 'Quality of Service' },
  { abbreviation: 'QPA', chinese: '每組裝件用量', english: 'Quantity Per Assembly' },
  { abbreviation: 'R&D', chinese: '研究與開發', english: 'Research and Development' },
  { abbreviation: 'RCCP', chinese: '粗略產能規劃', english: 'Rough-Cut Capacity Planning' },
  { abbreviation: 'ResNet', chinese: '殘差網路', english: 'Residual Network' },
  { abbreviation: 'RFID', chinese: '無線射頻辨識', english: 'Radio Frequency Identification' },
  { abbreviation: 'RMA', chinese: '退料授權', english: 'Return Material Authorization' },
  { abbreviation: 'RMS', chinese: '均方根值', english: 'Root Mean Square' },
  { abbreviation: 'ROP', chinese: '再訂購點', english: 'Reorder Point' },
  { abbreviation: 'RPM', chinese: '每分鐘轉速', english: 'Revolutions Per Minute' },
  { abbreviation: 'RS-485', chinese: '差動串列通訊標準', english: 'Recommended Standard 485' },
  { abbreviation: 'RTD', chinese: '電阻式溫度感測器', english: 'Resistance Temperature Detector' },
  { abbreviation: 'RTF', chinese: '故障後維修', english: 'Run to Failure' },
  { abbreviation: 'RTU', chinese: '遠端終端單元', english: 'Remote Terminal Unit' },
  { abbreviation: 'RUL', chinese: '剩餘使用壽命', english: 'Remaining Useful Life' },
  { abbreviation: 'S&OP', chinese: '銷售與營運規劃', english: 'Sales and Operations Planning' },
  { abbreviation: 'SCADA', chinese: '監控與資料擷取系統', english: 'Supervisory Control and Data Acquisition' },
  { abbreviation: 'SCARA', chinese: '選擇性順應組裝機器手臂', english: 'Selective Compliance Assembly Robot Arm' },
  { abbreviation: 'SCM', chinese: '供應鏈管理', english: 'Supply Chain Management' },
  { abbreviation: 'SFC', chinese: '現場作業控制', english: 'Shop Floor Control' },
  { abbreviation: 'SiL', chinese: '軟體迴路模擬', english: 'Software in the Loop' },
  { abbreviation: 'SLAM', chinese: '同步定位與地圖建構', english: 'Simultaneous Localization and Mapping' },
  { abbreviation: 'SMED', chinese: '單分鐘換模', english: 'Single-Minute Exchange of Die' },
  { abbreviation: 'SMT', chinese: '表面黏著技術', english: 'Surface Mount Technology' },
  { abbreviation: 'SOP', chinese: '標準作業程序', english: 'Standard Operating Procedure' },
  { abbreviation: 'SPC', chinese: '統計製程管制', english: 'Statistical Process Control' },
  { abbreviation: 'SPT', chinese: '最短加工時間優先', english: 'Shortest Processing Time' },
  { abbreviation: 'SR', chinese: '預定到貨', english: 'Scheduled Receipts' },
  { abbreviation: 'SS', chinese: '安全庫存', english: 'Safety Stock' },
  { abbreviation: 'ST', chinese: '標準工時', english: 'Standard Time' },
  { abbreviation: 'TCP', chinese: '傳輸控制協定', english: 'Transmission Control Protocol' },
  { abbreviation: 'TIMWOOD', chinese: '精實七大浪費口訣', english: 'Transport-Inventory-Motion-Waiting-Overproduction-Overprocessing-Defects' },
  { abbreviation: 'TPM', chinese: '全員生產維護', english: 'Total Productive Maintenance' },
  { abbreviation: 'TPS', chinese: '豐田生產系統', english: 'Toyota Production System' },
  { abbreviation: 'TSN', chinese: '時間敏感網路', english: 'Time-Sensitive Networking' },
  { abbreviation: 'TT', chinese: '節拍時間', english: 'Takt Time' },
  { abbreviation: 'UCL', chinese: '管制上限', english: 'Upper Control Limit' },
  { abbreviation: 'UHF', chinese: '超高頻', english: 'Ultra High Frequency' },
  { abbreviation: 'USB', chinese: '通用序列匯流排', english: 'Universal Serial Bus' },
  { abbreviation: 'USL', chinese: '規格上限', english: 'Upper Specification Limit' },
  { abbreviation: 'WI', chinese: '作業指導書', english: 'Work Instruction' },
  { abbreviation: 'WIP', chinese: '在製品', english: 'Work in Process' },
  { abbreviation: 'WMS', chinese: '倉儲管理系統', english: 'Warehouse Management System' },
  { abbreviation: 'YOLO', chinese: '即時目標偵測模型', english: 'You Only Look Once' },
];

const CHINESE_TERMS: readonly ChineseTerm[] = [
  { abbreviation: 'MLT', chinese: '製造前置時間', english: 'Manufacturing Lead Time', aliases: ['製造前置時間'] },
  { abbreviation: 'LT', chinese: '生產前置時間', english: 'Lead Time', aliases: ['生產週期', '前置時間'] },
  { abbreviation: 'A', chinese: '時間稼動率', english: 'Availability', aliases: ['時間稼動率'] },
  { abbreviation: 'P', chinese: '性能稼動率', english: 'Performance', aliases: ['性能稼動率'] },
  { abbreviation: 'Q', chinese: '良品率', english: 'Quality', aliases: ['良品率'] },
  { abbreviation: 'UR', chinese: '設備稼動率', english: 'Utilization Rate', aliases: ['設備稼動率', '稼動率'] },
  { abbreviation: 'CL', chinese: '產能負荷', english: 'Capacity Load', aliases: ['產能負荷'] },
];

const SYNONYMS: readonly { readonly alias: string; readonly abbreviation: string }[] = [
  { alias: '銷售與營運規劃', abbreviation: 'S&OP' },
  { alias: '銷售與營運計畫', abbreviation: 'S&OP' },
  { alias: '產銷協調機制', abbreviation: 'S&OP' },
  { alias: '產銷協調', abbreviation: 'S&OP' },
  { alias: '主生產排程', abbreviation: 'MPS' },
  { alias: '主排程', abbreviation: 'MPS' },
  { alias: '物料需求規劃', abbreviation: 'MRP' },
  { alias: '物料需求計畫', abbreviation: 'MRP' },
  { alias: '物料清單', abbreviation: 'BOM' },
  { alias: '用料清單', abbreviation: 'BOM' },
  { alias: '工程用料清單', abbreviation: 'EBOM' },
  { alias: '製造用料清單', abbreviation: 'MBOM' },
  { alias: '客戶訂單解耦點', abbreviation: 'CODP' },
  { alias: '客戶訂單分離點', abbreviation: 'CODP' },
  { alias: '訂單解耦點', abbreviation: 'CODP' },
  { alias: '訂單分離點', abbreviation: 'CODP' },
  { alias: 'ABC 存貨分類法', abbreviation: 'ABC' },
  { alias: 'ABC 分類法', abbreviation: 'ABC' },
  { alias: 'ABC 分析法', abbreviation: 'ABC' },
  { alias: 'ABC 物料分類', abbreviation: 'ABC' },
  { alias: 'ABC 分級', abbreviation: 'ABC' },
  { alias: '自動倉儲系統', abbreviation: 'AS/RS' },
  { alias: '自動化倉儲系統', abbreviation: 'AS/RS' },
  { alias: '立體倉儲', abbreviation: 'AS/RS' },
  { alias: 'Modbus 協定', abbreviation: 'Modbus' },
  { alias: 'Modbus 通訊協定', abbreviation: 'Modbus' },
  { alias: '設備綜合效率', abbreviation: 'OEE' },
  { alias: '整體設備效率', abbreviation: 'OEE' },
  { alias: '全員生產維護', abbreviation: 'TPM' },
  { alias: '全面生產維護', abbreviation: 'TPM' },
  { alias: '網宇實體系統', abbreviation: 'CPS' },
  { alias: '網宇實體整合系統', abbreviation: 'CPS' },
  { alias: '虛實整合系統', abbreviation: 'CPS' },
  { alias: '數位雙生', abbreviation: 'DT' },
  { alias: '數位分身', abbreviation: 'DT' },
  { alias: '協作機器人', abbreviation: 'Cobot' },
  { alias: '協作型機器人', abbreviation: 'Cobot' },
  { alias: '無人搬運車', abbreviation: 'AGV' },
  { alias: '自動導引車', abbreviation: 'AGV' },
  { alias: '自主移動機器人', abbreviation: 'AMR' },
  { alias: '可程式邏輯控制器', abbreviation: 'PLC' },
  { alias: '可程式化邏輯控制器', abbreviation: 'PLC' },
  { alias: '統計製程管制', abbreviation: 'SPC' },
  { alias: '首件檢驗', abbreviation: 'FAI' },
  { alias: '標準工時', abbreviation: 'ST' },
  { alias: '正常工時', abbreviation: 'NT' },
  { alias: '週期時間', abbreviation: 'CT' },
  { alias: '節拍時間', abbreviation: 'TT' },
  { alias: '安全存量', abbreviation: 'SS' },
  { alias: '安全庫存', abbreviation: 'SS' },
  { alias: '經濟訂購量', abbreviation: 'EOQ' },
  { alias: '經濟生產量', abbreviation: 'EPQ' },
  { alias: '再訂購點', abbreviation: 'ROP' },
  { alias: '在製品', abbreviation: 'WIP' },
  { alias: '自動光學檢測', abbreviation: 'AOI' },
  { alias: '製造執行系統', abbreviation: 'MES' },
  { alias: '企業資源規劃', abbreviation: 'ERP' },
  { alias: '品質管制系統', abbreviation: 'QMS' },
  { alias: '倉儲管理系統', abbreviation: 'WMS' },
  { alias: '製造營運管理', abbreviation: 'MOM' },
];

const termByAbbreviation = new Map(TERMS.map((term) => [term.abbreviation.toUpperCase(), term]));
const escapedAbbreviations = TERMS
  .map((term) => term.abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .sort((left, right) => right.length - left.length);
const abbreviationPattern = new RegExp(`\\b(${escapedAbbreviations.join('|')})\\b`, 'g');

const chineseTermByAlias = new Map<string, Term>();
for (const term of TERMS) {
  if (term.chinese.length >= 2) {
    chineseTermByAlias.set(term.chinese, term);
  }
}
for (const term of CHINESE_TERMS) {
  for (const alias of term.aliases) {
    chineseTermByAlias.set(alias, term);
  }
}
for (const syn of SYNONYMS) {
  const term = termByAbbreviation.get(syn.abbreviation.toUpperCase());
  if (term) {
    chineseTermByAlias.set(syn.alias, term);
  }
}

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const chineseTermPattern = new RegExp(
  [...chineseTermByAlias.keys()].sort((left, right) => right.length - left.length).map(escapePattern).join('|'),
  'g',
);

function isAlreadyExpanded(text: string, index: number, term: Term): boolean {
  return text.slice(Math.max(0, index - 100), index).includes(term.english)
    || text.slice(index, index + 120).includes(term.english);
}

function expansion(term: Term): string {
  return `${term.chinese}（${term.english}, ${term.abbreviation}）`;
}

/** Normalizes compact metadata labels before their first-use expansion. */
export function normalizeTermLabel(value: string): string {
  let normalized = value.trim();
  for (const term of TERMS) {
    const abbreviation = escapePattern(term.abbreviation);
    const chinese = escapePattern(term.chinese);
    normalized = normalized
      .replace(new RegExp(`${abbreviation}\\s*${chinese}`, 'g'), term.abbreviation)
      .replace(new RegExp(`${chinese}\\s*${abbreviation}`, 'g'), term.abbreviation);
    if (normalized === term.chinese) normalized = term.abbreviation;
  }
  return normalized
    .replace(/^S&OP\s+銷售與營運計畫$/, 'S&OP')
    .replace(/^生產週期\s+LT$/, 'LT');
}

function visibleTextNodes(root: HTMLElement): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    if (!node.parentElement?.closest('code, script, style, .katex, .math-inline, [data-no-terminology], .unit-visual, .topic-header-card, .exam-question')) nodes.push(node as Text);
    node = walker.nextNode();
  }
  return nodes;
}

function replaceTerms(
  root: HTMLElement,
  pattern: RegExp,
  findTerm: (value: string) => Term | undefined,
  seen: Set<string>,
): void {
  for (const textNode of visibleTextNodes(root)) {
    const text = textNode.data;
    pattern.lastIndex = 0;
    const matches = [...text.matchAll(pattern)];
    if (!matches.length) continue;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const match of matches) {
      const index = match.index ?? 0;
      if (index < cursor) continue;
      const value = match[0];
      const term = findTerm(value);
      const leadingSlice = text.slice(cursor, index);
      if (!term || seen.has(term.abbreviation) || isAlreadyExpanded(text, index, term)) {
        if (term) seen.add(term.abbreviation);
        fragment.append(leadingSlice, value);
        cursor = index + value.length;
      } else {
        seen.add(term.abbreviation);
        const leadingAbbrMatch = leadingSlice.match(new RegExp(`(?:^|\\s)${escapePattern(term.abbreviation)}\\s*$`));
        if (leadingAbbrMatch) {
          fragment.append(leadingSlice.slice(0, leadingSlice.length - leadingAbbrMatch[0].length + (leadingAbbrMatch[0].startsWith(' ') ? 1 : 0)));
        } else {
          fragment.append(leadingSlice);
        }
        fragment.append(expansion(term));
        let matchLength = value.length;
        const trailing = text.slice(index + value.length);
        const parenMatch = trailing.match(new RegExp(`^\\s*[（(]\\s*${escapePattern(term.abbreviation)}\\s*[)）]`));
        if (parenMatch) {
          matchLength += parenMatch[0].length;
        }
        cursor = index + matchLength;
      }
    }
    fragment.append(text.slice(cursor));
    textNode.replaceWith(fragment);
  }
}

/** Expands the first visible occurrence of each common manufacturing term. */
export function expandTerminology(root: HTMLElement, seen = new Set<string>()): Set<string> {
  replaceTerms(root, chineseTermPattern, (alias) => chineseTermByAlias.get(alias), seen);
  replaceTerms(root, abbreviationPattern, (abbreviation) => termByAbbreviation.get(abbreviation.toUpperCase()), seen);
  return seen;
}
