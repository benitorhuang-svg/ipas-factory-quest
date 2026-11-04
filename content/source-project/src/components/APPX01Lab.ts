import { div, h, btn } from '@/utils/render';
import { loadKaTeX } from '@/utils/katex-loader';

type Field = {
  key: string;
  label: string;
  value: number;
  step?: number;
  unit?: string;
  help?: string;
};

type Preset = {
  name: string;
  description: string;
  values: Record<string, number>;
};

type CalcOutput = {
  results: {
    label: string;
    value: string;
    unit?: string;
    highlight?: boolean;
    badge?: string;
    badgeVariant?: 'safe' | 'warning' | 'danger' | 'info';
  }[];
  steps: string[];
};

type Calculator = {
  id: string;
  title: string;
  short: string;
  category: string;
  icon: string;
  latexFormula: string;
  formulaDesc: string;
  fields: Field[];
  presets: Preset[];
  calculate: (v: Record<string, number>) => CalcOutput;
};

const calculators: Calculator[] = [
  {
    id: 'st',
    title: '標準工時 (ST) 與評比寬放計算',
    short: '標準工時 ST',
    category: '工業工程 (IE)',
    icon: '⏱️',
    latexFormula: '\\text{NT} = \\text{OT} \\times \\frac{\\text{Rating}}{100\\%}, \\quad \\text{ST}_{\\text{外加}} = \\text{NT} \\times (1 + R), \\quad \\text{ST}_{\\text{內含}} = \\frac{\\text{NT}}{1 - R}',
    formulaDesc: 'OT 為觀測時間、Rating 為評比係數 (%)、R 為寬放率 (Allowance Rate)。外加法以正常時間 NT 為基準；內含法以標準工時 ST 為基準。',
    fields: [
      { key: 'ot', label: '觀測時間 (OT)', value: 25, unit: '秒', help: '現場秒錶測時之平均時間' },
      { key: 'rating', label: '評比係數 (Rating Factor)', value: 120, unit: '%', help: '標準作業員為 100%' },
      { key: 'allowance', label: '總寬放率 (Allowance)', value: 15, unit: '%', help: '生理、疲勞與不可避免延誤' },
    ],
    presets: [
      {
        name: '典型試題範例 (120% / 15%)',
        description: 'OT=25s、評比120%、寬放15%',
        values: { ot: 25, rating: 120, allowance: 15 },
      },
      {
        name: '標準作業無評比 (100% / 10%)',
        description: '標準速度作業、法定寬放10%',
        values: { ot: 40, rating: 100, allowance: 10 },
      },
    ],
    calculate: (v) => {
      const nt = (v.ot * v.rating) / 100;
      const r = v.allowance / 100;
      const stMarkup = nt * (1 + r);
      const stInclusion = r < 1 ? nt / (1 - r) : 0;
      return {
        results: [
          { label: '正常時間 (NT)', value: nt.toFixed(2), unit: '秒' },
          { label: '標準工時 ST (外加法)', value: stMarkup.toFixed(2), unit: '秒', highlight: true, badge: '主流考法', badgeVariant: 'safe' },
          { label: '標準工時 ST (內含法)', value: stInclusion.toFixed(2), unit: '秒', badge: '總工時基準', badgeVariant: 'info' },
        ],
        steps: [
          `1. 計算正常時間：NT = ${v.ot} × (${v.rating} / 100) = ${nt.toFixed(2)} 秒`,
          `2. 外加法標準工時：ST = ${nt.toFixed(2)} × (1 + ${r}) = ${stMarkup.toFixed(2)} 秒`,
          `3. 內含法標準工時：ST = ${nt.toFixed(2)} ÷ (1 - ${r}) = ${stInclusion.toFixed(2)} 秒`,
        ],
      };
    },
  },
  {
    id: 'le',
    title: '生產線平衡率 (LE) 與損失率 (BD)',
    short: '線平衡率 LE',
    category: '生產規劃 (PP)',
    icon: '⚖️',
    latexFormula: '\\text{CT} = \\max(\\text{ST}_i), \\quad \\text{LE} = \\frac{\\sum_{i=1}^K \\text{ST}_i}{K \\times \\text{CT}} \\times 100\\%, \\quad \\text{BD} = 100\\% - \\text{LE}',
    formulaDesc: 'CT (Cycle Time) 為瓶頸站工時；K 為工站數；LE (Line Efficiency) 為線平衡率；BD (Balance Delay) 為平衡損失率。',
    fields: [
      { key: 's1', label: '工作站 1 工時', value: 18, unit: '秒' },
      { key: 's2', label: '工作站 2 工時', value: 24, unit: '秒' },
      { key: 's3', label: '工作站 3 工時', value: 30, unit: '秒' },
      { key: 's4', label: '工作站 4 工時', value: 22, unit: '秒' },
      { key: 's5', label: '工作站 5 工時', value: 26, unit: '秒' },
      { key: 'hours', label: '單班運轉時間', value: 8, unit: '小時' },
    ],
    presets: [
      {
        name: '五工站經典裝配線 (80% 平衡率)',
        description: '站工時 18/24/30/22/26 秒',
        values: { s1: 18, s2: 24, s3: 30, s4: 22, s5: 26, hours: 8 },
      },
      {
        name: '高瓶頸產線範例 (嚴重失衡)',
        description: '站工時 15/15/45/20/15 秒',
        values: { s1: 15, s2: 15, s3: 45, s4: 20, s5: 15, hours: 8 },
      },
    ],
    calculate: (v) => {
      const times = [v.s1, v.s2, v.s3, v.s4, v.s5];
      const ct = Math.max(...times);
      const bottleneckIndex = times.indexOf(ct) + 1;
      const sum = times.reduce((a, b) => a + b, 0);
      const k = times.length;
      const le = (sum / (k * ct)) * 100;
      const bd = 100 - le;
      const totalSeconds = v.hours * 3600;
      const maxOutput = Math.floor(totalSeconds / ct);
      return {
        results: [
          { label: '瓶頸循環時間 (CT)', value: ct.toFixed(1), unit: '秒', badge: `工作站 ${bottleneckIndex}`, badgeVariant: 'warning' },
          { label: '線平衡率 (LE)', value: le.toFixed(2), unit: '%', highlight: true, badge: le >= 85 ? '優良' : '待改善', badgeVariant: le >= 85 ? 'safe' : 'danger' },
          { label: '平衡損失率 (BD)', value: bd.toFixed(2), unit: '%' },
          { label: `${v.hours}h 理論最大產出`, value: String(maxOutput), unit: '件' },
        ],
        steps: [
          `1. 尋找瓶頸時間：CT = max(${times.join(', ')}) = ${ct} 秒 (工作站 ${bottleneckIndex})`,
          `2. 工時總和：ΣST = ${times.join(' + ')} = ${sum} 秒`,
          `3. 線平衡率：LE = ${sum} ÷ (${k} × ${ct}) = ${le.toFixed(2)}%`,
          `4. 平衡損失率：BD = 100% - ${le.toFixed(2)}% = ${bd.toFixed(2)}%`,
          `5. 理論產能：(${v.hours} × 3600 秒) ÷ ${ct} 秒 = ${maxOutput} 件`,
        ],
      };
    },
  },
  {
    id: 'eoq',
    title: '經濟訂購量 (EOQ) 與下單頻率',
    short: '經濟訂購量 EOQ',
    category: '庫存管理 (INV)',
    icon: '📦',
    latexFormula: '\\text{EOQ} = \\sqrt{\\frac{2DS}{H}}, \\quad N = \\frac{D}{\\text{EOQ}}, \\quad \\text{TC}_{\\min} = \\sqrt{2DSH}',
    formulaDesc: 'D 為年需求量；S 為每次訂購成本 (元/次)；H 為單件年持有成本 (元/件/年)。',
    fields: [
      { key: 'demand', label: '年需求量 (D)', value: 10000, unit: '件/年' },
      { key: 'order', label: '每次訂購成本 (S)', value: 200, unit: '元/次' },
      { key: 'hold', label: '單件年持有成本 (H)', value: 4, unit: '元/件/年' },
    ],
    presets: [
      {
        name: '經典題型：D=10,000 / S=200 / H=4',
        description: 'EOQ 剛好為 1,000 件之整數題',
        values: { demand: 10000, order: 200, hold: 4 },
      },
      {
        name: '高頻採購電子零組件',
        description: 'D=48,000 / S=150 / H=2.5',
        values: { demand: 48000, order: 150, hold: 2.5 },
      },
    ],
    calculate: (v) => {
      const q = Math.sqrt((2 * v.demand * v.order) / v.hold);
      const n = v.demand / q;
      const cycleDays = 365 / n;
      const totalCost = Math.sqrt(2 * v.demand * v.order * v.hold);
      return {
        results: [
          { label: '經濟訂購批量 (EOQ)', value: q.toFixed(0), unit: '件', highlight: true, badge: '總成本最低點', badgeVariant: 'safe' },
          { label: '每年下單次數 (N)', value: n.toFixed(2), unit: '次/年' },
          { label: '平均訂購週期', value: cycleDays.toFixed(1), unit: '天/次' },
          { label: '年總存貨相關成本', value: totalCost.toFixed(0), unit: '元' },
        ],
        steps: [
          `1. EOQ = √((2 × ${v.demand} × ${v.order}) ÷ ${v.hold}) = √(${(2 * v.demand * v.order) / v.hold}) = ${q.toFixed(0)} 件`,
          `2. 每年訂購次數：N = ${v.demand} ÷ ${q.toFixed(0)} = ${n.toFixed(2)} 次`,
          `3. 訂購間隔週期：365 天 ÷ ${n.toFixed(2)} 次 = ${cycleDays.toFixed(1)} 天`,
          `4. 最低年相關總成本：TC = √(2 × ${v.demand} × ${v.order} × ${v.hold}) = ${totalCost.toFixed(0)} 元`,
        ],
      };
    },
  },
  {
    id: 'epq',
    title: '經濟生產批量 (EPQ / ELS)',
    short: '生產批量 EPQ',
    category: '庫存管理 (INV)',
    icon: '🏭',
    latexFormula: '\\text{EPQ} = \\sqrt{\\frac{2DS}{H \\left(1 - \\frac{d}{p}\\right)}}, \\quad I_{\\max} = \\text{EPQ} \\times \\left(1 - \\frac{d}{p}\\right)',
    formulaDesc: '適用於自製零件情境；p 為每日生產速率、d 為每日消耗速率 (p > d)。因邊生產邊消耗，持有成本降低，批量大於 EOQ。',
    fields: [
      { key: 'demand', label: '年需求量 (D)', value: 12000, unit: '件/年' },
      { key: 'setup', label: '每次機台整備成本 (S)', value: 300, unit: '元/次' },
      { key: 'hold', label: '單件年持有成本 (H)', value: 5, unit: '元/件/年' },
      { key: 'p', label: '每日生產速率 (p)', value: 100, unit: '件/天' },
      { key: 'd', label: '每日消耗速率 (d)', value: 40, unit: '件/天' },
    ],
    presets: [
      {
        name: '典型自製沖壓件範例',
        description: 'D=12,000, S=300, H=5, p=100, d=40',
        values: { demand: 12000, setup: 300, hold: 5, p: 100, d: 40 },
      },
    ],
    calculate: (v) => {
      const ratio = 1 - v.d / v.p;
      const epq = Math.sqrt((2 * v.demand * v.setup) / (v.hold * ratio));
      const imax = epq * ratio;
      return {
        results: [
          { label: '經濟生產批量 (EPQ)', value: epq.toFixed(0), unit: '件', highlight: true, badge: '單批生產量', badgeVariant: 'safe' },
          { label: '最高庫存水準 (Imax)', value: imax.toFixed(0), unit: '件' },
          { label: '每年整備批次', value: (v.demand / epq).toFixed(2), unit: '批/年' },
        ],
        steps: [
          `1. 產銷速率比校正因子：(1 - d/p) = (1 - ${v.d}/${v.p}) = ${ratio.toFixed(2)}`,
          `2. EPQ = √((2 × ${v.demand} × ${v.setup}) ÷ (${v.hold} × ${ratio.toFixed(2)})) = ${epq.toFixed(0)} 件`,
          `3. 最大累積庫存：Imax = ${epq.toFixed(0)} × ${ratio.toFixed(2)} = ${imax.toFixed(0)} 件`,
        ],
      };
    },
  },
  {
    id: 'ss',
    title: '安全庫存 (SS) 與再訂購點 (ROP)',
    short: '安全庫存 ROP',
    category: '庫存管理 (INV)',
    icon: '🛡️',
    latexFormula: '\\text{SS} = Z \\times \\sigma_d \\times \\sqrt{L}, \\quad \\text{ROP} = (\\bar{d} \\times L) + \\text{SS}',
    formulaDesc: '需求變動且前置時間 L 固定情境。d̄ 為平均日需求、σd 為日需求標準差、Z 為對應服務水準安全係數 (95% 常態為 1.65，99% 為 2.33)。',
    fields: [
      { key: 'daily', label: '平均每日需求 (d̄)', value: 50, unit: '件/天' },
      { key: 'sigma', label: '日需求標準差 (σd)', value: 6, unit: '件' },
      { key: 'lead', label: '採購前置時間 (L)', value: 9, unit: '天' },
      { key: 'z', label: '安全係數 (Z 值)', value: 1.65, step: 0.01, unit: '(95%)' },
    ],
    presets: [
      {
        name: '95% 服務水準 (Z=1.65, L=9天)',
        description: 'd̄=50, σd=6, L=9, Z=1.65',
        values: { daily: 50, sigma: 6, lead: 9, z: 1.65 },
      },
      {
        name: '99% 高可靠度要求 (Z=2.33, L=16天)',
        description: 'd̄=80, σd=10, L=16, Z=2.33',
        values: { daily: 80, sigma: 10, lead: 16, z: 2.33 },
      },
    ],
    calculate: (v) => {
      const ss = v.z * v.sigma * Math.sqrt(v.lead);
      const leadDemand = v.daily * v.lead;
      const rop = leadDemand + ss;
      return {
        results: [
          { label: '前置期平均需求', value: leadDemand.toFixed(1), unit: '件' },
          { label: '安全庫存量 (SS)', value: ss.toFixed(1), unit: '件', badge: `Z=${v.z}`, badgeVariant: 'info' },
          { label: '再訂購點 (ROP)', value: rop.toFixed(1), unit: '件', highlight: true, badge: '觸發下單線', badgeVariant: 'warning' },
        ],
        steps: [
          `1. 前置時間需求：d̄ × L = ${v.daily} × ${v.lead} = ${leadDemand.toFixed(1)} 件`,
          `2. 安全庫存計算：SS = ${v.z} × ${v.sigma} × √${v.lead} = ${v.z} × ${v.sigma} × ${Math.sqrt(v.lead).toFixed(2)} = ${ss.toFixed(1)} 件 (實務通常無條件進位取 ${Math.ceil(ss)} 件)`,
          `3. 再訂購點觸發位：ROP = ${leadDemand.toFixed(1)} + ${ss.toFixed(1)} = ${rop.toFixed(1)} 件 (庫存降至 ${Math.ceil(rop)} 件即時下單)`,
        ],
      };
    },
  },
  {
    id: 'cpk',
    title: '製程能力指數 (Cp / Ca / Cpk)',
    short: '製程能力 Cpk',
    category: '品質管制 (QC)',
    icon: '📊',
    latexFormula: 'Ca = \\frac{\\bar{X} - \\mu}{T/2} \\times 100\\%, \\quad Cp = \\frac{\\text{USL}-\\text{LSL}}{6\\sigma}, \\quad Cpk = \\min\\left(\\frac{\\text{USL}-\\bar{X}}{3\\sigma}, \\frac{\\bar{X}-\\text{LSL}}{3\\sigma}\\right)',
    formulaDesc: 'μ 為規格中心；T 為公差寬度 (USL - LSL)。Ca 衡量準確度 (製程中心偏移程度)；Cp 衡量精密度 (製程離散寬度)；Cpk 為綜合製程能力指標。',
    fields: [
      { key: 'usl', label: '規格上限 (USL)', value: 50.06, step: 0.001, unit: 'mm' },
      { key: 'lsl', label: '規格下限 (LSL)', value: 49.94, step: 0.001, unit: 'mm' },
      { key: 'mean', label: '製程平均值 (X̄)', value: 50.01, step: 0.001, unit: 'mm' },
      { key: 'sd', label: '製程標準差 (σ)', value: 0.01, step: 0.001, unit: 'mm' },
    ],
    presets: [
      {
        name: '軸承外徑試題 (50±0.06mm / X̄=50.01 / σ=0.01)',
        description: 'Ca=16.67%, Cp=2.00, Cpk=1.67',
        values: { usl: 50.06, lsl: 49.94, mean: 50.01, sd: 0.01 },
      },
      {
        name: '製程中心嚴重偏移警戒 (Cpk < 1.0)',
        description: 'USL=20.2, LSL=19.8, X̄=20.15, σ=0.05',
        values: { usl: 20.2, lsl: 19.8, mean: 20.15, sd: 0.05 },
      },
    ],
    calculate: (v) => {
      const mid = (v.usl + v.lsl) / 2;
      const t = v.usl - v.lsl;
      const ca = ((v.mean - mid) / (t / 2)) * 100;
      const cp = t / (6 * v.sd);
      const cpu = (v.usl - v.mean) / (3 * v.sd);
      const cpl = (v.mean - v.lsl) / (3 * v.sd);
      const cpk = Math.min(cpu, cpl);

      let grade = 'A 級 (優良)';
      let variant: 'safe' | 'warning' | 'danger' = 'safe';
      if (cpk >= 1.67) {
        grade = 'A+ 級 (過剩/特優)';
        variant = 'safe';
      } else if (cpk >= 1.33) {
        grade = 'A 級 (製程能力充足)';
        variant = 'safe';
      } else if (cpk >= 1.0) {
        grade = 'B 級 (合格待加強)';
        variant = 'warning';
      } else {
        grade = 'C/D 級 (不合格需改善)';
        variant = 'danger';
      }

      return {
        results: [
          { label: '規格公差 (T)', value: t.toFixed(3), unit: 'mm' },
          { label: '製程準確度 (Ca)', value: `${ca.toFixed(2)}%`, badge: Math.abs(ca) <= 12.5 ? 'A 級' : 'B 級', badgeVariant: Math.abs(ca) <= 12.5 ? 'safe' : 'warning' },
          { label: '製程精密度 (Cp)', value: cp.toFixed(2), badge: cp >= 1.33 ? '充足' : '不足', badgeVariant: cp >= 1.33 ? 'safe' : 'warning' },
          { label: '製程綜合能力 (Cpk)', value: cpk.toFixed(2), highlight: true, badge: grade, badgeVariant: variant },
        ],
        steps: [
          `1. 規格中心與公差：μ = (${v.usl} + ${v.lsl}) / 2 = ${mid.toFixed(3)}, T = ${t.toFixed(3)} mm`,
          `2. 準確度：Ca = (${v.mean} - ${mid.toFixed(3)}) ÷ (${t.toFixed(3)} / 2) = ${ca.toFixed(2)}%`,
          `3. 精密度：Cp = ${t.toFixed(3)} ÷ (6 × ${v.sd}) = ${cp.toFixed(2)}`,
          `4. 上限指標：Cpu = (${v.usl} - ${v.mean}) ÷ (3 × ${v.sd}) = ${cpu.toFixed(2)}`,
          `5. 下限指標：Cpl = (${v.mean} - ${v.lsl}) ÷ (3 × ${v.sd}) = ${cpl.toFixed(2)}`,
          `6. 綜合指標：Cpk = min(Cpu, Cpl) = ${cpk.toFixed(2)} (${grade})`,
        ],
      };
    },
  },
  {
    id: 'oee',
    title: '整體設備效率 (OEE) 綜合計算',
    short: '設備效率 OEE',
    category: '生產線管理 (TPM)',
    icon: '⚡',
    latexFormula: '\\text{OEE} = A \\times P \\times Q = \\frac{\\text{稼動時間}}{\\text{負荷時間}} \\times \\frac{\\text{理論週期} \\times \\text{總產量}}{\\text{稼動時間}} \\times \\frac{\\text{良品數}}{\\text{總產量}}',
    formulaDesc: 'A 為時間稼動率 (可動率)；P 為性能稼動率；Q 為良品率。三者相乘即為 OEE。世界級 World Class 基準標竿通常為 OEE ≥ 85%。',
    fields: [
      { key: 'planned', label: '計畫生產負荷時間', value: 420, unit: '分鐘' },
      { key: 'run', label: '實際設備稼動時間', value: 378, unit: '分鐘' },
      { key: 'cycle', label: '理論標準加工週期', value: 0.5, step: 0.01, unit: '分/件' },
      { key: 'total', label: '當班總生產數量', value: 600, unit: '件' },
      { key: 'good', label: '合格良品數量', value: 570, unit: '件' },
    ],
    presets: [
      {
        name: '典型試題 (420分 / 378分 / 600件 / 570件)',
        description: 'A=90%, P=79.37%, Q=95%, OEE=67.86%',
        values: { planned: 420, run: 378, cycle: 0.5, total: 600, good: 570 },
      },
      {
        name: '世界級標竿工廠 (OEE > 85%)',
        description: 'A=95%, P=95%, Q=98%, OEE=88.4%',
        values: { planned: 480, run: 456, cycle: 0.7, total: 620, good: 608 },
      },
    ],
    calculate: (v) => {
      const a = v.run / v.planned;
      const p = (v.cycle * v.total) / v.run;
      const q = v.good / v.total;
      const oee = a * p * q;
      return {
        results: [
          { label: '時間稼動率 (A)', value: `${(a * 100).toFixed(2)}%`, badge: a >= 0.9 ? '達標' : '偏低', badgeVariant: a >= 0.9 ? 'safe' : 'warning' },
          { label: '性能稼動率 (P)', value: `${(p * 100).toFixed(2)}%`, badge: p >= 0.95 ? '標竿' : '需檢修', badgeVariant: p >= 0.95 ? 'safe' : 'warning' },
          { label: '良品產出率 (Q)', value: `${(q * 100).toFixed(2)}%`, badge: q >= 0.98 ? '優異' : '有不良', badgeVariant: q >= 0.98 ? 'safe' : 'warning' },
          { label: '整體設備效率 (OEE)', value: `${(oee * 100).toFixed(2)}%`, highlight: true, badge: oee >= 0.85 ? '世界級 (World Class)' : '常規水準', badgeVariant: oee >= 0.85 ? 'safe' : 'info' },
        ],
        steps: [
          `1. 時間稼動率：A = ${v.run} ÷ ${v.planned} = ${(a * 100).toFixed(2)}%`,
          `2. 性能稼動率：P = (${v.cycle} × ${v.total}) ÷ ${v.run} = ${(p * 100).toFixed(2)}%`,
          `3. 良品產出率：Q = ${v.good} ÷ ${v.total} = ${(q * 100).toFixed(2)}%`,
          `4. 整體 OEE：${(a * 100).toFixed(2)}% × ${(p * 100).toFixed(2)}% × ${(q * 100).toFixed(2)}% = ${(oee * 100).toFixed(2)}%`,
        ],
      };
    },
  },
  {
    id: 'mtbf',
    title: '設備可靠度指標 (MTBF / MTTR / 可用度)',
    short: '可靠度 MTBF',
    category: '設備維護 (TPM)',
    icon: '🔧',
    latexFormula: '\\text{MTBF} = \\frac{\\text{有效運轉時間}}{N}, \\quad \\text{MTTR} = \\frac{\\text{總修復時間}}{N}, \\quad A_i = \\frac{\\text{MTBF}}{\\text{MTBF} + \\text{MTTR}} \\times 100\\%',
    formulaDesc: 'MTBF (Mean Time Between Failures) 為平均故障間隔時間；MTTR (Mean Time To Repair) 為平均修復時間；Ai 為固有可用度 (Inherent Availability)。',
    fields: [
      { key: 'uptime', label: '總有效運轉時間', value: 600, unit: '小時' },
      { key: 'failures', label: '突發故障停機次數', value: 4, step: 1, unit: '次' },
      { key: 'repair', label: '累計維修停機時間', value: 8, unit: '小時' },
    ],
    presets: [
      {
        name: '連續一個月切削機台試題',
        description: '運轉 600h, 故障 4次, 修復 8h',
        values: { uptime: 600, failures: 4, repair: 8 },
      },
      {
        name: '高頻停機瓶頸設備',
        description: '運轉 120h, 故障 8次, 修復 16h',
        values: { uptime: 120, failures: 8, repair: 16 },
      },
    ],
    calculate: (v) => {
      const mtbf = v.uptime / v.failures;
      const mttr = v.repair / v.failures;
      const availability = (mtbf / (mtbf + mttr)) * 100;
      return {
        results: [
          { label: '平均故障間隔 (MTBF)', value: mtbf.toFixed(1), unit: '小時/次', highlight: true, badge: '可靠度', badgeVariant: 'safe' },
          { label: '平均修復時間 (MTTR)', value: mttr.toFixed(1), unit: '小時/次', badge: '維護力', badgeVariant: 'warning' },
          { label: '固有可用度 (Ai)', value: `${availability.toFixed(2)}%`, highlight: true, badge: availability >= 95 ? '優' : '待加強', badgeVariant: availability >= 95 ? 'safe' : 'danger' },
        ],
        steps: [
          `1. MTBF = ${v.uptime} 小時 ÷ ${v.failures} 次 = ${mtbf.toFixed(2)} 小時/次`,
          `2. MTTR = ${v.repair} 小時 ÷ ${v.failures} 次 = ${mttr.toFixed(2)} 小時/次`,
          `3. 可用度：Ai = ${mtbf.toFixed(2)} ÷ (${mtbf.toFixed(2)} + ${mttr.toFixed(2)}) = ${availability.toFixed(2)}%`,
        ],
      };
    },
  },
];
type PracticeQuestion = {
  calcId: string;
  question: string;
  answer: string;
  tolerance: number;
  unit: string;
  hint: string;
  presetValues: Record<string, number>;
};

