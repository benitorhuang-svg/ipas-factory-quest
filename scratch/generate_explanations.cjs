const fs = require('fs');

const q1 = JSON.parse(fs.readFileSync('content/questions-subject1.json', 'utf8'));
const q2 = JSON.parse(fs.readFileSync('content/questions-subject2.json', 'utf8'));
const reviews = JSON.parse(fs.readFileSync('content/question-reviews.json', 'utf8')).questions;
const rMap = new Map(reviews.map(r => [r.canonicalId, r]));

function generateGranularExplanation(q) {
  const letters = ['A', 'B', 'C', 'D'];
  const r = rMap.get(q.id) || {};
  const compPoint = (r.competencyPoints && r.competencyPoints[1]) || q.unit;

  // 1. 破題關鍵
  let core = '';
  if (q.skill === 'calculation') {
    core = `鎖定【${compPoint}】之定量計算模型，釐清輸入參數、基準定義（如外加法/內含法、瓶頸站判定）與單位換算。`;
  } else if (q.skill === 'scenario') {
    core = `掌握【${compPoint}】之現場應用情境，從約束條件、優先權重與工程實務權衡進行決策判讀。`;
  } else {
    core = `掌握【${compPoint}】之核心定義與標準層級劃分，精準區分容易混淆的專業名詞與適用邊界。`;
  }

  // 2. 正解解析
  let solution = q.explanation;
  if (!solution.endsWith('。')) solution += '。';
  const correctLetter = letters[q.answer];
  const correctText = q.options[q.answer];
  let solutionDetail = `正確選項為 (${correctLetter})「${correctText}」。${solution}`;

  // 3. 干擾項辨析
  const distractors = [];
  for (let i = 0; i < q.options.length; i++) {
    if (i === q.answer) continue;
    const l = letters[i];
    const text = q.options[i];
    let reason = '';

    // Specialized heuristics based on option text and stem
    if (/全部|完全|永遠|必定|絕對|不可能|隨意/.test(text)) {
      reason = `過於極端或絕對化，違反工業工程受控變更與實務彈性原則。`;
    } else if (q.skill === 'calculation') {
      reason = `數值計算常見錯誤（可能誤用了未經評比調整之原始數據、混淆了公式分母基準，或算錯寬放率）。`;
    } else if (/總體|年度|APP/.test(text) && !/APP/.test(q.options[q.answer])) {
      reason = `此為宏觀總體計畫（APP/S&OP）產品家族層級，非細化之具體品項或現場工序。`;
    } else if (/派工|班表|派工單|SFC|機台/.test(text) && !/派工/.test(q.options[q.answer])) {
      reason = `此屬於車間現場作業控制（SFC/PAC）之短期排班派工層級，非中長期排程之主要產出。`;
    } else if (/RCCP|粗產能/.test(text) && !/RCCP/.test(q.options[q.answer])) {
      reason = `粗產能規劃（RCCP）是用於驗證產能負荷之檢驗機制，而非主排程之主檔資訊。`;
    } else if (/MTS|存貨/.test(text) && !/MTS/.test(q.options[q.answer])) {
      reason = `存貨生產適用於需求穩定之標準品提前預製，與本題特定情境之訂單觸發特性不符。`;
    } else if (/MTO|接單/.test(text) && !/MTO/.test(q.options[q.answer])) {
      reason = `接單生產是在收到訂單後才啟動製造，與本題強調快速出貨或預製成品的策略相違背。`;
    } else if (/管制界限|3σ/.test(text) && /規格/.test(q.options[q.answer])) {
      reason = `混淆了「管制界限」（由製程內部 3σ 統計變異決定）與「規格界限」（由客戶或工程公差決定）。`;
    } else if (/Level\s*4|ERP/.test(text) && /Level\s*3|MES/.test(q.options[q.answer])) {
      reason = `屬於 ISA-95 第 4 層企業營運資源層（ERP），而非第 3 層製造執行與現場派工（MES）。`;
    } else if (/Level\s*3|MES/.test(text) && /Level\s*4|ERP/.test(q.options[q.answer])) {
      reason = `屬於第 3 層現場製造執行（MES），而非第 4 層之跨廠營運管理與長期財務規劃（ERP）。`;
    } else {
      reason = `與題意核心概念不符，或混淆了不同模組／工序階段的職能邊界。`;
    }

    distractors.push(`• 選項 (${l}) 錯誤：${text} —— ${reason}`);
  }

  // 4. 避坑提醒
  let trap = '';
  if (q.skill === 'calculation') {
    trap = `計算題務必看清題目指定之基準與單位（例如外加法與內含法之分母差異、小時與秒之單位換算），先推導公式再代入數值，避免被鄰近近似選項誘導。`;
  } else if (/MTS|MTO|ATO|ETO/.test(q.stem)) {
    trap = `判斷生產形態時，關鍵在於「訂單切入點（Order Penetration Point, OPP）」位於設計、採購、組裝還是出貨階段，切勿將訂單履行策略與大量生產或零庫存手法混為一談。`;
  } else if (/OEE|稼動率|設備/.test(q.stem)) {
    trap = `OEE 六大損失劃分極具陷阱性：換模停機屬 A 損失、小停機與降速屬 P 損失、暖機與不良廢件屬 Q 損失。`;
  } else if (/管制圖|SPC|Cp|Cpk/.test(q.stem)) {
    trap = `SPC 考題常誘使考生將「製程穩定（無特殊原因變異）」誤判為「符合規格」；兩者統計意義完全獨立。`;
  } else if (/ISA-95|IIoT|通訊|協定|MQTT|OPC/.test(q.stem)) {
    trap = `智慧製造架構題務必嚴格遵循 ISA-95 分層原則與協定特質（OPC UA 重語意資訊模型、MQTT 重輕量 Pub/Sub、Modbus 暫存器定址無原生語意）。`;
  } else {
    trap = `閱讀題幹時請圈出「最主要」、「何者最適切」或「限制條件」等關鍵詞，先排除語意過度絕對或範圍錯位的干擾項。`;
  }

  return `【破題關鍵】${core}\n【正解解析】${solutionDetail}\n【干擾項辨析】\n${distractors.join('\n')}\n【避坑提醒】${trap}`;
}

const samples = [q1[0], q1[1], q1[5], q2[0], q2[3]];
const sampleResults = samples.map(q => ({
  id: q.id,
  stem: q.stem,
  explanation: generateGranularExplanation(q)
}));

console.log(JSON.stringify(sampleResults[0], null, 2));
console.log('---');
console.log(JSON.stringify(sampleResults[2], null, 2));
