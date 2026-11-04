import fs from 'node:fs';
import path from 'node:path';

const base = '.archify/architecture-unit-summaries-20261024-120610';
const units = [];
const n = (id, label, sublabel, col, row = 0, type = 'backend', width = 220) => ({
  id, label, sublabel, type, icon: 'none', pos: [40 + col * 370, row ? 300 : 40], size: [width, 96],
});
const e = (from, to, label, extra = {}) => ({ id: `${from}-to-${to}`, from, to, label, ...extra });
const loop = (from, to, label) => e(from, to, label, {
  fromSide: 'bottom', toSide: 'bottom', via: [[1260, 530], [150, 530]],
});
function add(code, title, nodes, edges, review, traps, source) {
  units.push({ code, title, nodes, edges, review, traps, source });
}

add('M21101', '生產管理實務與精實管理', [
  n('plan', '訂單與生產計畫', 'S&OP／MPS／供需平衡', 0, 1),
  n('resources', '物料與產能檢核', 'MRP／CRP／可行性', 1, 1),
  n('execution', '工單執行與實績', '工時／耗用／不良／交期', 2, 1),
  n('lean', '價值流與精實改善', 'VSM／浪費／工具選擇', 3, 1),
  n('promise', 'ATP 與 PAB', '供給時間／未承諾量', 0, 0, 'external'),
  n('master', 'BOM／途程／日曆', '同版本／已放行物料', 1, 0, 'external'),
  n('pull', '看板與標準作業', '需求消耗／節拍／WIP', 3, 0, 'external'),
], [
  e('promise', 'plan', '接單前核對'), e('plan', 'resources', '品項／數量／日期'),
  e('master', 'resources', '一致的規劃依據'), e('resources', 'execution', '可行才釋出'),
  e('execution', 'lean', '辨認績效落差'), e('lean', 'pull', '依損失選工具'),
  loop('lean', 'plan', '以實績修正計畫'),
], [
  'MPS 訂產品完工量與日期；MRP 展開子件淨需求與投料日期；CRP 檢查工作中心負荷。MPS 調整後須同步重算物料。',
  'ATP 是指定供給點尚未承諾的量；PAB 是逐期供給減需求的餘額。接單須同時檢查時間、物料、品質與產能。',
  'VSM 先量測加工與等待，VAR＝增值時間／總前置時間；看板量依耗用、補充時間、容器量及明示安全餘裕向上取整。',
], [
  '後週的 ATP 不能承諾前週交貨，同一份庫存與產能也不能重複承諾。',
  '拉動仍需可靠供料與必要緩衝；多餘產能不等於已過量生產。工具應對應實際損失。',
], '中級單元五／L21101–L21102');

add('M21102', '智慧工廠技術、現場管理與 MES 實務', [
  n('data', '可用資料與基線', '資料品質／產品與班次範圍', 0),
  n('mes', 'MES 與現場管理', '排程／WIP／品質／設備', 1),
  n('action', '受控處置與執行', '通報／處置／驗證結案', 2),
  n('benefit', '損失與效益驗證', '瓶頸／可售需求／維運費', 3),
  n('technology', '技術與成熟度', '九大支柱／示意改善路徑', 0, 1, 'external'),
  n('standard', 'E-SOP 與 FCS', '核准版本／資源限制', 1, 1, 'external'),
  n('control', 'SPC 與 R2R', '穩定量測／模型／增益方向', 2, 1, 'external'),
], [
  e('technology', 'data', '依改善任務建置'), e('data', 'mes', '關聯工單與事件'),
  e('standard', 'mes', '版本與可行派工'), e('mes', 'action', '責任人與任務'),
  e('control', 'action', '前提通過才調參'), e('action', 'mes', '根因與結果回報'),
  e('action', 'benefit', '比較前後損失'),
], [
  'Andon 的閉迴路包含發現、受理、到場、修復、品質確認與復歸；時間應分段記錄，才能找到改善責任。',
  'E-SOP 要管核准版次、發放與舊版作廢；FCS 納入日曆、人力與設備限制，仍受輸入資料及模型影響。',
  'R2R 以前批量測補償下一批，需模型與增益方向有效；特殊原因先處置，不可只靠調參追數字。',
], [
  '連線、看板或通知成功，不等於自主決策或異常已結案；教材成熟度 L1–L5 為示意分層。',
  '節省工時轉為營收須有瓶頸產能、良率與可售需求，並扣新增費用；不能把重複效益加總。',
], '中級單元六／L21103–L21105');

