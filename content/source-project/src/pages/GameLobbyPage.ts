/**
 * GameLobbyPage.ts — Game Selection Lobby & Progress Dashboard
 * Displays the 108-Level Master Progress Matrix and per-chapter level squares.
 * Squares default to gray/empty, turning vibrant green upon level completion.
 */

import { div, h } from '@/utils/render';
import { PageShell } from '@/components/organisms';
import { navigateTo } from '@/services/router';
import { isLevelCompleted, getCompletedCount, getTotalStars } from '@/game/progress';

interface LevelItem {
  id: string;
  title: string;
  brief: string;
}

interface ChapterGroup {
  id: string;
  code: string;
  title: string;
  desc: string;
  levels: LevelItem[];
}

export function GameLobbyPage(): HTMLElement {
  const page = div('game-lobby-page detail-page-container anim-stagger');
  page.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px 16px;
    max-width: 1050px;
    margin: 0 auto;
    width: 100%;
  `;

  const completedCount = getCompletedCount();
  const totalStars = getTotalStars();
  const totalLevels = 108;
  const progressPercent = ((completedCount / totalLevels) * 100).toFixed(1);

  // 1. Hero Section
  const hero = div('dashboard__hero');
  hero.style.cssText = `
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
    border-radius: var(--radius-2xl, 20px);
    padding: 32px 24px;
    color: #fff;
    box-shadow: 0 10px 25px -5px rgba(49, 46, 129, 0.4);
  `;
  hero.innerHTML = `
    <div style="font-size: 13px; font-weight: 700; color: #a5b4fc; text-transform: uppercase; letter-spacing: 1px;">
      智慧工廠・接單挑戰 (Smart Factory Simulation)
    </div>
    <h1 style="font-size: 28px; font-weight: 800; margin-top: 8px; line-height: 1.2;">
      卡牌決策 ✕ 工廠資料流模擬
    </h1>
    <p style="font-size: 14px; color: rgba(255,255,255,0.85); margin-top: 10px; max-width: 680px; line-height: 1.6;">
      化身為智慧生產工程師，在有限預算與產能資源下接單、配置途程、調派搬運、分析品質並連線資料。從可觀察的現場物理與資訊因果，深度掌握 iPAS 認證核心技能。
    </p>
  `;
  page.appendChild(hero);

  // 2. Metrics Overview Row
  const metricsRow = div('dashboard__metrics');
  metricsRow.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  `;
  metricsRow.innerHTML = `
    <div class="dashboard__metric">
      <span>目前闖關進度</span>
      <strong style="color: ${completedCount > 0 ? '#10b981' : 'var(--color-text-primary)'};">
        ${completedCount} <small style="font-size: 14px; color: var(--color-text-tertiary, #64748b);">/ ${totalLevels} 關 (${progressPercent}%)</small>
      </strong>
      <small style="color: #10b981;">累計獲得 ⭐ ${totalStars} 顆星等</small>
    </div>
    <div class="dashboard__metric">
      <span>工程決策卡牌庫</span>
      <strong>334 <small style="font-size: 14px; color: #64748b;">張</small></strong>
      <small style="color: #6366f1;">F01–F16 全家族落地</small>
    </div>
    <div class="dashboard__metric">
      <span>公式與易錯陷阱</span>
      <strong>17 <small style="font-size: 14px; color: #64748b;">項</small></strong>
      <small style="color: #f59e0b;">F01~F07 及 E01~E10</small>
    </div>
  `;
  page.appendChild(metricsRow);

  // 3. 全域 108 關熱圖小方格矩陣 (Master Matrix)
  const masterMatrix = buildMasterMatrix(completedCount, totalLevels, progressPercent);
  page.appendChild(masterMatrix);

  // 4. Chapter Level Sections with Square Indicators
  const chaptersContainer = div('lobby-sections');
  chaptersContainer.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';

  const chapterData = getChapterData();
  chapterData.forEach((ch) => {
    chaptersContainer.appendChild(buildChapterCard(ch));
  });

  page.appendChild(chaptersContainer);

  return PageShell('/game', page);
}

