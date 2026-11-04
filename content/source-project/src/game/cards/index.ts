/**
 * index.ts — Card Registry for Game Engine
 * Manages card metadata, effect mapping, and card lookups.
 */

import type { CardSpec } from '../types';

export const CARD_REGISTRY: CardSpec[] = [
  {
    id: 'fixture-station-a',
    version: '1.0.0',
    family: 'F05',
    name: '工站 A 治具改善卡',
    description: '為工站 A 安裝快速夾持治具，單件加工時間由 30 秒縮短至 20 秒。',
    topicCodes: ['M11201'],
    conceptIds: ['CP-T01-CARD-SELECTION'],
    targetType: 'station',
    prerequisites: [
      {
        type: 'resource',
        targetKey: 'budget',
        expectedValue: 2,
        failureMessage: '預算不足 2 點',
      },
    ],
    cost: { budget: 2, actionPoints: 1 },
    effectiveAt: 'immediate',
    duration: 0,
    effects: [
      {
        target: 'station',
        action: 'modify-parameter',
        params: { stationId: 'station-a', parameter: 'serviceRate', newValue: 20 },
      },
    ],
    stacking: false,
    evidence: ['EVI-STATION-A-FIXTURE'],
    feedback: {
      onApplied: '工站 A 成功安裝治具，單件加工時間降至 20 秒。',
      onRejected: '無法施加於工站 A 或預算不足。',
    },
    sourceRefs: ['科目一_生產與作業管理基礎/04_工業工程概論與標準工時.md'],
  },
  {
    id: 'replenish-mat-test',
    version: '1.0.0',
    family: 'F03',
    name: '物料補貨卡',
    description: '緊急調配在途物料，補充線邊原料庫存 20 件。',
    topicCodes: ['M11103'],
    conceptIds: ['CP-T01-REPLENISH'],
    targetType: 'item',
    prerequisites: [],
    cost: { budget: 1, actionPoints: 1 },
    effectiveAt: 'immediate',
    effects: [
      {
        target: 'inventory',
        action: 'modify-parameter',
        params: { itemKey: 'raw_materials', delta: 20 },
      },
    ],
    stacking: true,
    evidence: ['EVI-MATERIAL-REPLENISHED'],
    feedback: {
      onApplied: '線邊物料已補充 20 件。',
      onRejected: '補料失敗。',
    },
    sourceRefs: ['科目一_生產與作業管理基礎/03_物料管理概論.md'],
  },
  {
    id: 'sensor-diag-test',
    version: '1.0.0',
    family: 'F11',
    name: '感測連線診斷卡',
    description: '重置現場感測節點，檢查數據新鮮度與品質旗標。',
    topicCodes: ['M12102'],
    conceptIds: ['CP-T02-SENSOR-DIAG'],
    targetType: 'node',
    prerequisites: [],
    cost: { budget: 0, actionPoints: 1 },
    effectiveAt: 'immediate',
    effects: [
      {
        target: 'network',
        action: 'verify-data',
        params: { verifyAll: true },
      },
    ],
    stacking: false,
    evidence: ['EVI-SENSOR-HEALTHY'],
    feedback: {
      onApplied: '感測節點通訊診斷通過，取得即時品質旗標。',
      onRejected: '診斷未執行。',
    },
    sourceRefs: ['科目二_智慧製造生產線管理基礎/02_工業物聯網IIoT與通訊協定.md'],
  },
  {
    id: 'set-codp-mts',
    version: '1.0.0',
    family: 'F01',
    name: '指派存貨生產 (MTS)',
    description: '將訂單解耦點設於成品端，依預測備妥成品現貨，翌日即可立即出貨。',
    topicCodes: ['M11101'],
    conceptIds: ['CP-M11101-CODP'],
    targetType: 'order',
    prerequisites: [],
    cost: { budget: 0, actionPoints: 1 },
    effectiveAt: 'immediate',
    effects: [
      {
        target: 'order',
        action: 'change-state',
        params: { mode: 'MTS' },
      },
    ],
    stacking: false,
    evidence: ['EVI-CODP-MTS-ASSIGNED'],
    feedback: {
      onApplied: '訂單已設定為存貨生產 (Make to Stock, MTS)。',
      onRejected: '指派失敗。',
    },
    sourceRefs: ['科目一_生產與作業管理基礎/01_生產管理基本概念.md'],
  },
  {
    id: 'set-codp-ato',
    version: '1.0.0',
    family: 'F01',
    name: '指派訂單組裝 (ATO)',
    description: '將訂單解耦點設於半成品/模組端，收到客戶訂單後進行客製選配組裝，3 日交貨。',
    topicCodes: ['M11101'],
    conceptIds: ['CP-M11101-CODP'],
    targetType: 'order',
    prerequisites: [],
    cost: { budget: 0, actionPoints: 1 },
    effectiveAt: 'immediate',
    effects: [
      {
        target: 'order',
        action: 'change-state',
        params: { mode: 'ATO' },
      },
    ],
    stacking: false,
    evidence: ['EVI-CODP-ATO-ASSIGNED'],
    feedback: {
      onApplied: '訂單已設定為訂單組裝 (Assemble to Order, ATO)。',
      onRejected: '指派失敗。',
    },
    sourceRefs: ['科目一_生產與作業管理基礎/01_生產管理基本概念.md'],
  },
  {
    id: 'set-codp-mto',
    version: '1.0.0',
    family: 'F01',
    name: '指派訂單生產 (MTO)',
    description: '將訂單解耦點設於原材料端，收到確定訂單後才排程加工製造，10 日交貨。',
    topicCodes: ['M11101'],
    conceptIds: ['CP-M11101-CODP'],
    targetType: 'order',
    prerequisites: [],
    cost: { budget: 0, actionPoints: 1 },
    effectiveAt: 'immediate',
    effects: [
      {
        target: 'order',
        action: 'change-state',
        params: { mode: 'MTO' },
      },
    ],
    stacking: false,
    evidence: ['EVI-CODP-MTO-ASSIGNED'],
    feedback: {
      onApplied: '訂單已設定為訂單生產 (Make to Order, MTO)。',
      onRejected: '指派失敗。',
    },
    sourceRefs: ['科目一_生產與作業管理基礎/01_生產管理基本概念.md'],
  },
  {
    id: 'set-codp-eto',
    version: '1.0.0',
    family: 'F01',
    name: '指派訂單設計 (ETO)',
    description: '將訂單解耦點設於工程研發端，收到客製規格後從設計開始，20 日交貨。',
    topicCodes: ['M11101'],
    conceptIds: ['CP-M11101-CODP'],
    targetType: 'order',
    prerequisites: [],
    cost: { budget: 0, actionPoints: 1 },
    effectiveAt: 'immediate',
    effects: [
      {
        target: 'order',
        action: 'change-state',
        params: { mode: 'ETO' },
      },
    ],
    stacking: false,
    evidence: ['EVI-CODP-ETO-ASSIGNED'],
    feedback: {
      onApplied: '訂單已設定為訂單設計 (Engineer to Order, ETO)。',
      onRejected: '指派失敗。',
    },
    sourceRefs: ['科目一_生產與作業管理基礎/01_生產管理基本概念.md'],
  },
];

export function getCardById(cardId: string): CardSpec | undefined {
  return CARD_REGISTRY.find((c) => c.id === cardId);
}

export function getCardsByFamily(family: string): CardSpec[] {
  return CARD_REGISTRY.filter((c) => c.family === family);
}