add('M21201', 'MES 全廠管控與生產排程優化', [
  n('erp', 'ERP 需求與物流', '工單／物料／途程／收發料', 0),
  n('mes', 'MES 事件與 WIP', '物流動作與帳務同步', 1),
  n('schedule', '有限產能排程', '先行／資格／換線／日曆', 2),
  n('release', '派工與品質放行', '版本同步／設備確認', 3),
  n('analytics', '資料管線與分析', '清理／儲存／時序／預測', 1, 1, 'external'),
  n('rules', 'TOC／DBR／排序', '瓶頸／緩衝／投料／目標', 2, 1, 'external'),
  n('equipment', '設備整合契約', '採集／配方／事件回覆', 3, 1, 'external'),
], [
  e('erp', 'mes', '需求與受控資料'), e('mes', 'erp', '完工／消耗實績'),
  e('mes', 'schedule', '合法事件與現況'), e('mes', 'analytics', '來源時間與事件 ID'),
  e('analytics', 'mes', '洞察與品質標記'), e('rules', 'schedule', '按目標選規則'),
  e('schedule', 'release', '可行版本才派工'), e('equipment', 'release', '核准與執行回覆'),
], [
  '領料、移轉與入庫須對應工單、批號、工序及品質狀態；掃碼成功僅表示讀到代碼，不等於產品已放行。',
  'TOC 依序辨識、充分利用、其他服從、提升瓶頸再重複；DBR 以瓶頸節奏及緩衝控制投料。',
  'SPT 重平均流程時間，EDD 重最大延遲，相關最佳性需標準單機等前提；CR＝剩餘交期／剩餘加工時間。',
], [
  '可行排程不等於全域最佳。設備資格、不可中斷工序、換線與停機時點可改變排序結果。',
  '事件 ID 去重、來源時間、接收時間與更正事件要保留；累計計數器不能直接和事件增量混加，相關不證明因果。',
], '中級單元七／L21201–L21204');

add('M21202', '線平衡、品質要因與即時資訊', [
  n('scope', '需求與時間口徑', '淨可用時間／需求／TT', 0),
  n('balance', '線平衡與瓶頸', 'CT／LBR／站數下限', 1),
  n('quality', '品質原因與風險', 'SPC／Cp／Cpk／FMEA', 2),
  n('decision', '資訊與改善決策', 'KPI／責任／對策與驗證', 3),
  n('precedence', '先行與人機時序', '不可分割作業／設備資格', 1, 1, 'external'),
  n('evidence', '量測與分析前提', '穩定性／分布／樣本／DOE', 2, 1, 'external'),
  n('loss', 'OEE 六大損失', 'A 停機／P 速度／Q 品質', 3, 1, 'external'),
], [
  e('scope', 'balance', '定需求節奏'), e('precedence', 'balance', '驗證合法配置'),
  e('balance', 'quality', '改善仍守品質'), e('evidence', 'quality', '先確認適用性'),
  e('quality', 'decision', '驗證原因與效果'), e('loss', 'decision', '以損失選工具'),
], [
  'TT＝淨可用時間／需求；LBR＝ΣCT／(站數×最大 CT)。理論站數向上取整只給下限，還要驗先行、資格及不可分割作業。',
  '雙邊規格且同變異估計下，Cp 大於 Cpk 表示偏心；能力分析先確認製程穩定與量測品質。',
  'OEE＝A×P×Q，對應停機、慢速／短停與品質損失。看板需呈現口徑、警戒、鑽取與處置責任。',
], [
  '瓶頸 CT 已反映線平衡損失，不能再把理論產量乘一次 LBR；人員負荷總量也不能代替人機時序。',
  'RPN＝S×O×D 不可蓋過高嚴重度風險；魚骨與散佈提出假設，須驗證。官方 OEE 算題差異依教材保留假設與公告答案。',
], '中級單元八／L21205–L21207');

