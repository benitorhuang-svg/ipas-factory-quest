/**
 * PostMortemModal.ts — 4-Step Debrief and Knowledge Check Modal
 * Translates game outcome into verifiable learning evidence according to APPX04.
 */

import { div, h } from '@/utils/render';
import { navigateTo } from '@/services/router';
import type { LevelSpec, EvaluationResult } from '../types';

export class PostMortemModal {
  public static show(
    level: LevelSpec,
    evalResult: EvaluationResult,
    onRetry: () => void,
    onNextLevel?: () => void
  ): HTMLElement {
    const overlay = div('modal-overlay');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
      animation: fadeIn 0.2s ease-out;
    `;

    const modal = div('modal-card');
    modal.style.cssText = `
      background: var(--color-bg-elevated, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-2xl, 20px);
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      gap: 20px;
    `;

    // 1. Result Header
    const isPass = evalResult.star1Achieved;
    const header = div('modal-header');
    header.style.textAlign = 'center';
    header.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 8px;">${isPass ? '🏆' : '⚠️'}</div>
      <div style="font-size: 20px; font-weight: 800; color: ${isPass ? '#10b981' : '#f43f5e'};">
        ${isPass ? '關卡驗收通過！' : '尚未達成通關條件'}
      </div>
      <div style="font-size: 14px; color: var(--color-text-secondary, #94a3b8); margin-top: 6px;">
        ${isPass ? level.feedback.successSummary : '部分關鍵限制被破壞，或指標未達到任務驗收標準。'}
      </div>
      ${
        isPass
          ? `<div style="margin-top: 12px; font-size: 20px; letter-spacing: 4px;">
              ${evalResult.star2Achieved ? '⭐⭐' : '⭐'}
            </div>`
          : ''
      }
    `;
    modal.appendChild(header);

    // 2. Four-Step Debrief (APPX04)
    const debrief = div('modal-debrief');
    debrief.style.cssText = `
      background: var(--color-bg-secondary, #0f172a);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 13px;
    `;

    debrief.innerHTML = `
      <div style="font-weight: 700; color: #818cf8; margin-bottom: 2px;">📋 四步驟工程復盤 (APPX04)</div>
      <div><strong>1. 找問題：</strong>${level.scenario.brief}</div>
      <div><strong>2. 認層級：</strong>此決策隸屬於【${level.chapterId}】業務範疇，核心指標為【${level.objectives.map((o) => o.metric).join(', ')}】。</div>
      <div><strong>3. 核效果：</strong>${
        isPass
          ? '現場各項參數均依照預期模型運轉，無任何互鎖違規。'
          : `發現違規事項：${evalResult.violations.join('；') || '產出指標未達標'}`
      }</div>
      <div><strong>4. 驗條件：</strong>本關假設模型為【${level.assumptions.modelType}】，時間單位為【${level.assumptions.timeUnit}】。</div>
    `;
    modal.appendChild(debrief);

    // 3. Knowledge Check Quiz
    if (level.knowledgeChecks.length > 0) {
      const check = level.knowledgeChecks[0];
      const quizBox = div('modal-quiz');
      quizBox.style.cssText = `
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      `;

      quizBox.innerHTML = `
        <div style="font-weight: 700; font-size: 14px; color: var(--color-text-primary);">
          💡 觀念檢核題：${check.question}
        </div>
      `;

      const optionsList = div('modal-quiz__options');
      optionsList.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

      const feedbackBox = div('modal-quiz__feedback');
      feedbackBox.style.cssText = 'display: none; padding: 10px; border-radius: 8px; font-size: 13px; line-height: 1.4;';

      check.options.forEach((opt, idx) => {
        const optBtn = h('button', { className: 'btn btn--secondary' }, `${String.fromCharCode(65 + idx)}. ${opt}`);
        optBtn.style.cssText = 'text-align: left; padding: 10px 14px; font-size: 13px; border-radius: 8px;';

        optBtn.addEventListener('click', () => {
          const isCorrect = idx === check.answer;
          feedbackBox.style.display = 'block';
          feedbackBox.style.background = isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)';
          feedbackBox.style.color = isCorrect ? '#10b981' : '#f43f5e';
          feedbackBox.innerHTML = `
            <strong>${isCorrect ? '✅ 正確！' : '❌ 答錯了！'}</strong>
            <p style="margin-top: 4px; color: var(--color-text-secondary, #94a3b8);">${check.explanation}</p>
          `;

          optionsList.querySelectorAll('button').forEach((b) => ((b as HTMLButtonElement).disabled = true));
          optBtn.style.borderColor = isCorrect ? '#10b981' : '#f43f5e';
        });

        optionsList.appendChild(optBtn);
      });

      quizBox.appendChild(optionsList);
      quizBox.appendChild(feedbackBox);
      modal.appendChild(quizBox);
    }

    // 4. Action Buttons
    const actions = div('modal-actions');
    actions.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; margin-top: 8px;';

    const retryBtn = h('button', { className: 'btn btn--secondary' }, '🔄 重新嘗試');
    retryBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      onRetry();
    });
    actions.appendChild(retryBtn);

    const textbookBtn = h('button', { className: 'btn btn--secondary' }, '📖 前往對應教材');
    textbookBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      const topicCode = level.topicCodes[0] || 'M11101';
      navigateTo(`/topic/${topicCode}`);
    });
    actions.appendChild(textbookBtn);

    if (isPass && onNextLevel) {
      const nextBtn = h('button', { className: 'btn btn--primary' }, '進入下一關 ➔');
      nextBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        onNextLevel();
      });
      actions.appendChild(nextBtn);
    }

    const closeBtn = h('button', { className: 'btn btn--secondary' }, '返回大廳');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      navigateTo('/game');
    });
    actions.appendChild(closeBtn);

    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    return overlay;
  }
}
