/**
 * FactoryCanvas.ts — 2D SVG Factory & Information Flow Renderer
 * Visualizes stations, buffers, WIP flow, and order status reactively.
 */

import { div, h } from '@/utils/render';
import type { GameSimulationState } from '../types';

export class FactoryCanvas {
  private container: HTMLElement;

  constructor() {
    this.container = div('factory-canvas');
    this.container.style.cssText = `
      width: 100%;
      min-height: 260px;
      background: var(--color-bg-elevated, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-xl, 16px);
      padding: var(--space-4, 16px);
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-x: auto;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    `;
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  /** Render latest simulation state */
  public update(state: Readonly<GameSimulationState>): void {
    this.container.replaceChildren();

    // 1. Title / Scene Indicator
    const sceneHeader = div('factory-canvas__header');
    sceneHeader.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: var(--color-text-secondary, #94a3b8);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding-bottom: 8px;
    `;
    sceneHeader.innerHTML = `
      <span>🏭 實體產線與現場資料流</span>
      <span>邏輯時鐘：<strong>t = ${state.time.toFixed(1)}</strong></span>
    `;
    this.container.appendChild(sceneHeader);

    // 2. Orders Overview if available
    if (state.orders.length > 0) {
      const orderGrid = div('factory-canvas__orders');
      orderGrid.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      `;

      state.orders.forEach((ord) => {
        const item = div('order-badge drop-zone');
        item.setAttribute('data-drop-target', 'order');
        item.setAttribute('data-target-id', ord.id);
        const modeBadge = ord.assignedMode
          ? `<span style="background: rgba(99,102,241,0.2); color: #818cf8; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700;">${ord.assignedMode}</span>`
          : `<span style="background: rgba(244,63,94,0.15); color: #f43f5e; padding: 2px 6px; border-radius: 4px; font-size: 11px;">未指定 CODP</span>`;

        item.style.cssText = `
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--color-border, #334155);
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          transition: all 0.15s ease;
        `;
        item.innerHTML = `
          <span>📦 <strong>${ord.id}</strong> (${ord.quantity} 件, 交期: ${ord.dueDate})</span>
          ${modeBadge}
        `;
        orderGrid.appendChild(item);
      });
      this.container.appendChild(orderGrid);
    }

    // 3. Station SVG Flow
    const stations = Array.from(state.stations.values());
    if (stations.length > 0) {
      const flowContainer = div('factory-canvas__flow');
      flowContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 0;
        overflow-x: auto;
      `;

      stations.forEach((st, idx) => {
        const stationCard = div('station-box drop-zone');
        stationCard.setAttribute('data-drop-target', 'station');
        stationCard.setAttribute('data-target-id', st.id);
        const isFixtureInstalled = (st.installedFixtures || 0) > 0;
        stationCard.style.cssText = `
          min-width: 140px;
          background: var(--color-bg-secondary, #0f172a);
          border: 2px solid ${isFixtureInstalled ? '#10b981' : '#6366f1'};
          border-radius: 12px;
          padding: 12px;
          text-align: center;
          position: relative;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.15s ease;
        `;

        stationCard.innerHTML = `
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">${st.name}</div>
          <div style="font-size: 12px; color: var(--color-text-secondary, #94a3b8); margin-bottom: 4px;">
            標準速率: <strong style="color: ${isFixtureInstalled ? '#10b981' : 'var(--color-text-primary)'};">${st.serviceRate}s/件</strong>
          </div>
          <div style="font-size: 11px; color: #64748b;">
            累計完工: <strong>${st.processedCount}</strong>
          </div>
          ${
            isFixtureInstalled
              ? `<div style="margin-top: 6px; font-size: 10px; background: rgba(16,185,129,0.15); color: #10b981; border-radius: 4px; padding: 2px 4px;">✨ 已裝配治具</div>`
              : ''
          }
        `;

        flowContainer.appendChild(stationCard);

        if (idx < stations.length - 1) {
          const arrow = h('div', { className: 'flow-arrow' }, '➔');
          arrow.style.cssText = 'color: #6366f1; font-size: 20px; font-weight: bold;';
          flowContainer.appendChild(arrow);
        }
      });

      this.container.appendChild(flowContainer);
    }

    // 4. Latest Event Banner
    const lastEvent = state.eventLog[state.eventLog.length - 1];
    if (lastEvent) {
      const logBar = div('factory-canvas__log');
      logBar.style.cssText = `
        font-size: 12px;
        color: var(--color-text-secondary, #94a3b8);
        background: rgba(0,0,0,0.25);
        padding: 6px 12px;
        border-radius: 6px;
        display: flex;
        gap: 8px;
      `;
      logBar.innerHTML = `
        <span>📢 [t=${lastEvent.time}]</span>
        <span>${lastEvent.message}</span>
      `;
      this.container.appendChild(logBar);
    }
  }
}