const cpsMain = [
  ['sense', 'Connection 連線', '採樣／身分／校正'], ['convert', 'Conversion 轉換', '特徵／標準化／緩衝'],
  ['cyber', 'Cyber 數位模型', '設備／產線／工廠雙生'], ['cognition', 'Cognition 認知', '建議／可信與適用條件'],
  ['configure', 'Configuration 回饋', '核准執行／結果驗證'],
].map(([id,label,sub], i) => ({ id, type:'backend', label, sublabel:sub, icon:'none', pos:[40+i*310,300], size:[190,96] }));
const cpsBranch = (id,label,sub,col) => ({ id,type:'external',label,sublabel:sub,icon:'none',pos:[40+col*310,40],size:[190,96] });
add('M22101', '物聯網與 CPS 基本原理', [...cpsMain,
  cpsBranch('task','任務與風險','反應期限／頻寬／事件',0),
  cpsBranch('buffer','吞吐與儲存預算','產生率／服務率／對帳',1),
  cpsBranch('version','資料與模型版本','單位／缺值／校正／基線',3),
], [
  e('task','sense','按任務採樣'), e('sense','convert','原始資料'), e('buffer','convert','斷線與追補能力'),
  e('convert','cyber','可信特徵'), e('cyber','cognition','狀態與預測'), e('version','cognition','適用性檢查'),
  e('cognition','configure','核准且條件有效'),
  e('configure','sense','效果回饋',{fromSide:'bottom',toSide:'bottom',via:[[1375,530],[135,530]]}),
], [
  'IoT 三層為感知、網路、應用；邊緣可轉協定、提特徵、做本地處理及斷線緩衝，部署依期限、保真與風險選擇。',
  '5C 串起連線、轉換、數位模型、認知與配置；CPS 是運算、通訊與實體的回饋互動，3D 並非必要條件。',
  '緩衝容量約為資料產生率×斷線時間再加餘裕；恢復後清積壓能力是服務率減持續產生率，還需封裝與對帳。',
], [
  '採樣端漏掉的短脈衝無法靠加快網路補回；降採樣須先確保任務現象與抗混疊。',
  '資料缺漏、校正或模型版本不匹配時，禁止直接依模型閉迴路調參；5G、QoS 或雲端名稱不保證期限與完整性。',
], '中級單元九／L22101–L22102');

add('M22102', '智慧設備維護與製程大數據', [
  n('failure','失效模式與後果','風險／前兆／備品／修復',0), n('strategy','維護策略選擇','RCM／BM／PM／CBM／PdM',1),
  n('work','CMMS／MES 處置','工單／人員／備品／紀錄',2), n('effect','可靠度與成本驗證','停機／品質／安全／效益',3),
  n('data','資料品質與標記','缺值／對時／單位／洩漏',0,1,'external'),
  n('model','EHI 與預測分析','衰退／良率／視窗／能耗',1,1,'external'),
  n('history','維護與執行歷史','變更／換件／故障原因',2,1,'external'),
  n('metric','MTBF／MTTR','運作與修復時間先定義',3,1,'external'),
], [e('data','failure','可信診斷證據'),e('failure','strategy','依後果選組合'),e('model','strategy','可處置前兆'),
  e('strategy','work','達條件才開單'),e('history','work','備品與過往證據'),e('work','effect','修復與損失紀錄'),e('metric','effect','同口徑比較')],
['BM 故障後修；PM 依固定時間或次數；CBM 依有效狀態；PdM 預估衰退或維護時點。RCM 依失效模式選策略組合。',
 'MTBF＝運作時間／故障次數；MTTR＝定義內修復時間／故障次數。可用度 MTBF／(MTBF＋MTTR) 必須配合一致時間範圍。',
 'EHI 加權平均須同尺度且權重和為 1；預測資料只用當時已知特徵，保留未知／截尾與版本，另評估精確率、召回率及提前量。'],
['離群可能是真實故障；缺值不能跨故障補成正常，維修後資訊不得洩漏到先前預測。',
 'MTBF 不是保證壽命，固定故障率模型也不描述磨耗加速；比較策略需證明檢修可移除何種缺陷及殘餘風險。'], '中級單元十／L22103–L22105');