const practiceQuestions: PracticeQuestion[] = [
  {
    calcId: 'st',
    question: '某工站平均觀測時間為 20 秒，評比係數 110%，寬放率為 10%（採外加法）。請問該工站之標準工時應為多少秒？',
    answer: '24.2',
    tolerance: 0.05,
    unit: '秒',
    hint: '先求正常時間 NT = 20 × 1.10 = 22 秒；外加法 ST = 22 × (1 + 0.10) = 24.2 秒。',
    presetValues: { ot: 20, rating: 110, allowance: 10 },
  },
  {
    calcId: 'eoq',
    question: '工廠對某零件年需求量 D = 8,000 件，每次訂購成本 S = 50 元，每件年持有成本 H = 2 元。請問經濟訂購量 (EOQ) 約為多少件？',
    answer: '632',
    tolerance: 1.0,
    unit: '件',
    hint: 'EOQ = √(2 × 8000 × 50 ÷ 2) = √400,000 ≈ 632.45 件（四捨五入取整數 632 件）。',
    presetValues: { demand: 8000, order: 50, hold: 2 },
  },
  {
    calcId: 'ss',
    question: '某物料平均每日耗用 50 件，日耗用標準差 6 件，交期固定 9 天，95% 服務水準 (Z=1.65)。請問再訂購點 (ROP) 應設為多少件？',
    answer: '480',
    tolerance: 0.5,
    unit: '件',
    hint: 'SS = 1.65 × 6 × √9 = 29.7 件 ≈ 30 件；ROP = (50 × 9) + 30 = 480 件。',
    presetValues: { daily: 50, sigma: 6, lead: 9, z: 1.65 },
  },
  {
    calcId: 'cpk',
    question: '軸承規格 50 ± 0.06 mm，抽取樣本平均值 X̄ = 50.01 mm，標準差 σ = 0.01 mm。請問精密度指標 Cp 值為何？',
    answer: '2.0',
    tolerance: 0.05,
    unit: '',
    hint: '公差 T = 50.06 - 49.94 = 0.12 mm；Cp = T ÷ (6 × 0.01) = 0.12 ÷ 0.06 = 2.0。',
    presetValues: { usl: 50.06, lsl: 49.94, mean: 50.01, sd: 0.01 },
  },
  {
    calcId: 'oee',
    question: '某設備負荷時間 420 分鐘，實際稼動 378 分鐘。理論週期 0.5 分/件，總產出 600 件，良品 570 件。請問良品率 (Q) 為多少 %？',
    answer: '95',
    tolerance: 0.1,
    unit: '%',
    hint: '良品率 Q = 570 ÷ 600 = 0.95 = 95%。',
    presetValues: { planned: 420, run: 378, cycle: 0.5, total: 600, good: 570 },
  },
  {
    calcId: 'mtbf',
    question: '機台運轉 120 小時，期間發生突發故障並停機維修 3 小時，請問固有可用度 Ai 約為多少 %？（答案請四捨五入至小數後兩位）',
    answer: '97.56',
    tolerance: 0.05,
    unit: '%',
    hint: '故障 1 次，MTBF = 120h，MTTR = 3h；Ai = 120 ÷ (120 + 3) = 120 ÷ 123 ≈ 97.56%。',
    presetValues: { uptime: 120, failures: 1, repair: 3 },
  },
];

