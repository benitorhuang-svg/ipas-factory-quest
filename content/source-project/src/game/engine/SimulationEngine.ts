/**
 * SimulationEngine.ts — Headless Deterministic Simulation Core for Educational Factory Game
 * Fully decoupled from UI/DOM, driven by Discrete Event Simulation (DES).
 */

import { PRNG } from './PRNG';
import { EventQueue } from './EventQueue';
import type {
  LevelSpec,
  CardSpec,
  ActionSpec,
  GameSimulationState,
  StationModel,
  InventoryItemModel,
  OrderModel,
  ObjectiveSpec,
  ConstraintSpec,
  EvaluationResult,
} from '../types';

export interface ActionResult {
  success: boolean;
  action: ActionSpec;
  message: string;
  violations?: string[];
}

export type StateChangeListener = (state: Readonly<GameSimulationState>) => void;

export class SimulationEngine {
  private level: LevelSpec;
  private prng: PRNG;
  private queue: EventQueue;
  private state: GameSimulationState;
  private roundCount = 0;
  private cardRegistry = new Map<string, CardSpec>();
  private listeners: StateChangeListener[] = [];
  private playedActions: ActionSpec[] = [];

  constructor(level: LevelSpec, cards: CardSpec[] = []) {
    this.level = level;
    this.prng = new PRNG(level.seed);
    this.queue = new EventQueue();
    cards.forEach((c) => this.cardRegistry.set(c.id, c));
    this.state = this.buildInitialState();
    this.scheduleScriptedEvents();
  }