add('M22201', '感測器、機器視覺與機器人整合', [
  n('task','檢測與動作需求','物理量／缺陷／節拍／姿態',0), n('vision','感測與視覺判定','量測值／OK-NG／位置',1),
  n('request','座標與作業請求','校正／延遲補償／序號',2), n('robot','PLC／機器人執行','正確序號／互鎖才放行',3),
  n('sensor','感測器與介面','量程／解析度／輸出／環境',0,1,'external'),
  n('optics','光學與曝光','FOV／照明／運動模糊',1,1,'external'),
  n('transaction','握手與期限','Request／Ack／逾時狀態',2,1,'external'),
  n('safety','作業風險與安全迴路','工具／速度／空間／驗證',3,1,'external'),
], [e('task','sensor','依任務選型'),e('task','vision','代表性樣品驗證'),e('optics','vision','可信取像'),
  e('vision','request','毫米座標與時間'),e('transaction','request','一次請求一個序號'),e('request','robot','序號正確且受互鎖'),
  e('robot','request','相同序號完成回覆'),e('safety','robot','風險控制通過')],
['4–20mA 的 4mA 為量程下限，0mA 常為迴路異常；量程、精度、解析度、重複性與安裝誤差分別驗證。',
 '物方尺度約 FOV／像素數；曝光位移約速度×曝光時間。像素尺寸不等於量測精度，光學與演算法皆須驗證。',
 '像素需經校正轉到機器人座標，移動工件另考慮延遲。請求綁工件、序號、版本與期限，逾時先查狀態。'],
['漏檢與誤殺依風險及成本評估；AI 不會自動補救模糊、錯誤校正或缺少代表性資料。',
 '舊序號完成不可放行新工件；急停須經驗證安全迴路／通訊，Cobot 碰撞偵測不代表可直接撤除防護。'], '中級單元十一／L22201–L22203');

add('M22202', '通訊建構、智慧控制與介面管理', [
  n('contract','通訊與資料契約','實體／IP／服務／資料',0),n('control','有效資料與控制','心跳／狀態／期限',1),
  n('hmi','HMI 與警報處置','確認／解除／結案分開',2),n('verify','交付與執行驗證','事件 ID／交易／設備回覆',3),
  n('network','風險分區與入口','DMZ／核准／最小權限',0,1,'external'),n('method','控制方法與限制','PID／MPC／Fuzzy／RL／R2R',1,1,'external'),
  n('alarm','警報條件與責任','遲滯／持續時間／分級',2,1,'external'),n('delivery','QoS 0／1／2','協定交付語意的範圍',3,1,'external'),
], [e('network','contract','受控跨區'),e('contract','control','合法且持續更新'),e('method','control','模型與限制適用'),
  e('control','hmi','可信狀態與趨勢'),e('alarm','hmi','有效資料才判斷'),e('hmi','verify','核准操作與紀錄'),e('delivery','verify','交付另核對業務')],
['排障依供電／線材、IP／路由／埠、服務／憑證／權限，再查型別、位元序、單位及更新契約；Ping 不證明資料有效。',
 'P 反映當前誤差，I 累積誤差且需防飽和，D 對雜訊敏感；智慧控制仍須驗證模型、約束與失效行為。',
 'HMI 顯示層級、異常與行動；警報確認只表知悉，條件解除與結案另需證據。服務模型另分 IaaS／PaaS／SaaS 管理責任。'],
['最後數值 Good 不保證仍更新；來源時間若為最後變更時間，須另用明確心跳或序號驗證。失聯不能當條件解除。',
 'QoS 1 可能重複；QoS 2 不保證資料庫入帳或設備執行恰好一次。需持久事件 ID、交易邊界、重試及對帳。'], '中級單元十二／L22204–L22206');

