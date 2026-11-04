/**
 * GameHUD.ts — Heads-Up Display for Game Simulation
 * Displays budget, action points, objective checklist, and playback controls.
 */

import { div, h } from '@/utils/render';
import type { LevelSpec, GameSimulationState, ObjectiveSpec } from '../types';

export interface HUDCallbacks {
  onStep: () => void;
  onRunToCompletion: () => void;
  onReset: () => void;
  onInspectDebrief: () => void;
}

export class GameHUD {
  private container: HTMLElement;
  private level: LevelSpec;
  private callbacks: HUDCallbacks;

  constructor(level: LevelSpec, callbacks: HUDCallbacks) {
    this.level = level;
    this.callbacks = callbacks;
    this.container = div('game-hud');
    this.container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 14px;
      width: 100%;
    `;
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public render(state: Readonly<GameSimulationState>, isCompleted = false): void {
    this.container.replaceChildren();

    // 1. Mission Brief Card
    const missionCard = div('game-hud__mission');
    missionCard.style.cssText = `
      background: var(--color-bg-elevated, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-xl, 14px);
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    `;

    const missionText = div('');
    missionText.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; color: #818cf8; text-transform: uppercase;">
        關卡任務 #${this.level.id}・${this.level.chapterId}
      </div>
      <div style="font-size: 17px; font-weight: 800; color: var(--color-text-primary); margin-top: 2px;">
        ${this.level.scenario.title}
      </div>
      <div style="font-size: 13px; color: var(--color-text-secondary, #94a3b8); margin-top: 4px;">
        ${this.level.scenario.brief}
      </div>
    `;
    missionCard.appendChild(missionText);

    // Controls
    const controls = div('game-hud__controls');
    controls.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    const stepBtn = h('button', { className: 'btn btn--secondary' }, '單步推演 ⏩');
    stepBtn.style.padding = '6px 12px';
    stepBtn.style.fontSize = '13px';
    stepBtn.addEventListener('click', this.callbacks.onStep);
    controls.appendChild(stepBtn);

    const runBtn = h('button', { className: 'btn btn--primary' }, '執行驗收 🏁');
    runBtn.style.padding = '6px 14px';
    runBtn.style.fontSize = '13px';
    runBtn.addEventListener('click', this.callbacks.onRunToCompletion);
    controls.appendChild(runBtn);

    const resetBtn = h('button', { className: 'btn btn--secondary', title: '重設為初始狀態' }, '🔄 重試');
    resetBtn.style.padding = '6px 10px';
    resetBtn.style.fontSize = '13px';
    resetBtn.addEventListener('click', this.callbacks.onReset);
    controls.appendChild(resetBtn);

    if (isCompleted) {
      const debriefBtn = h('button', { className: 'btn btn--primary', style: 'background: #10b981;' }, '檢視解析 📝');
      debriefBtn.style.padding = '6px 14px';
      debriefBtn.style.fontSize = '13px';
      debriefBtn.addEventListener('click', this.callbacks.onInspectDebrief);
      controls.appendChild(debriefBtn);
    }

    missionCard.appendChild(controls);
    this.container.appendChild(missionCard);

    // 2. Resource & Objectives Status Row
    const statusRow = div('game-hud__status-row');
    statusRow.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
    `;

    // Resource Indicators
    const resBox = div('game-hud__res-box');
    resBox.style.cssText = `
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-lg, 12px);
      padding: 12px 16px;
      display: flex;
      justify-content: space-around;
      align-items: center;
    `;
    resBox.innerHTML = `
      <div style="text-align: center;">
        <span style="font-size: 11px; color: #94a3b8;">剩餘預算</span>
        <div style="font-size: 20px; font-weight: 800; color: #f59e0b;">
          ${state.resources.budget} <small style="font-size: 11px;">${this.level.assumptions.currency}</small>
        </div>
      </div>
      <div style="height: 24px; width: 1px; background: rgba(255,255,255,0.1);"></div>
      <div style="text-align: center;">
        <span style="font-size: 11px; color: #94a3b8;">行動點數</span>
        <div style="font-size: 20px; font-weight: 800; color: #60a5fa;">
          ${state.resources.actionPoints}
        </div>
      </div>
      <div style="height: 24px; width: 1px; background: rgba(255,255,255,0.1);"></div>
      <div style="text-align: center;">
        <span style="font-size: 11px; color: #94a3b8;">已消耗預算</span>
        <div style="font-size: 20px; font-weight: 800; color: #f43f5e;">
          ${state.metrics.budgetSpent}
        </div>
      </div>
    `;
    statusRow.appendChild(resBox);

    // Objectives List
    const objBox = div('game-hud__obj-box');
    objBox.style.cssText = `
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-lg, 12px);
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    `;

    const objTitle = div('', '🎯 驗收目標：');
    objTitle.style.cssText = 'font-size: 11px; font-weight: 700; color: var(--color-text-primary, #cbd5e1);';
    objBox.appendChild(objTitle);

    this.level.objectives.forEach((obj: ObjectiveSpec) => {
      const item = div('obj-item');
      item.style.cssText = `
        font-size: 12px;
        color: var(--color-text-secondary, #94a3b8);
        display: flex;
        align-items: center;
        gap: 6px;
      `;
      item.innerHTML = `
        <span style="color: #6366f1;">•</span>
        <span>${obj.description} (目標: ${obj.operator} ${obj.target} ${obj.unit || ''})</span>
      `;
      objBox.appendChild(item);
    });

    statusRow.appendChild(objBox);
    this.container.appendChild(statusRow);
  }
}