/** 建立全域 108 關總覽熱圖小方格矩陣 */
function buildMasterMatrix(completedCount: number, totalLevels: number, percent: string): HTMLElement {
  const card = div('master-matrix-card');

  // Header & Legend
  const header = div('master-matrix-header');
  header.innerHTML = `
    <div>
      <div style="font-size: 16px; font-weight: 800; color: var(--color-text-primary); display: flex; align-items: center; gap: 8px;">
        <span>📊 全域關卡進度矩陣 (108-Level Matrix)</span>
        <span style="font-size: 12px; background: rgba(99,102,241,0.2); color: #818cf8; padding: 2px 8px; border-radius: 9999px;">
          ${completedCount} / ${totalLevels} (${percent}%)
        </span>
      </div>
      <div style="font-size: 12px; color: var(--color-text-secondary, #94a3b8); margin-top: 4px;">
        點擊任意小方格可快速進入或檢視該關卡
      </div>
    </div>
    <div class="master-matrix-legend">
      <div class="legend-item">
        <span class="legend-box" style="background: var(--color-bg-secondary, #f1f5f9); border: 1px solid var(--color-border, #cbd5e1);"></span>
        <span>灰色小方格：尚未通關</span>
      </div>
      <div class="legend-item">
        <span class="legend-box" style="background: #10b981; border: 1px solid #059669; box-shadow: 0 0 6px rgba(16,185,129,0.5);"></span>
        <span style="color: #10b981; font-weight: 600;">綠色填滿：已通關</span>
      </div>
    </div>
  `;
  card.appendChild(header);

  // Matrix Groups Grid
  const grid = div('master-matrix-grid');

  // Group 1: Tutorials (T01–T04)
  grid.appendChild(createMatrixRow('🔰 導入', ['T01', 'T02', 'T03', 'T04']));

  // Group 2: Subject 1 (C01–C06)
  for (let c = 1; c <= 6; c++) {
    const chCode = `C0${c}`;
    const levelIds = Array.from({ length: 8 }, (_, i) => `${chCode}-L0${i + 1}`);
    grid.appendChild(createMatrixRow(`🏭 ${chCode}`, levelIds));
  }

  // Group 3: Subject 2 (C07–C12)
  for (let c = 7; c <= 12; c++) {
    const chCode = c < 10 ? `C0${c}` : `C${c}`;
    const levelIds = Array.from({ length: 8 }, (_, i) => `${chCode}-L0${i + 1}`);
    grid.appendChild(createMatrixRow(`🤖 ${chCode}`, levelIds));
  }

  // Group 4: Integrated Missions (X01–X08)
  const xLevels = Array.from({ length: 8 }, (_, i) => `X0${i + 1}`);
  grid.appendChild(createMatrixRow('⚡ 綜合', xLevels));

  card.appendChild(grid);
  return card;
}

function createMatrixRow(label: string, levelIds: string[]): HTMLElement {
  const row = div('matrix-group');

  const lbl = div('matrix-group__label', label);
  row.appendChild(lbl);

  const cellsContainer = div('matrix-group__cells');
  levelIds.forEach((lvlId) => {
    const completed = isLevelCompleted(lvlId);
    const shortLabel = lvlId.includes('-') ? lvlId.split('-')[1].replace('L0', 'L') : lvlId;

    const cell = h(
      'button',
      {
        className: `matrix-cell ${completed ? 'matrix-cell--completed' : 'matrix-cell--empty'}`,
        title: `關卡 #${lvlId} (${completed ? '✅ 已通關' : '⬜ 尚未通關'})`,
      },
      completed ? '✓' : shortLabel.replace('T0', '').replace('X0', '')
    );

    cell.addEventListener('click', () => {
      navigateTo(`/game/${lvlId}`);
    });

    cellsContainer.appendChild(cell);
  });

  row.appendChild(cellsContainer);
  return row;
}