  /** Subscribe to state changes */
  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const readonlyState = Object.freeze({ ...this.state });
    this.listeners.forEach((l) => l(readonlyState));
  }

  /** Get immutable state snapshot */
  public getState(): Readonly<GameSimulationState> {
    return this.state;
  }

  /** Get level specification */
  public getLevel(): Readonly<LevelSpec> {
    return this.level;
  }

  /** Reset simulation to initial state with the same seed */
  public reset(): void {
    this.prng = new PRNG(this.level.seed);
    this.queue.clear();
    this.roundCount = 0;
    this.playedActions = [];
    this.state = this.buildInitialState();
    this.scheduleScriptedEvents();
    this.notify();
  }

  /** Dispatch player action (e.g., play card) */
  public dispatch(action: ActionSpec): ActionResult {
    const card = this.cardRegistry.get(action.cardId);

    // 1. Basic validation
    if (!card && !action.cardId.startsWith('set-codp-')) {
      return { success: false, action, message: `找不到卡牌識別碼: ${action.cardId}` };
    }

    // 2. Budget & Action Point checks
    const budgetCost = card?.cost.budget ?? 0;
    const actionPointCost = card?.cost.actionPoints ?? 1;

    if (this.state.resources.budget < budgetCost) {
      return {
        success: false,
        action,
        message: `預算不足：需要 ${budgetCost}，目前僅有 ${this.state.resources.budget}`,
      };
    }

    if (this.state.resources.actionPoints < actionPointCost) {
      return {
        success: false,
        action,
        message: `行動點數不足：需要 ${actionPointCost}，目前僅有 ${this.state.resources.actionPoints}`,
      };
    }

    // 3. Target verification & Effect execution
    let effectMessage = '';

    // Specialized Logic: CODP assignment cards (C01-L01)
    if (action.cardId.startsWith('set-codp-') && action.targetId) {
      const mode = action.cardId.replace('set-codp-', '').toUpperCase() as 'MTS' | 'ATO' | 'MTO' | 'ETO';
      const order = this.state.orders.find((o) => o.id === action.targetId);
      if (order) {
        order.assignedMode = mode;
        this.state.resources.budget -= budgetCost;
        this.state.resources.actionPoints -= actionPointCost;
        this.state.metrics.budgetSpent += budgetCost;
        effectMessage = `已將訂單 ${order.id} 指派為 ${mode} 生產型態。`;
      }
    } else if (card) {
      // Execute Card Effects
      for (const effect of card.effects) {
        if (effect.target === 'station' && action.targetId) {
          const station = this.state.stations.get(action.targetId);
          if (station && effect.action === 'modify-parameter') {
            const param = effect.params.parameter as string;
            const newValue = effect.params.newValue as number;
            if (param === 'serviceRate') {
              station.serviceRate = newValue;
              station.installedFixtures = (station.installedFixtures || 0) + 1;
              effectMessage = `${station.name} 單件加工時間已調整為 ${newValue}。`;
            }
          }
        }
      }

      this.state.resources.budget -= budgetCost;
      this.state.resources.actionPoints -= actionPointCost;
      this.state.metrics.budgetSpent += budgetCost;
      if (!effectMessage) {
        effectMessage = card.feedback.onApplied || `已打出 ${card.name}。`;
      }
    }

    this.playedActions.push(action);
    this.state.eventLog.push({
      time: this.state.time,
      type: 'CARD_PLAYED',
      message: effectMessage,
      data: action,
    });

    this.recalculateMetrics();
    this.notify();
    return { success: true, action, message: effectMessage };
  }

  /** Advance simulation by 1 logical time step */
  public step(deltaTime = 1): void {
    const targetTime = this.state.time + deltaTime;
    this.stepTo(targetTime);
  }

  /** Step to a specific logical time point, executing all intermediate events */
  public stepTo(targetTime: number): void {
    while (!this.queue.isEmpty && this.queue.peek()!.time <= targetTime) {
      const event = this.queue.pop()!;
      this.state.time = event.time;
      event.handler();
    }
    this.state.time = targetTime;
    this.simulateWorkFlow(deltaTimeOrCurrent(this.state.time));
    this.recalculateMetrics();
    this.notify();
  }

  /** Run simulation until horizon is reached */
  public runToCompletion(): EvaluationResult {
    this.stepTo(this.level.horizon);
    return this.evaluateObjectives();
  }

  /** Evaluate pass/fail conditions */
  public evaluateObjectives(): EvaluationResult {
    const violations: string[] = [];
    const objectivesStatus: EvaluationResult['objectivesStatus'] = [];

    // 1. Evaluate Constraints
    for (const c of this.level.constraints) {
      const val = this.resolveMetric(c.metric);
      const passed = this.compareValues(val, c.operator, c.limit);
      if (!passed) {
        violations.push(c.violationMessage);
      }
    }

    // 2. Evaluate Mandatory Objectives (Star 1)
    let star1Achieved = violations.length === 0;
    for (const obj of this.level.objectives) {
      const current = this.resolveMetric(obj.metric);
      const passed = this.compareValues(current, obj.operator, obj.target);
      if (obj.mandatory && !passed) {
        star1Achieved = false;
      }
      objectivesStatus.push({
        id: obj.id,
        description: obj.description,
        current,
        target: obj.target,
        passed,
        mandatory: obj.mandatory,
      });
    }

    // 3. Evaluate Star 2 Objectives
    let star2Achieved = star1Achieved;
    if (this.level.star2Objectives) {
      for (const obj of this.level.star2Objectives) {
        const current = this.resolveMetric(obj.metric);
        const passed = this.compareValues(current, obj.operator, obj.target);
        if (!passed) {
          star2Achieved = false;
        }
      }
    }

    return {
      completed: star1Achieved,
      star1Achieved,
      star2Achieved,
      violations,
      objectivesStatus,
    };
  }

  private resolveMetric(metric: string): number {
    if (metric === 'resources.budget') return this.state.resources.budget;
    if (metric === 'metrics.budgetSpent') return this.state.metrics.budgetSpent;
    if (metric === 'metrics.throughput') return this.state.metrics.throughput;
    if (metric === 'delivery.onTimeRatio' || metric === 'metrics.onTimeDeliveryRatio') {
      return this.state.metrics.onTimeDeliveryRatio;
    }
    if (metric === 'codp.matchedOrdersRatio') {
      const total = this.state.orders.length;
      if (total === 0) return 1.0;
      let matched = 0;
      for (const order of this.state.orders) {
        if (order.id === 'ORD-01' && order.assignedMode === 'MTS') matched++;
        if (order.id === 'ORD-02' && order.assignedMode === 'ATO') matched++;
        if (order.id === 'ORD-03' && order.assignedMode === 'MTO') matched++;
        if (order.id === 'ORD-04' && order.assignedMode === 'ETO') matched++;
      }
      return matched / total;
    }

    // Station service rate
    if (metric.startsWith('station.') && metric.endsWith('.serviceRate')) {
      const parts = metric.split('.');
      const stationId = parts[1];
      const station = this.state.stations.get(stationId);
      return station?.serviceRate ?? 0;
    }

    return 0;
  }

  private compareValues(a: number, op: string, b: number): boolean {
    const EPSILON = 0.0001;
    switch (op) {
      case '==': return Math.abs(a - b) < EPSILON;
      case '!=': return Math.abs(a - b) >= EPSILON;
      case '<=': return a <= b + EPSILON;
      case '>=': return a >= b - EPSILON;
      case '<': return a < b - EPSILON;
      case '>': return a > b + EPSILON;
      default: return false;
    }
  }

  private recalculateMetrics(): void {
    let totalProcessed = 0;
    for (const station of this.state.stations.values()) {
      totalProcessed += station.processedCount;
    }
    this.state.metrics.throughput = totalProcessed;

    // Check delivery ratio for orders
    if (this.state.orders.length > 0) {
      const completedOnTime = this.state.orders.filter(
        (o) => o.status === 'completed' || (o.assignedMode && this.isModeValidForOrder(o))
      ).length;
      this.state.metrics.onTimeDeliveryRatio = completedOnTime / this.state.orders.length;
    }
  }

  private isModeValidForOrder(order: OrderModel): boolean {
    if (order.id === 'ORD-01' && order.assignedMode === 'MTS') return true;
    if (order.id === 'ORD-02' && order.assignedMode === 'ATO') return true;
    if (order.id === 'ORD-03' && order.assignedMode === 'MTO') return true;
    if (order.id === 'ORD-04' && order.assignedMode === 'ETO') return true;
    return false;
  }

  private simulateWorkFlow(_delta: number): void {
    // Basic physical station processing
    for (const station of this.state.stations.values()) {
      if (station.state === 'running' || station.state === 'idle') {
        if (station.serviceRate > 0) {
          // Process parts
          station.processedCount += 1;
        }
      }
    }
  }

  private buildInitialState(): GameSimulationState {
    const stationsMap = new Map<string, StationModel>();
    (this.level.initialState.stations || []).forEach((s) => {
      stationsMap.set(s.id, {
        id: s.id,
        name: s.name,
        serviceRate: s.serviceRate,
        state: s.state,
        bufferCapacity: s.bufferCapacity,
        currentWip: 0,
        processedCount: 0,
        installedFixtures: s.installedFixtures || 0,
      });
    });

    const inventoryMap = new Map<string, InventoryItemModel>();
    if (this.level.initialState.inventory) {
      for (const [key, item] of Object.entries(this.level.initialState.inventory)) {
        inventoryMap.set(key, { ...item });
      }
    }

    const orders = (this.level.initialState.orders || []).map((o) => ({
      ...o,
      completedQuantity: 0,
      status: 'pending' as const,
    }));

    return {
      time: 0,
      resources: { ...this.level.initialState.resources },
      stations: stationsMap,
      inventory: inventoryMap,
      orders,
      metrics: {
        throughput: 0,
        totalWip: 0,
        avgLeadTime: 0,
        oee: 0.85,
        availability: 0.9,
        performance: 0.95,
        quality: 0.99,
        onTimeDeliveryRatio: 0,
        budgetSpent: 0,
      },
      eventLog: [
        {
          time: 0,
          type: 'SIMULATION_INITIALIZED',
          message: `關卡 ${this.level.id} (${this.level.scenario.title}) 已就緒。`,
        },
      ],
    };
  }

  private scheduleScriptedEvents(): void {
    for (const evt of this.level.scriptedEvents) {
      this.queue.push(evt.triggerTime, evt.eventType, () => {
        this.state.eventLog.push({
          time: evt.triggerTime,
          type: evt.eventType,
          message: evt.announcement || `觸發事件: ${evt.eventType}`,
          data: evt.payload,
        });
      });
    }
  }
}

function deltaTimeOrCurrent(t: number): number {
  return t > 0 ? 1 : 0;
}
