/**
 * topics.ts — iPAS 智慧生產工程師（初級）Topic 定義資料庫
 */

import type { Subject, Topic } from '@/core/types';

export const SUBJECTS: readonly Subject[] = [
  {
    code: 'M11',
    name: '生產與作業管理基礎',
    label: '考科一',
    themes: [
      { code: 'M111', name: '生產計畫與製造流程管理' },
      { code: 'M112', name: '工業工程、品質與精實管理' },
    ],
  },
  {
    code: 'M12',
    name: '智慧製造生產線管理基礎',
    label: '考科二',
    themes: [
      { code: 'M121', name: '智慧製造架構與物聯網感知' },
      { code: 'M122', name: '虛實整合、設備智動化與 MES' },
    ],
  },
  {
    code: 'APPX',
    name: '精選附錄與解題指南',
    label: '實戰特訓',
    themes: [
      { code: 'APPX1', name: '核心公式、考古題盲點與參考書目' },
    ],
  },
  {
    code: 'M13',
    name: '智慧生產與管理實務（術科實作）',
    label: '考科三',
    themes: [
      { code: 'M131', name: '生產管理與流程實作（L131）' },
      { code: 'M132', name: '智慧製造現場管理實作（L132）' },
    ],
  },
  {
    code: 'M21',
    name: '智慧製造生產與作業管理之實務應用',
    label: '中級考科一',
    themes: [
      { code: 'M211', name: '智慧製造工廠管理實務（L211）' },
      { code: 'M212', name: '生產流程與產品品質優化（L212）' },
    ],
  },
  {
    code: 'M22',
    name: '智慧製造之設備與製程管理之實務應用',
    label: '中級考科二',
    themes: [
      { code: 'M221', name: '智慧製造設備與製程管理（L221）' },
      { code: 'M222', name: '管控及介面知識（L222）' },
      { code: 'M223', name: '智慧設備操作實務（L223）' },
    ],
  },
] as const;