/** 建立單一章節卡片，內含關卡小方格進度列與關卡清單 */
function buildChapterCard(chapter: ChapterGroup): HTMLElement {
  const card = div('lobby-chapter-card');
  card.style.cssText = `
    background: var(--color-bg-elevated, #1e293b);
    border: 1px solid var(--color-border, #334155);
    border-radius: var(--radius-xl, 16px);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  `;

  // Chapter Header & Small Squares Progress Row
  const headerRow = div('');
  headerRow.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 12px;
  `;

  const infoCol = div('');
  infoCol.style.cssText = 'flex: 1 1 260px;';
  infoCol.innerHTML = `
    <div style="font-size: 17px; font-weight: 800; color: var(--color-text-primary);">${chapter.title}</div>
    <div style="font-size: 13px; color: var(--color-text-secondary, #94a3b8); margin-top: 4px;">${chapter.desc}</div>
  `;
  headerRow.appendChild(infoCol);

  // 關卡進度小方格列 (Squares Row)
  const squaresBox = div('');
  squaresBox.style.cssText = 'display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0;';

  const chapterCompleted = chapter.levels.filter((l) => isLevelCompleted(l.id)).length;
  const progressRatio = div('chapter-progress-ratio');
  progressRatio.innerHTML = `<span style="font-size: 11px; font-weight: 700; color: var(--color-text-secondary, #64748b);">單元進度：<strong style="color: ${chapterCompleted > 0 ? '#10b981' : 'var(--color-text-primary)'};">${chapterCompleted} / ${chapter.levels.length}</strong></span>`;
  squaresBox.appendChild(progressRatio);

  const squaresRow = div('level-squares-row');
  chapter.levels.forEach((lvl, idx) => {
    const completed = isLevelCompleted(lvl.id);
    const square = h(
      'button',
      {
        className: `level-square ${completed ? 'level-square--completed' : 'level-square--empty'}`,
        title: `${lvl.id}: ${lvl.title} (${completed ? '✅ 已通關' : '⬜ 預設未通關'})`,
      },
      completed ? '✓' : String(idx + 1)
    );

    square.addEventListener('click', () => {
      navigateTo(`/game/${lvl.id}`);
    });

    squaresRow.appendChild(square);
  });
  squaresBox.appendChild(squaresRow);
  headerRow.appendChild(squaresBox);

  card.appendChild(headerRow);

  // Level Cards Grid
  const grid = div('lobby-levels-grid');
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
    margin-top: 4px;
  `;

  chapter.levels.forEach((lvl) => {
    const isCompleted = isLevelCompleted(lvl.id);
    const isPlayable = lvl.id === 'T01' || lvl.id === 'C01-L01';

    const lvlBtn = h(
      'button',
      {
        className: `btn ${isCompleted ? 'btn--primary' : isPlayable ? 'btn--primary' : 'btn--secondary'}`,
        style: isCompleted ? 'background: rgba(16,185,129,0.15); border-color: #10b981;' : '',
      },
      ''
    );
    lvlBtn.style.cssText += `
      text-align: left;
      padding: 12px 14px;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    lvlBtn.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span style="font-size: 11px; font-weight: 700; color: ${isCompleted ? '#10b981' : isPlayable ? '#a5b4fc' : 'var(--color-text-muted, #94a3b8)'};">#${lvl.id}</span>
        <span style="font-size: 11px; color: ${isPlayable && !isCompleted ? '#ffffff' : 'var(--color-text-secondary, #64748b)'};">${isCompleted ? '✅ 已通關' : isPlayable ? '🟢 可遊玩' : '📄 規格書'}</span>
      </div>
      <div style="font-size: 14px; font-weight: 700; color: ${isPlayable && !isCompleted ? '#ffffff' : 'var(--color-text-primary)'};">${lvl.title}</div>
      <div style="font-size: 11px; color: ${isPlayable && !isCompleted ? 'rgba(255,255,255,0.85)' : 'var(--color-text-secondary, #64748b)'}; line-height: 1.3;">${lvl.brief}</div>
    `;

    lvlBtn.addEventListener('click', () => {
      navigateTo(`/game/${lvl.id}`);
    });

    grid.appendChild(lvlBtn);
  });

  card.appendChild(grid);
  return card;
}

