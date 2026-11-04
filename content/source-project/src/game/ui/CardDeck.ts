/**
 * CardDeck.ts — Player Card Deck & Action Trigger UI
 * Supports both Fluid Drag-and-Drop (Pointer Events) and Accessible Click-to-Assign.
 */

import { div, h } from '@/utils/render';
import { getCardById } from '../cards';
import type { CardSpec, GameSimulationState } from '../types';

export interface CardPlayEvent {
  cardId: string;
  targetId?: string;
  parameters?: Record<string, unknown>;
}

export class CardDeck {
  private container: HTMLElement;
  private onPlayCallback: (event: CardPlayEvent) => void;
  private selectedCardId: string | null = null;
  private activeGhost: HTMLElement | null = null;

  constructor(onPlay: (event: CardPlayEvent) => void) {
    this.onPlayCallback = onPlay;
    this.container = div('card-deck');
    this.container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      user-select: none;
    `;
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public render(cardIds: string[], state: Readonly<GameSimulationState>): void {
    this.container.replaceChildren();

    const title = div('card-deck__title');
    title.style.cssText = `
      font-size: 14px;
      font-weight: 700;
      color: var(--color-text-primary, #f8fafc);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
    `;
    title.innerHTML = `
      <span>🃏 可用工程決策手牌 (${cardIds.length})</span>
      <span style="font-size: 12px; color: #a5b4fc; background: rgba(99,102,241,0.15); padding: 3px 8px; border-radius: 6px;">
        💡 支援拖曳至上方訂單／工站，亦可點選指派
      </span>
    `;
    this.container.appendChild(title);

    const cardsGrid = div('card-deck__grid');
    cardsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px;
    `;

    cardIds.forEach((cardId) => {
      const card = getCardById(cardId) || this.createFallbackCard(cardId);
      const isSelected = this.selectedCardId === cardId;
      const canAfford =
        state.resources.budget >= card.cost.budget &&
        state.resources.actionPoints >= card.cost.actionPoints;

      const cardEl = div(`game-card ${isSelected ? 'game-card--selected' : ''}`);
      cardEl.style.cssText = `
        background: var(--color-bg-elevated, #1e293b);
        border: 2px solid ${isSelected ? '#6366f1' : canAfford ? 'var(--color-border, #334155)' : '#475569'};
        opacity: ${canAfford ? '1' : '0.6'};
        border-radius: var(--radius-xl, 14px);
        padding: 14px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 8px;
        cursor: ${canAfford ? 'grab' : 'not-allowed'};
        transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        box-shadow: ${isSelected ? '0 0 16px rgba(99,102,241,0.3)' : '0 2px 6px rgba(0,0,0,0.1)'};
        touch-action: none;
      `;

      cardEl.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 700; background: rgba(99,102,241,0.2); color: #818cf8; padding: 2px 6px; border-radius: 4px;">
              ${card.family}
            </span>
            <div style="font-size: 11px; font-weight: 600; color: #f59e0b;">
              💰 預算: ${card.cost.budget} ｜ ⚡ 行動: ${card.cost.actionPoints}
            </div>
          </div>
          <div style="font-size: 14px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px;">
            ${card.name}
          </div>
          <div style="font-size: 12px; color: var(--color-text-secondary, #94a3b8); line-height: 1.4;">
            ${card.description}
          </div>
        </div>
      `;

      // Target selection interface if selected (Click fallback)
      if (isSelected && canAfford) {
        const targetPicker = div('card-deck__targets');
        targetPicker.style.cssText = `
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed rgba(255,255,255,0.1);
          display: flex;
          flex-direction: column;
          gap: 6px;
        `;

        const pickerLabel = div('', '選擇施加對象：');
        pickerLabel.style.fontSize = '12px';
        pickerLabel.style.color = '#cbd5e1';
        targetPicker.appendChild(pickerLabel);

        const targets: Array<{ id: string; label: string }> = [];
        if (card.targetType === 'station') {
          state.stations.forEach((s) => targets.push({ id: s.id, label: s.name }));
        } else if (card.targetType === 'order') {
          state.orders.forEach((o) => targets.push({ id: o.id, label: `訂單 ${o.id}` }));
        } else {
          targets.push({ id: 'global', label: '全廠生效' });
        }

        const buttonsRow = div('');
        buttonsRow.style.display = 'flex';
        buttonsRow.style.flexWrap = 'wrap';
        buttonsRow.style.gap = '6px';

        targets.forEach((t) => {
          const btn = h('button', { className: 'btn btn--primary' }, t.label);
          btn.style.cssText = 'padding: 4px 10px; font-size: 12px; border-radius: 6px;';
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.onPlayCallback({
              cardId: card.id,
              targetId: t.id,
            });
            this.selectedCardId = null;
          });
          buttonsRow.appendChild(btn);
        });

        targetPicker.appendChild(buttonsRow);
        cardEl.appendChild(targetPicker);
      }

      // Pointer Events Drag & Drop Logic
      let startX = 0;
      let startY = 0;
      let isDragging = false;
      let pointerCaptured = false;

      cardEl.addEventListener('pointerdown', (e: PointerEvent) => {
        if (!canAfford) return;
        startX = e.clientX;
        startY = e.clientY;
        isDragging = false;
        pointerCaptured = true;
        cardEl.setPointerCapture(e.pointerId);
      });

      cardEl.addEventListener('pointermove', (e: PointerEvent) => {
        if (!pointerCaptured) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (!isDragging && Math.hypot(dx, dy) > 8) {
          isDragging = true;
          cardEl.style.opacity = '0.4';
          cardEl.style.cursor = 'grabbing';

          // Create floating ghost card
          this.activeGhost = div('dragging-card-ghost');
          this.activeGhost.innerHTML = `
            <span>🃏</span>
            <span>${card.name}</span>
          `;
          document.body.appendChild(this.activeGhost);
        }

        if (isDragging && this.activeGhost) {
          this.activeGhost.style.left = `${e.clientX - 50}px`;
          this.activeGhost.style.top = `${e.clientY - 20}px`;

          // Check hover target
          const elUnder = document.elementFromPoint(e.clientX, e.clientY);
          const dropTarget = elUnder?.closest('.drop-zone') as HTMLElement | null;

          document.querySelectorAll('.drop-zone--hover').forEach((zone) => {
            zone.classList.remove('drop-zone--hover');
          });

          if (dropTarget) {
            const dropType = dropTarget.getAttribute('data-drop-target');
            if (card.targetType === dropType || card.targetType === 'global') {
              dropTarget.classList.add('drop-zone--hover');
            }
          }
        }
      });

      const handlePointerEnd = (e: PointerEvent) => {
        if (!pointerCaptured) return;
        pointerCaptured = false;
        try {
          cardEl.releasePointerCapture(e.pointerId);
        } catch {
          // ignore if already lost
        }

        cardEl.style.opacity = canAfford ? '1' : '0.6';
        cardEl.style.cursor = canAfford ? 'grab' : 'not-allowed';

        if (isDragging) {
          isDragging = false;

          // Check if dropped on valid target
          const elUnder = document.elementFromPoint(e.clientX, e.clientY);
          const dropTarget = elUnder?.closest('.drop-zone') as HTMLElement | null;

          if (this.activeGhost) {
            document.body.removeChild(this.activeGhost);
            this.activeGhost = null;
          }

          document.querySelectorAll('.drop-zone--hover').forEach((zone) => {
            zone.classList.remove('drop-zone--hover');
          });

          if (dropTarget) {
            const dropType = dropTarget.getAttribute('data-drop-target');
            const targetId = dropTarget.getAttribute('data-target-id');
            if (card.targetType === dropType || card.targetType === 'global') {
              this.onPlayCallback({
                cardId: card.id,
                targetId: targetId || undefined,
              });
              this.selectedCardId = null;
              return;
            }
          }
        } else {
          // It was a click, toggle selection
          this.selectedCardId = this.selectedCardId === cardId ? null : cardId;
          this.render(cardIds, state);
        }
      };

      cardEl.addEventListener('pointerup', handlePointerEnd);
      cardEl.addEventListener('pointercancel', handlePointerEnd);

      cardsGrid.appendChild(cardEl);
    });

    this.container.appendChild(cardsGrid);
  }

  private createFallbackCard(cardId: string): CardSpec {
    return {
      id: cardId,
      version: '1.0.0',
      family: 'F01',
      name: cardId,
      description: '工程決策措施卡',
      topicCodes: ['M11101'],
      conceptIds: ['CP-UNKNOWN'],
      targetType: 'global',
      prerequisites: [],
      cost: { budget: 0, actionPoints: 1 },
      effectiveAt: 'immediate',
      effects: [],
      stacking: false,
      evidence: [],
      feedback: { onApplied: '已出牌', onRejected: '失敗' },
      sourceRefs: [],
    };
  }
}
