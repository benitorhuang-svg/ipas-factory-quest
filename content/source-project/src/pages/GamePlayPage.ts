/**
 * GamePlayPage.ts — Interactive Factory Simulation Game Play View
 * Orchestrates the SimulationEngine, FactoryCanvas, CardDeck, GameHUD, and PostMortemModal.
 */

import { div, h } from '@/utils/render';
import { PageShell } from '@/components/organisms';
import { navigateTo } from '@/services/router';
import { getLevelById } from '@/game/levels';
import { CARD_REGISTRY } from '@/game/cards';
import { SimulationEngine } from '@/game/engine/SimulationEngine';
import { FactoryCanvas } from '@/game/ui/FactoryCanvas';
import { CardDeck } from '@/game/ui/CardDeck';
import { GameHUD } from '@/game/ui/GameHUD';
import { PostMortemModal } from '@/game/ui/PostMortemModal';
import { showToast } from '@/components/atoms';
import { setLevelCompleted } from '@/game/progress';
import type { RouteParams } from '@/core/types';

export function GamePlayPage(params: RouteParams): HTMLElement {
  const levelId = params.levelId || 'T01';
  const level = getLevelById(levelId);

  if (!level) {
    const errorPage = div('detail-page-container');
    errorPage.style.cssText = 'text-align: center; padding: 48px 16px;';
    errorPage.innerHTML = `
      <div style="font-size: 40px; margin-bottom: 12px;">🔍</div>
      <h2>找不到關卡 #${levelId}</h2>
      <p style="color: #94a3b8; margin-top: 8px;">該關卡資料尚未載入或規格正在建構中。</p>
    `;
    const backBtn = h('button', { className: 'btn btn--primary mt-4' }, '返回關卡大廳');
    backBtn.addEventListener('click', () => navigateTo('/game'));
    errorPage.appendChild(backBtn);
    return PageShell('/game', errorPage, { onBack: () => navigateTo('/game') });
  }

  // 1. Initialize Engine & Components
  const engine = new SimulationEngine(level, CARD_REGISTRY);
  const canvas = new FactoryCanvas();

  let deck: CardDeck;
  let hud: GameHUD;
  let isEvaluationComplete = false;

  const handleCardPlay = (event: { cardId: string; targetId?: string }) => {
    const res = engine.dispatch({
      round: 1,
      time: engine.getState().time,
      cardId: event.cardId,
      targetId: event.targetId,
    });

    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  deck = new CardDeck(handleCardPlay);

  const handleRunToCompletion = () => {
    const evalResult = engine.runToCompletion();
    isEvaluationComplete = true;
    if (evalResult.star1Achieved) {
      setLevelCompleted(level.id, evalResult.star2Achieved ? 2 : 1);
    }
    hud.render(engine.getState(), isEvaluationComplete);
    PostMortemModal.show(
      level,
      evalResult,
      () => {
        engine.reset();
        isEvaluationComplete = false;
      },
      () => {
        if (levelId === 'T01') navigateTo('/game/C01-L01');
        else navigateTo('/game');
      }
    );
  };

  const handleStep = () => {
    engine.step(level.assumptions.timeUnit === 'second' ? 10 : 1);
    showToast(`模擬推進至 t = ${engine.getState().time.toFixed(1)}`, 'info');
  };

  const handleReset = () => {
    engine.reset();
    isEvaluationComplete = false;
    showToast('已重設為初始模擬狀態', 'info');
  };

  const handleInspectDebrief = () => {
    const evalResult = engine.evaluateObjectives();
    PostMortemModal.show(
      level,
      evalResult,
      () => {
        engine.reset();
        isEvaluationComplete = false;
      },
      () => navigateTo('/game')
    );
  };

  hud = new GameHUD(level, {
    onStep: handleStep,
    onRunToCompletion: handleRunToCompletion,
    onReset: handleReset,
    onInspectDebrief: handleInspectDebrief,
  });

  // 2. Wire up Reactive Subscriptions
  engine.subscribe((state) => {
    canvas.update(state);
    deck.render(level.startingHand, state);
    hud.render(state, isEvaluationComplete);
  });

  // 3. Initial Render
  canvas.update(engine.getState());
  deck.render(level.startingHand, engine.getState());
  hud.render(engine.getState(), isEvaluationComplete);

  // 4. Page Layout Assembly
  const page = div('game-play-page detail-page-container anim-stagger');
  page.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    max-width: 1000px;
    margin: 0 auto;
    width: 100%;
  `;

  page.appendChild(hud.getElement());
  page.appendChild(canvas.getElement());
  page.appendChild(deck.getElement());

  return PageShell('/game', page, {
    compactHeader: true,
    onBack: () => navigateTo('/game'),
  });
}