export function createAPPX01Lab(): HTMLElement {
  const lab = div('appx-lab');
  lab.dataset.noTerminology = 'true';

  let activeIndex = 0;
  let katex: any = null;

  // Header Banner
  lab.innerHTML = `
    <div class="appx-lab__eyebrow">
      <span>📐 INTERACTIVE FORMULA LAB</span>
      <span>${calculators.length} 個定量計算工具 · 支援動態 LaTeX 推導</span>
    </div>
    <div class="appx-lab__intro">
      <div>
        <h2>iPAS 核心定量公式試算工作坊</h2>
        <p>涵蓋評鑑大綱歷屆必考 8 大題型：即時調整數值、觀察代入推導步驟，強化考場公式手感。</p>
      </div>
      <div class="appx-lab__mark">∑</div>
    </div>
  `;

  const tabsContainer = div('appx-lab__tabs');
  const panelContainer = div('appx-lab__panel');

  // Trigger KaTeX load in background
  loadKaTeX()
    .then((inst) => {
      katex = inst;
      renderCurrentPanel();
    })
    .catch((err) => {
      console.warn('KaTeX load fallback to plaintext:', err);
    });

  const renderTabs = () => {
    tabsContainer.replaceChildren();
    calculators.forEach((calc, idx) => {
      const tab = h(
        'button',
        {
          className: `appx-lab__tab${idx === activeIndex ? ' is-active' : ''}`,
          type: 'button',
          'aria-pressed': String(idx === activeIndex),
        },
        `${calc.icon} ${calc.short}`
      );
      tab.addEventListener('click', () => {
        activeIndex = idx;
        renderTabs();
        renderCurrentPanel();
      });
      tabsContainer.appendChild(tab);
    });
  };

  const renderCurrentPanel = () => {
    panelContainer.replaceChildren();
    const calc = calculators[activeIndex];

    // 1. Panel Header
    const head = div('appx-lab__panel-head');
    head.innerHTML = `
      <div>
        <div class="appx-lab__panel-badge-row">
          <span class="appx-lab__step">CALCULATOR 0${activeIndex + 1}</span>
          <span class="appx-lab__cat-badge">${calc.category}</span>
        </div>
        <h3>${calc.icon} ${calc.title}</h3>
      </div>
      <span class="appx-lab__live"><i></i> 即時運算</span>
    `;

    // 2. KaTeX Formula Card
    const formulaBox = div('appx-lab__formula-box');
    let formulaHtml = `<div class="appx-lab__formula-raw">${calc.latexFormula}</div>`;
    if (katex) {
      try {
        formulaHtml = katex.renderToString(calc.latexFormula, {
          displayMode: true,
          throwOnError: false,
        });
      } catch (e) {
        console.error('KaTeX render error:', e);
      }
    }
    formulaBox.innerHTML = `
      <div class="appx-lab__formula-render">${formulaHtml}</div>
      <p class="appx-lab__formula-desc">${calc.formulaDesc}</p>
    `;

    // 3. Preset Scenarios Buttons
    const presetsRow = div('appx-lab__presets-row');
    presetsRow.innerHTML = `<span class="appx-lab__presets-label">⚡ 快速代入題型：</span>`;
    const presetsGroup = div('appx-lab__presets-group');

    calc.presets.forEach((preset) => {
      const pBtn = h('button', {
        className: 'appx-lab__preset-chip',
        type: 'button',
        title: preset.description,
      }, preset.name);

      pBtn.addEventListener('click', () => {
        for (const [key, val] of Object.entries(preset.values)) {
          const input = form.querySelector(`input[name="${key}"]`) as HTMLInputElement | null;
          if (input) {
            input.value = String(val);
          }
        }
        updateCalculation();
      });
      presetsGroup.appendChild(pBtn);
    });
    presetsRow.appendChild(presetsGroup);

    // 4. Input Fields Form
    const form = div('appx-lab__fields');
    const inputs: HTMLInputElement[] = [];

    calc.fields.forEach((field) => {
      const label = h('label', { className: 'appx-lab__field' });
      label.innerHTML = `
        <span class="appx-lab__field-label">
          ${field.label}
          ${field.unit ? `<small class="appx-lab__field-unit">(${field.unit})</small>` : ''}
        </span>
      `;
      const input = h('input', {
        type: 'number',
        name: field.key,
        value: String(field.value),
        min: '0',
        step: String(field.step ?? 'any'),
        inputmode: 'decimal',
        'aria-label': field.label,
      }) as HTMLInputElement;

      input.addEventListener('input', () => updateCalculation());
      inputs.push(input);
      label.appendChild(input);
      form.appendChild(label);
    });

    // 5. Results & Steps
    const resultsContainer = div('appx-lab__results');
    const stepsCard = div('appx-lab__steps-card');

    const updateCalculation = () => {
      const values: Record<string, number> = {};
      let hasInvalid = false;

      for (const input of inputs) {
        const val = Number(input.value);
        if (!Number.isFinite(val) || val < 0) {
          hasInvalid = true;
        }
        values[input.name] = val;
      }

      if (hasInvalid) {
        resultsContainer.innerHTML = `<p class="appx-lab__error">⚠️ 請輸入有效的正數值以進行計算。</p>`;
        stepsCard.style.display = 'none';
        return;
      }

      const output = calc.calculate(values);

      // Render KPI cards
      resultsContainer.innerHTML = output.results
        .map((res) => `
          <div class="appx-lab__result${res.highlight ? ' is-primary' : ''}">
            <div class="appx-lab__result-top">
              <span class="appx-lab__result-label">${res.label}</span>
              ${res.badge ? `<span class="badge badge--${res.badgeVariant || 'info'} appx-lab__result-badge">${res.badge}</span>` : ''}
            </div>
            <strong class="appx-lab__result-val">
              ${res.value}
              ${res.unit ? `<small>${res.unit}</small>` : ''}
            </strong>
          </div>
        `)
        .join('');

      // Render Step-by-step breakdown
      stepsCard.style.display = 'block';
      stepsCard.innerHTML = `
        <div class="appx-lab__steps-title">
          <span>📝</span> <strong>計算步驟詳細推導</strong>
        </div>
        <ul class="appx-lab__steps-list">
          ${output.steps.map((st) => `<li>${st}</li>`).join('')}
        </ul>
      `;
    };

    updateCalculation();

    panelContainer.append(head, formulaBox, presetsRow, form, resultsContainer, stepsCard);
  };

  renderTabs();
  renderCurrentPanel();

  lab.append(tabsContainer, panelContainer, createPracticeSection((calcId, values) => {
    // Switch to corresponding calculator and apply values
    const targetIdx = calculators.findIndex((c) => c.id === calcId);
    if (targetIdx !== -1) {
      activeIndex = targetIdx;
      renderTabs();
      renderCurrentPanel();

      const form = panelContainer.querySelector('.appx-lab__fields');
      if (form) {
        for (const [key, val] of Object.entries(values)) {
          const input = form.querySelector(`input[name="${key}"]`) as HTMLInputElement | null;
          if (input) input.value = String(val);
        }
        const event = new Event('input', { bubbles: true });
        form.querySelector('input')?.dispatchEvent(event);
      }

      // Smooth scroll up to panel
      panelContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }));

  return lab;
}

function createPracticeSection(
  onApplyToCalculator: (calcId: string, values: Record<string, number>) => void
): HTMLElement {
  const card = div('appx-practice');
  card.innerHTML = `
    <div class="appx-practice__title">
      <span class="appx-practice__title-badge">隨堂速練</span>
      <strong>iPAS 歷屆高頻計算題挑戰</strong>
      <small>先試著在草稿紙手算，再點擊檢查答案或代入試算工具驗證。</small>
    </div>
  `;

  let currentIdx = 0;
  const body = div('appx-practice__body');

  const renderQuestion = () => {
    const item = practiceQuestions[currentIdx];
    body.innerHTML = `
      <div class="appx-practice__meta-row">
        <span class="appx-practice__count">CHALLENGE 0${currentIdx + 1} / 0${practiceQuestions.length}</span>
        <button type="button" class="appx-practice__import-btn" title="將題目數據直接填入上方計算機">
          📐 帶入上方計算機
        </button>
      </div>
      <p class="appx-practice__question">${item.question}</p>
      <form class="appx-practice__form">
        <label class="sr-only" for="appx-answer-input">輸入計算答案</label>
        <div class="appx-practice__input-wrap">
          <input
            id="appx-answer-input"
            name="answer"
            type="number"
            inputmode="decimal"
            placeholder="請輸入數值"
            step="any"
            required
          />
          <span class="appx-practice__unit">${item.unit}</span>
        </div>
        <button type="submit" class="appx-practice__submit-btn">檢查答案 →</button>
      </form>
      <div class="appx-practice__feedback" aria-live="polite"></div>
    `;

    // Import to calculator
    const importBtn = body.querySelector('.appx-practice__import-btn')!;
    importBtn.addEventListener('click', () => {
      onApplyToCalculator(item.calcId, item.presetValues);
    });

    const form = body.querySelector('form')!;
    form.addEventListener('submit', (evt) => {
      evt.preventDefault();
      const entered = Number(new FormData(form).get('answer'));
      const target = Number(item.answer);
      const isCorrect = Math.abs(entered - target) <= item.tolerance;
      const feedback = body.querySelector('.appx-practice__feedback')!;

      feedback.innerHTML = isCorrect
        ? `
          <div class="appx-practice__feedback-box is-correct">
            <strong>🎉 答對了！恭喜完全掌握此題型。</strong>
            <p>${item.hint}</p>
          </div>
        `
        : `
          <div class="appx-practice__feedback-box is-wrong">
            <strong>❌ 再算一次看看！</strong>
            <p>提示：${item.hint}</p>
          </div>
        `;

      if (isCorrect) {
        const nextBtn = btn(
          'btn btn--primary appx-practice__next',
          currentIdx === practiceQuestions.length - 1 ? '重新練習第一題 ↺' : '下一題挑戰 →',
          () => {
            currentIdx = (currentIdx + 1) % practiceQuestions.length;
            renderQuestion();
          }
        );
        feedback.appendChild(nextBtn);
      }
    });
  };

  renderQuestion();
  card.appendChild(body);
  return card;
}
