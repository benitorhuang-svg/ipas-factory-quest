/**
 * index.ts — Level Registry for Game Engine
 * Loads level specifications and provides level query APIs.
 */

import type { LevelSpec } from '../types';

export const LEVEL_REGISTRY: LevelSpec[] = [
  {
    id: 'T01',
    version: '1.0.0',
    chapterId: 'T',
    topicCodes: ['M11101', 'M11201'],
    conceptIds: ['CP-T01-CARD-SELECTION', 'CP-T01-BOTTLENECK-BASICS'],
    prerequisites: [],
    mode: 'tutorial',
    scenario: {
      title: '第一張改善卡',
      brief: '辨認目標、資源與作用對象，學習選卡、設定目標並確認提交。',
      background: '工廠生產線上的工站 A 單件加工時間為 30 秒，玩家手上有改善預算 2 點。請利用工程措施縮短加工時間。',
    },
    assumptions: {
      timeUnit: 'second',
      currency: '點',
      modelType: 'discrete-line',
      parameters: {
        steadyState: true,
        allowInfiniteRetries: true,
      },
    },
    initialState: {
      resources: { budget: 2, actionPoints: 1, workforce: 1 },
      stations: [
        {
          id: 'station-a',
          name: '工站 A',
          serviceRate: 30,
          state: 'idle',
          bufferCapacity: 10,
        },
      ],
    },
    seed: 42,
    horizon: 300,
    cardPool: ['fixture-station-a', 'replenish-mat-test', 'sensor-diag-test'],
    startingHand: ['fixture-station-a', 'replenish-mat-test', 'sensor-diag-test'],
    rules: { maxActionsPerRound: 1, allowUndo: true },
    scriptedEvents: [],
    objectives: [
      {
        id: 'obj-station-a-rate',
        metric: 'station.station-a.serviceRate',
        operator: '==',
        target: 20,
        unit: 's',
        mandatory: true,
        description: '工站 A 單件加工時間降低至 20 秒',
      },
      {
        id: 'obj-budget-spent',
        metric: 'resources.budget',
        operator: '==',
        target: 0,
        unit: '點',
        mandatory: true,
        description: '預算剛好消耗完畢，無超支',
      },
    ],
    constraints: [
      {
        id: 'const-budget-non-negative',
        metric: 'resources.budget',
        operator: '>=',
        limit: 0,
        unit: '點',
        violationMessage: '改善預算不足，無法執行此項操作',
      },
    ],
    knowledgeChecks: [
      {
        id: 'check-t01-01',
        question: '打出「治具改善卡」之後，現場發生了什麼改變？',
        type: 'single-choice',
        options: [
          '直接增加了客戶的訂單數量',
          '縮短了工站 A 的單件加工時間',
          '改變了工廠的期初庫存量',
          '提升了工站感測器的連線頻率',
        ],
        answer: 1,
        explanation: '治具改善屬於產線改善卡（F05），其物理效果是縮短指定工站的標準服務時間，並非直接增加需求或庫存。',
      },
    ],
    feedback: {
      successSummary: '太棒了！你成功為工站 A 安裝治具，使其加工時間從 30 秒縮短至 20 秒，並理解了工程措施改變物理機制的因果關係。',
      failureHints: {
        'obj-station-a-rate': '請確認手牌中哪一張卡牌的作用對象是工站 A 且具備縮短工時的效果。',
        'const-budget-non-negative': '預算點數不足，請撤銷不必要的操作後再重試。',
      },
    },
    referenceSolutions: [
      {
        name: '標準治具安裝解法',
        targetStars: 1,
        actions: [{ round: 1, time: 0, cardId: 'fixture-station-a', targetId: 'station-a' }],
        expectedKpis: { 'station-a-serviceRate': 20, remainingBudget: 0 },
      },
    ],
  },
  {
    id: 'C01-L01',
    version: '1.0.0',
    chapterId: 'C01',
    topicCodes: ['M11101'],
    conceptIds: ['CP-M11101-CODP', 'CP-M11101-MTS-ATO-MTO-ETO'],
    prerequisites: ['T04'],
    mode: 'guide',
    scenario: {
      title: '訂單從哪裡進工廠',
      brief: '依據四種不同的客戶訂單特性，正確設定客戶訂單解耦點 (CODP)，區分推式與拉式生產邊界。',
      background: '營運指揮室收到四筆訂單：標準品 100 件翌日交、選配品 20 件三日交、特殊加工品 5 件十日交、全新客製設備 1 件二十日交。現有途程完工時間分別為 MTS 1 日、ATO 3 日、MTO 10 日、ETO 20 日。',
    },
    assumptions: {
      timeUnit: 'day',
      currency: '元',
      modelType: 'discrete-line',
      parameters: { inventorySufficient: true, strictDeliveryDeadline: true },
    },
    initialState: {
      resources: { budget: 100, actionPoints: 4, workforce: 10 },
      orders: [
        { id: 'ORD-01', quantity: 100, dueDate: 1, priority: 1 },
        { id: 'ORD-02', quantity: 20, dueDate: 3, priority: 2 },
        { id: 'ORD-03', quantity: 5, dueDate: 10, priority: 3 },
        { id: 'ORD-04', quantity: 1, dueDate: 20, priority: 4 },
      ],
    },
    seed: 101,
    horizon: 20,
    cardPool: ['set-codp-mts', 'set-codp-ato', 'set-codp-mto', 'set-codp-eto'],
    startingHand: ['set-codp-mts', 'set-codp-ato', 'set-codp-mto', 'set-codp-eto'],
    rules: { maxActionsPerRound: 4, allowUndo: true },
    scriptedEvents: [],
    objectives: [
      {
        id: 'obj-codp-assignment',
        metric: 'codp.matchedOrdersRatio',
        operator: '==',
        target: 1.0,
        unit: 'ratio',
        mandatory: true,
        description: '四張訂單均正確匹配對應的生產型態 (MTS/ATO/MTO/ETO)',
      },
      {
        id: 'obj-on-time-delivery',
        metric: 'delivery.onTimeRatio',
        operator: '==',
        target: 1.0,
        unit: 'ratio',
        mandatory: true,
        description: '四張訂單全部於承諾交期內如期交付',
      },
    ],
    constraints: [
      {
        id: 'const-no-incompatible-module',
        metric: 'orders.incompatibleSubstitutions',
        operator: '==',
        limit: 0,
        violationMessage: '客製產品不得強行以既有不相容模組替代',
      },
    ],
    knowledgeChecks: [
      {
        id: 'check-c01-01',
        question: '客戶訂單解耦點 (Customer Order Decoupling Point, CODP) 的核心物理意涵為何？',
        type: 'single-choice',
        options: [
          '區分廠內哪些工序是由預測驅動（推式），哪些是由確定訂單驅動（拉式）的緩衝位置',
          '代表機台故障時操作員手動接管的維護點',
          '代表所有成品進入貨櫃裝箱的出口位置',
          '代表每期 MRP 展開後安全庫存的最低警戒線',
        ],
        answer: 0,
        explanation: 'CODP 是推式（依預測備貨）與拉式（依實際訂單生產）的關鍵分界點。在解耦點上游依預測維持庫存，在解耦點下游則由確定訂單觸發各項作業。',
      },
    ],
    feedback: {
      successSummary: '恭喜通關！你準確辨識了四種生產型態的交期與庫存策略：標準品配置 MTS（現貨庫存）、選配品配置 ATO（模組庫存）、特殊加工品配置 MTO（原料庫存）以及客製設備配置 ETO（從設計開始）。',
      failureHints: {
        'obj-codp-assignment': '請比對各訂單的交期要求與生產路徑提前期，例如 1 日交期必須依賴成品現貨 (MTS)。',
        'obj-on-time-delivery': '若將 20 日的客製設備誤設為 MTO，將因缺少前期工程設計時間而發生嚴重逾期。',
      },
    },
    referenceSolutions: [
      {
        name: '標準四階 CODP 配對解法',
        targetStars: 1,
        actions: [
          { round: 1, time: 0, cardId: 'set-codp-mts', targetId: 'ORD-01' },
          { round: 1, time: 0, cardId: 'set-codp-ato', targetId: 'ORD-02' },
          { round: 1, time: 0, cardId: 'set-codp-mto', targetId: 'ORD-03' },
          { round: 1, time: 0, cardId: 'set-codp-eto', targetId: 'ORD-04' },
        ],
        expectedKpis: { matchedOrdersRatio: 1.0, onTimeRatio: 1.0 },
      },
    ],
  },
];

export function getAllLevels(): LevelSpec[] {
  return LEVEL_REGISTRY;
}

export function getLevelById(id: string): LevelSpec | undefined {
  return LEVEL_REGISTRY.find((l) => l.id === id);
}

export function getLevelsByChapter(chapterId: string): LevelSpec[] {
  return LEVEL_REGISTRY.filter((l) => l.chapterId === chapterId);
}