add('M22301', '智慧設備操作與效率指標辨識', [
  n('recipe','工單與核准配方','產品／料號／版本／資格',0,1),n('operation','首件與量產監控','首件合格／趨勢／換型',1,1),
  n('recovery','異常隔離與復歸','停機／可疑品／驗證重啟',2,1),n('performance','OEE 與產能改善','損失／瓶頸／可交付量',3,1),
  n('version','版本與設備回覆','工單版＝設備實際執行版',0,0,'external'),n('maintain','點檢與保養','依計畫／紀錄／CMMS',1,0,'external'),
  n('safe','安全與變更控制','Reset 與 Start 分開',2,0,'external'),n('scope','時間／數量／權重','理想 CT／首次良品／同範圍',3,0,'external'),
], [e('version','recipe','一致才啟動'),e('recipe','operation','核准後首件確認'),e('maintain','operation','維持可用條件'),
  e('operation','recovery','異常才進處置'),e('safe','recovery','驗證後再啟動'),e('recovery','performance','完整損失與產出'),
  e('scope','performance','統一口徑再比較'),loop('performance','recipe','改善與重排計畫')],
['操作依啟機核對、首件、監控、異常、換線再首件與保養；配方變更保留修改、時間、核准及設備確認。',
 'OEE＝A×P×Q；A 對停機／換型，P 對慢速／短停，Q 對不良／暖機。依損失規模及風險選 TPM、SMED、SPC 或防呆。',
 '利用率以設計產能、效率以有效產能為分母；FPY 不包含重工後合格。混產品須保存逐段時間與理想 CT 並說明加權方式。'],
['設備高 OEE 不保證整線準時；查瓶頸負荷及工序限制。P 大於 100% 先查基準、模穴、產量與時間分類。',
 '85% 等門檻是教學示例；減排產不等於消除損失。人分、經過時間與出件間隔不同，效率已含平衡損失時勿重複扣除。'], '中級單元十三／L22301–L22302');

for (const unit of units) {
  const folder = `${base}/${unit.code}`;
  fs.mkdirSync(folder, { recursive: true });
  const candidate = {
    schema_version: 1, diagram_type: 'architecture',
    meta: { title: `${unit.code}｜${unit.title}：單元總結`, locale: 'zh-TW', output: `${folder}/${unit.code}-summary.html`, quality_profile: 'showcase',
      legend: { mode: 'auto', entries: { backend: { label: '核心概念與決策主線' }, external: { label: '判斷依據與支援條件' } } } },
    components: unit.nodes, connections: unit.edges,
    cards: [ { dot:'cyan', title:'重點回顧', items:unit.review }, { dot:'amber', title:'考點與常見誤判', items:unit.traps },
      { dot:'slate', title:'教材依據與讀圖範圍', items:[`${unit.source}，以目前專案教材為依據。`, '關係圖濃縮章節主線；公式及題目仍須回看原文的分母、單位、假設與公告答案界線。'] } ],
  };
  fs.writeFileSync(path.join(folder, 'candidate.json'), JSON.stringify(candidate, null, 2) + '\n', 'utf8');
  console.log(unit.code);
}
