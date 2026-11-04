import { h } from '@/utils/render';

type ChapterExplainer = {
  title: string;
  alt: string;
  points: readonly string[];
};

const EXPLAINERS: Record<string, ChapterExplainer> = {
  M11101: {
    title: '生產型態與解耦點',
    alt: '四種生產型態從客製設計到成品備貨，以及需求規劃與產能檢核',
    points: [
      '備貨生產（Make to Stock, MTS）、接單組裝（Assemble to Order, ATO）、接單生產（Make to Order, MTO）、接單設計生產（Engineer to Order, ETO）的差異，在於客戶訂單解耦點（Customer Order Decoupling Point, CODP）介入流程的位置。',
      '銷售與營運規劃（Sales and Operations Planning, S&OP）平衡需求與供應，主生產排程（Master Production Schedule, MPS）細化品項與時段，再透過粗略產能規劃（Rough-Cut Capacity Planning, RCCP）檢核關鍵產能。',
    ],
  },
  M11102: {
    title: 'BOM 與製程途程如何串起來',
    alt: '產品零件階層對照加工、外包、組裝與檢驗途程',
    points: [
      '物料清單（Bill of Materials, BOM）說明產品由哪些零組件構成；工程用料清單（Engineering Bill of Materials, EBOM）著重研發設計結構，製造用料清單（Manufacturing Bill of Materials, MBOM）則依製程途程（Routing）展開加工、外包、組裝與檢驗工序。',
      '工程變更命令（Engineering Change Order, ECO）與標準作業程序（Standard Operating Procedure, SOP）、製造程序指導書（Manufacturing Process Instruction, MPI）必須同步改版，確保現場批次追溯性（Traceability）與工序一致性。',
    ],
  },
  M11103: {
    title: '需求展開、庫存緩衝與補貨',
    alt: '物料需求由產品結構展開，庫存降至補貨點後於交期內補入',
    points: [
      '物料需求規劃（Material Requirements Planning, MRP）以主生產排程（Master Production Schedule, MPS）、物料清單（Bill of Materials, BOM）、庫存紀錄與生產前置時間（Lead Time, LT）推算各階淨需求，展開採購與製造工單。',
      '安全庫存（Safety Stock, SS）吸收需求與前置時間變異；再訂購點（Reorder Point, ROP）與經濟訂購量（Economic Order Quantity, EOQ）決定補貨時機與批量，現場倉則落實在製品（Work in Process, WIP）管制與 ABC 存貨分類法（ABC Inventory Classification）分級管理。',
    ],
  },
  M11201: {
    title: '標準工時與產線平衡',
    alt: '透過時間觀測拆解作業，再將工作平均分配至多個工作站',
    points: [
      '標準工時（Standard Time, ST）由觀測時間經速度評比（Rating）與寬放率（Allowance）推算而成，是產能負荷規劃、人員排班與成本估算的基準數據。',
      '運用 17 個基本動素（Therbligs）與動作經濟原則消除無效動作；分析各站週期時間（Cycle Time, CT）並轉移瓶頸作業，以提升生產線平衡效率（Line Efficiency, LE）並降低平衡損失（Balance Delay, BD）。',
    ],
  },
  M11202: {
    title: '用製程數據及早發現異常',
    alt: '定期抽樣的管制圖呈現穩定製程與超出管制界限的異常點',
    points: [
      '統計製程管制（Statistical Process Control, SPC）利用時間序列管制圖區分機遇原因與非機遇原因；管制界限依據製程數據波動建立，與客戶定義的規格界限（Specification Limits）本質不同。',
      '當製程處於統計管制狀態時，計算製程能力指標（Process Capability Index, Cp 與 Cpk）評估精準度與準確度，搭配首件檢驗（First Article Inspection, FAI）落實預防品質成本（Prevention Cost）。',
    ],
  },
  M11203: {
    title: '精實流動與設備效率',
    alt: '改善前的等待與堆積，轉變為看板拉動、整潔工作站與可靠設備',
    points: [
      '推行整理、整頓、清掃、清潔與素養（Sort-Set in Order-Shine-Standardize-Sustain, 5S）、防呆法（Poka-Yoke）與看板管理（Kanban），消除豐田生產系統（Toyota Production System, TPS）定義的現場七大浪費（Muda），促進及時生產（Just-in-Time, JIT）順暢流動。',
      '全員生產維護（Total Productive Maintenance, TPM）落實自主保養；整體設備效率（Overall Equipment Effectiveness, OEE）由時間稼動率（Availability）、性能稼動率（Performance）與良品率（Quality）相乘計算，徹底揭露設備六大損失。',
    ],
  },
  M12101: {
    title: 'ISA-95 企業到現場的五層整合',
    alt: '企業規劃、製造營運、監督控制、設備控制與實體製程分層連接',
    points: [
      '國際自動化學會企業控制系統整合標準（Enterprise-Control System Integration, ISA-95）劃分五層架構，製造執行系統（Manufacturing Execution System, MES）位於 Level 3 製造營運管理層，扮演企業資源規劃（Enterprise Resource Planning, ERP）與現場控制的雙向樞紐。',
      '藉由資訊技術（Information Technology, IT）與營運技術（Operational Technology, OT）深度融合，工單與配方向下派發至控制層，現場產量、品質與設備狀態即時向上回饋，實現價值鏈垂直整合。',
    ],
  },
  M12102: {
    title: '感測資料從設備走向應用',
    alt: '感測器與控制器經由邊緣閘道連接工廠系統與雲端分析',
    points: [
      '工業物聯網（Industrial Internet of Things, IIoT）利用感測器採集現場實體數據，透過邊緣運算（Edge Computing）進行即時前處理與濾波，減輕雲端傳輸頻寬負載與延遲。',
      '底層串列通訊採用 Modbus 工業通訊協定（Modbus Protocol），跨平台語意互通採用開放式平台通訊統一架構（Open Platform Communications Unified Architecture, OPC UA），雲端與輕量資料傳遞採用訊息佇列遙測傳輸（Message Queuing Telemetry Transport, MQTT）發布／訂閱架構。',
    ],
  },
  M12103: {
    title: '機器視覺檢測與預測維護',
    alt: '視覺相機辨識瑕疵並分流不良品，設備感測資料支援預測維護',
    points: [
      '自動光學檢測（Automated Optical Inspection, AOI）結合卷積神經網路（Convolutional Neural Network, CNN）影像辨識瑕疵，平衡過殺率（Overkill）與漏判率（Underkill），檢測結果連動不良品自動分流與生產履歷追溯。',
      '預測性維護（Predictive Maintenance, PdM）透過振動感測與快速傅立葉轉換（Fast Fourier Transform, FFT）頻譜分析，在設備劣化初期評估剩餘使用壽命（Remaining Useful Life, RUL），避免無預警停機。',
    ],
  },
  M12201: {
    title: '實體設備與數位雙生閉環',
    alt: '實體設備和對應的數位模型同步交換感測資料與控制回饋',
    points: [
      '網宇實體系統（Cyber-Physical System, CPS）透過 5C 架構（Connection、Conversion、Cyber、Cognition、Configuration）串接實體產線與數位運算世界，建立智慧感測與閉迴路回饋控制（Closed-loop Control）。',
      '數位雙生（Digital Twin, DT）建立實體資產的高保真虛擬鏡像，結合即時感測串流進行製程模擬、虛擬調試（Virtual Commissioning）與最佳化控制參數回饋。',
    ],
  },
  M12202: {
    title: 'PLC、機器人與搬運系統協作',
    alt: 'PLC 協調機器人、輸送帶與自主移動搬運車完成生產交接',
    points: [
      '可程式邏輯控制器（Programmable Logic Controller, PLC）以循環掃描週期執行輸入讀取、邏輯運算與輸出刷新，協調感測器、致動器與安全防護聯鎖機制。',
      '多軸工業機器人與協作型機器人（Collaborative Robot, Cobot）負責高精度取放與組裝，搭配自動導引車（Automated Guided Vehicle, AGV）與自主移動機器人（Autonomous Mobile Robot, AMR）建構無人化物流搬運網路。',
    ],
  },
  M12203: {
    title: 'ERP 計畫由 MES 落實到現場',
    alt: 'ERP 下達工單，MES 派工追蹤各站進度並回報履歷與完工資訊',
    points: [
      '製造執行系統（Manufacturing Execution System, MES）接收企業資源規劃（Enterprise Resource Planning, ERP）下達的生產工單，負責現場作業控制（Shop Floor Control, SFC）、即時派工與物料批次追蹤。',
      '整合條碼與無線射頻辨識（Radio Frequency Identification, RFID）技術建立在製品（Work in Process, WIP）生產履歷，現場即時報工與電子看板驅動批次回饋控制（Run-to-Run Control）。',
    ],
  },
};

export function createChapterExplainer(topicCode: string): HTMLElement | null {
  const item = EXPLAINERS[topicCode];
  if (!item) return null;

  const figure = h('figure', { className: 'chapter-explainer', 'data-no-terminology': 'true' });
  const image = h('img', {
    src: `${import.meta.env.BASE_URL}assets/learning-explainers/${topicCode}-explainer.jpg`,
    alt: item.alt,
    loading: 'lazy',
    decoding: 'async',
  });
  const caption = h('figcaption', { className: 'chapter-explainer__caption' });
  caption.append(h('span', { className: 'chapter-explainer__eyebrow' }, '本章一圖理解'));
  caption.append(h('h2', { className: 'chapter-explainer__title' }, item.title));
  const list = h('ul', { className: 'chapter-explainer__points' });
  item.points.forEach((point) => list.append(h('li', {}, point)));
  caption.append(list);
  figure.append(image, caption);
  return figure;
}
