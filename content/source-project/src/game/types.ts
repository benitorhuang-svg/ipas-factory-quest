/**
 * types.ts — Core Data Types for iPAS 智慧生產工程師 Game Engine
 * Decoupled Architecture: Types shared between Simulation Core and UI View
 */

export type TimeUnit = 'second' | 'minute' | 'hour' | 'shift' | 'day' | 'week';

export type StationState = 'idle' | 'running' | 'blocked' | 'down';

export interface StationModel {
  id: string;
  name: string;
  serviceRate: number;              // 時間/件 (以 timeUnit 為準)
  state: StationState;
  bufferCapacity: number;
  currentWip: number;
  processedCount: number;
  failureProbability?: number;
  installedFixtures?: number;
}

export interface InventoryItemModel {
  onHand: number;
  inTransit: number;
  quarantined: number;
  safetyStock: number;
}

export interface OrderModel {
  id: string;
  quantity: number;
  dueDate: number;
  priority: number;
  completedQuantity: number;
  status: 'pending' | 'in-progress' | 'completed' | 'late';
  assignedMode?: 'MTS' | 'ATO' | 'MTO' | 'ETO';
}

export interface GameResources {
  budget: number;
  actionPoints: number;
  workforce: number;
}

export interface GameSimulationState {
  time: number;
  resources: GameResources;
  stations: Map<string, StationModel>;
  inventory: Map<string, InventoryItemModel>;
  orders: OrderModel[];
  metrics: {
    throughput: number;
    totalWip: number;
    avgLeadTime: number;
    oee: number;
    availability: number;
    performance: number;
    quality: number;
    onTimeDeliveryRatio: number;
    budgetSpent: number;
  };
  eventLog: Array<{
    time: number;
    type: string;
    message: string;
    data?: unknown;
  }>;
}

export interface EvaluationResult {
  completed: boolean;
  star1Achieved: boolean;
  star2Achieved: boolean;
  violations: string[];
  objectivesStatus: Array<{
    id: string;
    description: string;
    current: number;
    target: number;
    passed: boolean;
    mandatory: boolean;
  }>;
}

export interface ObjectiveSpec {
  id: string;
  metric: string;
  operator: '<=' | '>=' | '==' | '!=' | '<' | '>';
  target: number;
  unit?: string;
  mandatory: boolean;
  description: string;
}

export interface ConstraintSpec {
  id: string;
  metric: string;
  operator: '<=' | '>=' | '==' | '!=' | '<' | '>';
  limit: number;
  unit?: string;
  violationMessage: string;
}

export interface KnowledgeCheckSpec {
  id: string;
  question: string;
  type: 'single-choice' | 'multi-choice' | 'sort' | 'evidence-match';
  options: string[];
  answer: number | number[] | string[];
  misconceptionId?: string;
  explanation: string;
}

export interface ScriptedEventSpec {
  triggerTime: number;
  eventType: string;
  payload: Record<string, unknown>;
  visibleToPlayer: boolean;
  announcement?: string;
}

export interface ActionSpec {
  round: number;
  time: number;
  cardId: string;
  targetId?: string;
  parameters?: Record<string, unknown>;
}

export interface ReferenceSolutionSpec {
  name: string;
  targetStars: 1 | 2 | 3;
  actions: ActionSpec[];
  expectedKpis: Record<string, number>;
}

export interface LevelSpec {
  id: string;
  version: string;
  chapterId: string;
  topicCodes: string[];
  conceptIds: string[];
  prerequisites: string[];
  mode: 'tutorial' | 'guide' | 'challenge';
  scenario: {
    title: string;
    brief: string;
    background: string;
  };
  assumptions: {
    timeUnit: TimeUnit;
    currency: string;
    modelType: 'discrete-line' | 'mrp-grid' | 'spc-chart' | 'network-flow' | 'state-machine';
    parameters: Record<string, unknown>;
  };
  initialState: {
    resources: GameResources;
    stations?: Array<{
      id: string;
      name: string;
      serviceRate: number;
      state: StationState;
      bufferCapacity: number;
      installedFixtures?: number;
    }>;
    inventory?: Record<string, InventoryItemModel>;
    orders?: Array<{
      id: string;
      quantity: number;
      dueDate: number;
      priority: number;
    }>;
  };
  seed: number;
  horizon: number;
  cardPool: string[];
  startingHand: string[];
  rules: {
    maxActionsPerRound?: number;
    allowUndo?: boolean;
    costOverrides?: Record<string, number>;
  };
  scriptedEvents: ScriptedEventSpec[];
  objectives: ObjectiveSpec[];
  constraints: ConstraintSpec[];
  knowledgeChecks: KnowledgeCheckSpec[];
  feedback: {
    successSummary: string;
    failureHints: Record<string, string>;
  };
  star2Objectives?: ObjectiveSpec[];
  transferVariants?: Array<{
    variantId: string;
    description: string;
    modifiedState: Partial<LevelSpec['initialState']>;
    modifiedAssumptions?: Partial<LevelSpec['assumptions']>;
  }>;
  referenceSolutions: ReferenceSolutionSpec[];
}

export interface CardPrerequisiteSpec {
  type: 'resource' | 'station-state' | 'material' | 'document-approval' | 'time';
  targetKey: string;
  expectedValue: unknown;
  failureMessage: string;
}

export interface CardEffectSpec {
  target: 'station' | 'inventory' | 'order' | 'schedule' | 'network' | 'algorithm';
  action: 'modify-parameter' | 'change-state' | 'transfer-work' | 'split-batch' | 'verify-data';
  params: Record<string, unknown>;
}

export interface CardSpec {
  id: string;
  version: string;
  family: 'F01' | 'F02' | 'F03' | 'F04' | 'F05' | 'F06' | 'F07' | 'F08' |
          'F09' | 'F10' | 'F11' | 'F12' | 'F13' | 'F14' | 'F15' | 'F16';
  name: string;
  description: string;
  topicCodes: string[];
  conceptIds: string[];
  targetType: 'station' | 'buffer' | 'item' | 'order' | 'register' | 'node' | 'global';
  parameters?: Array<{
    name: string;
    type: 'number' | 'string' | 'boolean' | 'enum';
    options?: string[];
    min?: number;
    max?: number;
    default?: unknown;
  }>;
  prerequisites: CardPrerequisiteSpec[];
  cost: {
    budget: number;
    actionPoints: number;
    leadTime?: number;
  };
  effectiveAt: 'immediate' | 'next-round' | 'on-arrival' | 'delayed';
  duration?: number;
  effects: CardEffectSpec[];
  stacking: boolean;
  maxUsesPerGame?: number;
  evidence: string[];
  feedback: {
    onApplied: string;
    onRejected: string;
  };
  sourceRefs: string[];
}

export interface LevelProgressRecord {
  levelId: string;
  stars: number;                     // 0: 未通關, 1: 一星理解, 2: 二星改善, 3: 三星遷移
  highestScore: number;
  completedAt?: number;
  passedMisconceptions: string[];
  actionsHistory?: ActionSpec[];
}