export const TOPICS: readonly Topic[] = [
  // ── 考科一：生產與作業管理基礎 ──
  {
    code: 'M11101',
    name: '生產管理基本概念',
    themeCode: 'M111',
    subjectCode: 'M11',
    icon: '🏭',
    keywords: 'S&OP 銷售與營運規劃, MPS 主生產排程, 生產型態 (MTS/MTO/ATO/ETO), CODP 客戶訂單解耦點',
    filePath: '科目一_生產與作業管理基礎/01_生產管理基本概念.md',
  },
  {
    code: 'M11102',
    name: '製造流程管理概念',
    themeCode: 'M111',
    subjectCode: 'M11',
    icon: '🔄',
    keywords: '製程途程 (Routing), BOM 結構 (EBOM/MBOM), SOP 標準作業程序, MPI 製造指示, 批次追溯性',
    filePath: '科目一_生產與作業管理基礎/02_製造流程管理概念.md',
  },
  {
    code: 'M11103',
    name: '物料管理概論',
    themeCode: 'M111',
    subjectCode: 'M11',
    icon: '📦',
    keywords: 'MRP 物料需求規劃, 安全庫存 (SS), 經濟訂購量 (EOQ/EPQ), 在製品 (WIP), ABC 存貨分類法',
    filePath: '科目一_生產與作業管理基礎/03_物料管理概論.md',
  },
  {
    code: 'M11201',
    name: '工業工程概論與標準工時',
    themeCode: 'M112',
    subjectCode: 'M11',
    icon: '⏱️',
    keywords: '17 個基本動素 (Therbligs), 動作經濟原則, 標準工時 (ST), 速度評比與寬放, 生產線平衡率 (LE)',
    filePath: '科目一_生產與作業管理基礎/04_工業工程概論與標準工時.md',
  },
  {
    code: 'M11202',
    name: '品質管理與統計製程管制',
    themeCode: 'M112',
    subjectCode: 'M11',
    icon: '📈',
    keywords: 'PAF 品質成本, 統計製程管制 (SPC), 管制圖 (X-bar/R), 製程能力指數 (Cp/Cpk), 首件檢驗 (FAI)',
    filePath: '科目一_生產與作業管理基礎/05_品質管理與統計製程管制.md',
  },
  {
    code: 'M11203',
    name: '精實生產與現場績效管理',
    themeCode: 'M112',
    subjectCode: 'M11',
    icon: '🎯',
    keywords: 'TPS 七大浪費 (Muda), 看板管理 (Kanban), 現場 5S, 防呆法 (Poka-Yoke), TPM 全員生產維護, OEE 效率',
    filePath: '科目一_生產與作業管理基礎/06_精實生產與現場績效管理.md',
  },

  // ── 考科二：智慧製造生產線管理基礎 ──
  {
    code: 'M12101',
    name: '智慧製造概論與 ISA-95 架構',
    themeCode: 'M121',
    subjectCode: 'M12',
    icon: '🏛️',
    keywords: '工業 4.0 核心演進, ISA-95 五層金字塔架構, IT 與 OT 融合, 企業價值鏈垂直整合',
    filePath: '科目二_智慧製造生產線管理基礎/01_智慧製造概論與ISA95架構.md',
  },
  {
    code: 'M12102',
    name: '工業物聯網 IIoT 與通訊協定',
    themeCode: 'M121',
    subjectCode: 'M12',
    icon: '🌐',
    keywords: '工業感測元件, Modbus 協定, OPC UA 跨平台架構, MQTT 發布訂閱, 邊緣運算 (Edge)',
    filePath: '科目二_智慧製造生產線管理基礎/02_工業物聯網IIoT與通訊協定.md',
  },
  {
    code: 'M12103',
    name: '人工智慧 AI 與機器視覺檢測',
    themeCode: 'M121',
    subjectCode: 'M12',
    icon: '🤖',
    keywords: '機器學習分類, 自動光學檢測 (AOI), 深度學習瑕疵分類, 預測性維護 (PdM), 振動特徵分析',
    filePath: '科目二_智慧製造生產線管理基礎/03_人工智慧AI與機器視覺檢測.md',
  },
  {
    code: 'M12201',
    name: '網宇實體系統 CPS 與數位雙生',
    themeCode: 'M122',
    subjectCode: 'M12',
    icon: '🧬',
    keywords: '網宇實體系統 (CPS) 5C 架構, 數位雙生 (Digital Twin), 閉迴路回饋控制, 虛擬調試',
    filePath: '科目二_智慧製造生產線管理基礎/04_網宇實體系統CPS與數位雙生.md',
  },
  {
    code: 'M12202',
    name: '智動化生產設備與傳送系統',
    themeCode: 'M122',
    subjectCode: 'M12',
    icon: '🦾',
    keywords: 'PLC 循環掃描邏輯, 工業機器人, 協作機器人 (Cobot), 無人搬運車 (AGV/AMR), 自動倉儲 (AS/RS)',
    filePath: '科目二_智慧製造生產線管理基礎/05_智動化生產設備與傳送系統.md',
  },
  {
    code: 'M12203',
    name: '智慧工廠生產模式與 MES 整合',
    themeCode: 'M122',
    subjectCode: 'M12',
    icon: '💻',
    keywords: 'MES 核心模組, ERP-MES 雙向整合, 工單生命週期, 現場即時報工, Run-to-Run 控制, 生產履歷',
    filePath: '科目二_智慧製造生產線管理基礎/06_智慧工廠生產模式與MES系統整合.md',
  },

  // ── 考科三：術科實作準備 ──
  {
    code: 'M13101',
    name: '生產管理與流程實作',
    themeCode: 'M131',
    subjectCode: 'M13',
    icon: '🗂️',
    keywords: '工單生命週期 Move In/Out, 產能計算, MES 監控 KPI 判讀, WIP 批次追蹤, 4M1E 異常處理流程',
    filePath: '科目三_術科實作準備/01_生產管理與流程實作.md',
  },
  {
    code: 'M13201',
    name: '智慧製造現場管理實作',
    themeCode: 'M132',
    subjectCode: 'M13',
    icon: '🏗️',
    keywords: '排程規則 FIFO/EDD/SPT/CR, 模具壽命管理, SMED 快速換模, 資料採集異常排查, 柏拉圖分析, 綜合情境解題',
    filePath: '科目三_術科實作準備/02_智慧製造現場管理實作.md',
  },

  // ── 中級考科一：智慧製造生產與作業管理之實務應用 ──
  {
    code: 'M21101',
    name: '生產管理實務與精實管理',
    themeCode: 'M211',
    subjectCode: 'M21',
    icon: '📋',
    keywords: 'S&OP/MPS/CRP 閉迴路, ATP 可承諾量計算, 生產績效落差分析, VSM 增值比率, 精實工具矩陣, 拉動 vs 推動生產',
    filePath: '中級_智慧製造工程師/05_生產管理實務與精實管理.md',
  },
  {
    code: 'M21102',
    name: '智慧工廠技術綜觀、現場管理與 MES 實務',
    themeCode: 'M211',
    subjectCode: 'M21',
    icon: '🏭',
    keywords: '工業 4.0 九大技術支柱, 智慧工廠 L1–L5 成熟度, Andon 閉迴路四層目視化, E-SOP 版控防錯, FCS vs ICS 排程, R2R 批次補償 EWMA',
    filePath: '中級_智慧製造工程師/06_智慧工廠技術現場管理與MES實務.md',
  },
  {
    code: 'M21201',
    name: 'MES 全廠管控與生產排程優化',
    themeCode: 'M212',
    subjectCode: 'M21',
    icon: '📊',
    keywords: '全廠資訊流物流帳實不符防止, MES 設備整合三層次, 大數據管線時序分析, TOC 約束理論 DBR 排程, FIFO/EDD/SPT/CR 計算',
    filePath: '中級_智慧製造工程師/07_MES全廠管控與生產排程優化.md',
  },
  {
    code: 'M21202',
    name: '線平衡、品質要因分析與即時資訊',
    themeCode: 'M212',
    subjectCode: 'M21',
    icon: '⚖️',
    keywords: '線平衡率 LBR 計算與改善, Takt Time vs CT, t-test/ANOVA/DOE, Cpk 偏移判分, OEE 六大損失完整計算, KPI 儀表板設計',
    filePath: '中級_智慧製造工程師/08_線平衡品質要因與即時資訊.md',
  },

  // ── 中級考科二：智慧製造之設備與製程管理之實務應用 ──
  {
    code: 'M22101',
    name: '物聯網與 CPS 基本原理',
    themeCode: 'M221',
    subjectCode: 'M22',
    icon: '🌐',
    keywords: 'IIoT 三層架構, IIoT vs 消費 IoT 五大差異, 邊緣運算四功能, 工業無線協定比較, CPS 5C 架構, 數位雙生三類型',
    filePath: '中級_智慧製造工程師/09_物聯網與CPS基本原理.md',
  },
  {
    code: 'M22102',
    name: '智慧設備管理維護與製程大數據',
    themeCode: 'M221',
    subjectCode: 'M22',
    icon: '🔧',
    keywords: 'BM/PM/CBM/PdM 策略矩陣, MTBF/MTTR 計算例題, CMMS-MES 整合閉迴路, 設備健康指數 EHI, 大數據四大應用場景, 數據品質四大問題',
    filePath: '中級_智慧製造工程師/10_智慧設備管理維護與製程大數據.md',
  },
  {
    code: 'M22201',
    name: '感測器、機器視覺與機器人整合',
    themeCode: 'M222',
    subjectCode: 'M22',
    icon: '📷',
    keywords: '感測器選型 4~20mA 優勢, 機器視覺打光方式對照, AI 視覺 vs 傳統規則式, 漏檢 False Negative 風險, 機器人握手訊號設計, Cobot ISO 10218',
    filePath: '中級_智慧製造工程師/11_感測器機器視覺與機器人整合.md',
  },
  {
    code: 'M22202',
    name: '通訊建構、智慧控制與介面管理',
    themeCode: 'M222',
    subjectCode: 'M22',
    icon: '🖥️',
    keywords: 'Purdue 模型 OT/IT 隔離, EtherCAT/PROFINET/OPC UA, PID 三參數作用, MPC/Fuzzy/RL/R2R 進階控制, HMI ISA-101 五原則, 警報管理最佳實踐',
    filePath: '中級_智慧製造工程師/12_通訊建構智慧控制與介面管理.md',
  },
  {
    code: 'M22301',
    name: '智慧設備操作與效率指標辨識',
    themeCode: 'M223',
    subjectCode: 'M22',
    icon: '📈',
    keywords: '標準化操作六階段, 配方版本管理防錯, 設備安全 Permit to Work, OEE 三元素診斷決策流程, 智慧 vs 傳統設備效率比較, 六大損失映射',
    filePath: '中級_智慧製造工程師/13_智慧設備操作與效率指標辨識.md',
  },

  // ── 精選附錄與解題指南 ──
  {
    code: 'APPX01',
    name: '核心公式與計算題彙整',
    themeCode: 'APPX1',
    subjectCode: 'APPX',
    icon: '🧮',
    keywords: '標準工時 (ST)、EOQ/EPQ、再訂購點 (ROP)、線平衡率 (LE)、OEE、MTBF/MTTR、Cp/Cpk 計算彙整',
    filePath: '歷屆試題與解題技巧/核心公式與計算題彙整.md',
  },
  {
    code: 'APPX02',
    name: '考古題盲點與常見陷阱',
    themeCode: 'APPX1',
    subjectCode: 'APPX',
    icon: '⚠️',
    keywords: '易混淆觀念辨析、官方公告考題盲點、干擾選項逆向拆解',
    filePath: '歷屆試題與解題技巧/考古題盲點與常見陷阱.md',
  },
  {
    code: 'APPX03',
    name: '官方學習資源與參考書目導引',
    themeCode: 'APPX1',
    subjectCode: 'APPX',
    icon: '📚',
    keywords: '115 年第一次試題官方連結, 六大指定參考書目章節導引, 職能基準考點對照',
    filePath: '歷屆試題與解題技巧/官方學習資源與參考書目導引.md',
  },
  {
    code: 'APPX04',
    name: '官方考綱對照與複習補充',
    themeCode: 'APPX1',
    subjectCode: 'APPX',
    icon: '🧭',
    keywords: '115 年簡章規範、75 分鐘單選 CBT、跨章節觀念整合、原創練習題使用界線',
    filePath: '歷屆試題與解題技巧/官方考綱對照與複習補充.md',
  },
  {
    code: 'APPX05',
    name: '115 年試題導向實戰練習',
    themeCode: 'APPX1',
    subjectCode: 'APPX',
    icon: '📝',
    keywords: 'L11/L12/L13/L21/L22 原創情境練習、計算推導、選項判讀、術科操作檢核',
    filePath: '歷屆試題與解題技巧/115第一次試題導向實戰練習.md',
  },
] as const;

export function getTopicByCode(code: string): Topic | undefined {
  return TOPICS.find(t => t.code === code);
}

export function getTopicsBySubject(subjectCode: string): readonly Topic[] {
  return TOPICS.filter(t => t.subjectCode === subjectCode);
}

export function getTopicsByTheme(themeCode: string): readonly Topic[] {
  return TOPICS.filter(t => t.themeCode === themeCode);
}