function getChapterData(): ChapterGroup[] {
  return [
    {
      id: 'T',
      code: 'T',
      title: '🔰 操作導入任務 (T01–T04)',
      desc: '熟悉卡牌選擇、實體與資料流識別、方案比較與四步復盤學習法。',
      levels: [
        { id: 'T01', title: '第一張改善卡', brief: '學習選卡、設定目標工站並扣減預算' },
        { id: 'T02', title: '看見工件與資料的差別', brief: '單步推演、讀取現場狀態、區分實物與數據' },
        { id: 'T03', title: '預測、比較與重試', brief: '固定基準對照不同瓶頸改善方案' },
        { id: 'T04', title: '讓經驗變成學習紀錄', brief: '執行 APPX04 四步復盤並跳轉教材' },
      ],
    },
    {
      id: 'C01',
      code: 'M11101',
      title: '🏭 C01 生產管理：營運指揮室',
      desc: '生產型態、主生產排程、粗估產能與派工啟發式規則。',
      levels: [
        { id: 'C01-L01', title: '訂單從哪裡進工廠', brief: '正確認定 CODP 解耦點與 MTS/ATO/MTO/ETO' },
        { id: 'C01-L02', title: '工廠的設備要怎麼排', brief: '程序式、產品式與單元式產線布局' },
        { id: 'C01-L03', title: '規劃控制室的四層任務', brief: 'S&OP、MPS、MRP 與現場派工回饋鏈' },
        { id: 'C01-L04', title: '最後 230 件可以賣給誰', brief: 'Available to Promise (ATP) 可承諾量多期核算' },
        { id: 'C01-L05', title: '112.5% 的負荷警報', brief: 'RCCP 粗估產能負荷與合格加班調度' },
        { id: 'C01-L06', title: '同一批工單，兩種績效目標', brief: 'SPT 平均流程時間 vs EDD 最小延遲' },
        { id: 'C01-L07', title: '每到一個決策點重新看 CR', brief: 'Critical Ratio 動態急迫性派工更新' },
        { id: 'C01-L08', title: '人機料一致的開工承諾', brief: '凍結區保護、技能矩陣與品質狀態放行' },
      ],
    },
    {
      id: 'C04',
      code: 'M11201',
      title: '⏱️ C04 工業工程：工作研究室',
      desc: '動作分析、碼錶工時、外加內含寬放、節拍時間與線平衡改善。',
      levels: [
        { id: 'C04-L01', title: '看穿動作的真面目', brief: '動素分類與動作經濟原則' },
        { id: 'C04-L02', title: '雙手並用與工件夾具', brief: '消除持住動素與對稱動作' },
        { id: 'C04-L03', title: '碼錶不會說謊', brief: '觀測時間 OT 與正常時間 NT 評比換算' },
        { id: 'C04-L04', title: '寬放與標準工時算式陷阱', brief: '外加法 vs 內含法標準工時精確試算 (E09)' },
        { id: 'C04-L05', title: '節拍時間才是工廠心跳', brief: '可用工作時間除以需求量推導 TT' },
        { id: 'C04-L06', title: '瓶頸站決定週期時間', brief: '找出 CT 並核算線平衡率 LE 與損失率 BD' },
        { id: 'C04-L07', title: 'ECRS 線平衡大手術', brief: '消除、合併、重排、簡化使各站 CT ≤ TT' },
        { id: 'C04-L08', title: '人機圖看懂誰在等誰', brief: '人機配合週期、閒置時間與工作抽樣' },
      ],
    },
    {
      id: 'C05',
      code: 'M11202',
      title: '🔬 C05 品質管理：品質實驗室',
      desc: 'PAF 品質成本、管制圖選型、Cpk 製程能力與 OCAP 異常處置。',
      levels: [
        { id: 'C05-L01', title: '品質成本的四個抽屜', brief: '預防、鑑定、內損、外損成本模型' },
        { id: 'C05-L02', title: '計量還是計數', brief: 'X-bar/R 與 p/np/c/u 管制圖選型 (E03)' },
        { id: 'C05-L03', title: '點繪管制界限與失控訊號', brief: '九點同側、連續遞增等異常判讀' },
        { id: 'C05-L04', title: '精準度與準確度雙指標', brief: 'Ca 偏移修正與 Cp 變異壓制策略' },
        { id: 'C05-L05', title: 'Cpk 不足時先調中心還是壓變異', brief: '綜合製程能力指標 Cpk 階梯改善' },
        { id: 'C05-L06', title: '首件檢驗與 AQL 抽樣計畫', brief: '單次/雙次抽樣允收與過檢/漏檢取捨' },
        { id: 'C05-L07', title: '失控反應計畫 OCAP 啟動', brief: 'CTQ 異常停線、隔離與參數回溯' },
        { id: 'C05-L08', title: '品質閉環與 8D 根本改善', brief: '真因要因驗證與標準化防呆回寫' },
      ],
    },
    {
      id: 'C06',
      code: 'M11203',
      title: '📈 C06 精實生產：現場改善室',
      desc: 'TPS 七大浪費、看板拉動、快速換模 SMED、TPM 與 OEE 指標。',
      levels: [
        { id: 'C06-L01', title: '七大浪費之首：過量生產', brief: '停止推式盲目排產，消除搬運等待 (E01)' },
        { id: 'C06-L02', title: '5S 與目視化現場標準', brief: '整理整頓清掃清潔素養物理劃界' },
        { id: 'C06-L03', title: '看板卡與拉式單件流', brief: '依下游消耗決定投料，設定 WIP 緩衝上限' },
        { id: 'C06-L04', title: 'SMED 快速換模三步法', brief: '內部作業外部化與換模工序精簡' },
        { id: 'C06-L05', title: '防呆機制設計', brief: '接觸式、計數式與順序式 Poka-Yoke' },
        { id: 'C06-L06', title: 'TPM 全員生產維修與自主保養', brief: '點檢、潤滑、清掃與六大損失防阻' },
        { id: 'C06-L07', title: 'OEE 三維度拆解計算', brief: '時間稼動率 × 性能稼動率 × 良品率 (E02)' },
        { id: 'C06-L08', title: 'MTBF、MTTR 與固有可用度', brief: '可靠度維護排程與維修備件週轉' },
      ],
    },
    {
      id: 'C07',
      code: 'M12101',
      title: '🌐 C07 智慧架構：架構控制室',
      desc: '工業 4.0 演進、ISA-95 層級責任、系統整合與資料契約。',
      levels: [
        { id: 'C07-L01', title: '給工廠做一張數位斷層掃描', brief: '辨識工業演進分期與改造優先權' },
        { id: 'C07-L02', title: '五層樓的工廠，每一層該管什麼', brief: 'ISA-95 L0–L4 職責與時間尺度劃分' },
        { id: 'C07-L03', title: '垂直、水平與端到端工程整合', brief: 'ERP/MES/SCADA 與 PLM 工程版次流' },
        { id: 'C07-L04', title: '聯網不是智慧化的終點', brief: '全面感知、可靠互聯、深度分析到自主決策' },
        { id: 'C07-L05', title: '統一語言的主資料契約', brief: '定義代碼、單位、時間戳與 SSOT 單一來源' },
        { id: 'C07-L06', title: 'IT 與 OT 的邊界守門人', brief: '網路分區、最小權限與本地安全互鎖' },
        { id: 'C07-L07', title: '自動化設備功能清冊', brief: '設備承接能力、功能訊號與維護責任' },
        { id: 'C07-L08', title: '從感測器異常到 ERP 訂單交期', brief: '告警關聯、工單修訂與交期閉環' },
      ],
    },
    {
      id: 'X',
      code: 'X',
      title: '⚡ 跨章綜合挑戰任務 (X01–X08)',
      desc: '串接營運、製程、物料、品質與 IIoT 現場之綜合實戰。',
      levels: [
        { id: 'X01', title: '急單能不能接', brief: '整合 MPS、途程、物料與瓶頸救援決策' },
        { id: 'X02', title: '工程變更與批次召回', brief: 'ECN、BOM 版次、隔離與雙向追溯鏈' },
        { id: 'X03', title: '混線生產換線衝擊', brief: 'SMED 換模、批量規模與線平衡調度' },
        { id: 'X04', title: '品質放行與 AI 門檻', brief: '混淆矩陣、複核容量與客戶零漏檢要求' },
        { id: 'X05', title: '整線瓶頸與 OEE 重分配', brief: '六大損失、MTBF/MTTR 與稼動率分析' },
        { id: 'X06', title: '即時感測與現場追蹤', brief: 'OPC UA、MQTT、條碼 RFID 與批次履歷' },
        { id: 'X07', title: '數位雙生模型驗證', brief: '5C 架構、虛擬調試與受控回寫邊界' },
        { id: 'X08', title: '智慧工廠整廠驗收', brief: '五大工作站跨域變更與八欄最終驗收報告' },
      ],
    },
  ];
}
