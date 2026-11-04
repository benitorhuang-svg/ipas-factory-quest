(function () { 'use strict';
function create(ctx) {
const { E, state, bank, lastReport, qmap, byUnit, fmt, icon, esc, footer, modeName, runQuestions, home } = ctx;
function quizView() {
    const run = state.active;
    if (!run) return `
      <div class="empty">
        ${icon('flag')}
        <h2>還沒有進行中的任務</h2>
        <p>選擇一個部門，或進入考前模擬開始作答。</p>
        <button class="btn btn-primary" data-action="nav" data-view="home">回到工廠${icon('arrow')}</button>
      </div>
    `;
    const qs = runQuestions(), unit = byUnit(run.unitId), answers = run.answers;
    return `
      <div class="quiz-top">
        <div>
          <h1>${unit ? unit.room : modeName(run)}</h1>
          <p>${run.unitId ? run.unitId + ' · ' : ''}${modeName(run)} · 答完統一交卷與解析</p>
        </div>
        <div class="button-row">
          ${run.unitId ? `<button type="button" class="quiz-helper-btn" data-action="quiz-helper" data-unit="${run.unitId}">${icon('bulb')}<span>單元重點速記</span></button>` : ''}
          ${run.mode === 'exam' ? `<div id="clock" class="timer number" aria-label="模擬剩餘時間">${icon('clock')}<span>75:00</span></div>` : ''}
          <button class="btn btn-small" aria-label="暫存離開" data-action="nav" data-view="home">${icon('save')}<span>暫存離開</span></button>
        </div>
      </div>
      ${run.mode === 'exam' ? '<div class="exam-warning">模擬採50題單選、75分鐘。時間到自動交卷，未答題以答錯計；離開頁面後仍持續計時。</div>' : ''}
      <div class="quiz-status">
        <div class="quiz-status-line">
          <span>已完成 <strong id="answered-count" class="number">0</strong>／${qs.length} 題</span>
          <span id="save-note" class="muted">進度自動儲存</span>
        </div>
        <details class="quiz-map"><summary>${icon('grid')}題號導覽</summary><div class="question-nav" aria-label="題目導航">
          ${qs.map((q, i) => `<button type="button" class="question-dot ${E.hasAnswer(q, answers[q.id]) ? 'done' : ''}" data-action="jump" data-q="${q.id}" data-qdot="${q.id}" aria-label="跳至第${i + 1}題">${i + 1}</button>`).join('')}
        </div></details>
      </div>
      <form id="quiz-form" novalidate>
        ${qs.map((q, i) => `
          <article id="question-${q.id}" class="question-card">
            <div class="question-meta">
              <span class="question-no number">${String(i + 1).padStart(2, '0')}</span>
              <span>${q.unit} · ${({ concept: '觀念辨識', scenario: '現場決策', calculation: '計算挑戰' })[q.skill] || '單元挑戰'}</span>
              ${q.kind === 'number' ? '<span class="tag tag-green">輸入數值</span>' : ''}
            </div>
            <h2 id="question-title-${q.id}" tabindex="-1">${esc(q.stem)}</h2>
            ${q.kind === 'choice' ? `
              <div class="options" role="radiogroup" aria-labelledby="question-title-${q.id}">
                ${q.options.map((o, j) => `
                  <label class="option">
                    <input type="radio" name="${q.id}" data-answer="${q.id}" value="${j}" ${answers[q.id] === j ? 'checked' : ''}>
                    <span class="option-letter">${'ABCD'[j]}</span>
                    <span>${esc(o)}</span>
                  </label>
                `).join('')}
              </div>
            ` : `
              <label class="sr-only" for="number-${q.id}">第${i + 1}題數值答案，單位${esc(q.answerUnit)}</label>
              <div class="numeric-row">
                <input id="number-${q.id}" type="text" inputmode="decimal" autocomplete="off" data-answer="${q.id}" value="${esc(answers[q.id] ?? '')}" placeholder="輸入計算結果" aria-describedby="error-${q.id}">
                <span class="number-unit">${esc(q.answerUnit)}</span>
              </div>
              <div id="error-${q.id}" class="input-error" aria-live="polite"></div>
            `}
            ${run.mode !== 'exam' ? `
              <details class="hint">
                <summary>${icon('bulb')}需要一點提示</summary>
                <p>${esc(q.hint)}</p>
              </details>
            ` : ''}
          </article>
        `).join('')}
        <div class="quiz-submit">
          <div>
            <strong>完成後，一次看懂解題關鍵。</strong>
            <p id="submit-note">還有${qs.length}題等待你的決定</p>
          </div>
          <button type="submit" id="submit-run" class="btn btn-primary" disabled>提交任務${icon('arrow')}</button>
        </div>
      </form>
      ${footer()}
    `;
  }

function formatAnswer(q, a) {
    if (!E.hasAnswer(q, a)) return '未作答';
    return q.kind === 'number' ? fmt(E.parseNumber(a)) + ' ' + q.answerUnit : 'ABCD'[a] + '. ' + q.options[a];
  }

function resultView(id) {
    const r = state.history.find(x => x.runId === id) || lastReport || state.history.at(-1);
    if (!r) return home();
    const u = byUnit(r.unitId), passed = r.score >= 80;
    return `
      <div class="result-hero ${passed ? '' : 'failed'}">
        <div>
          <div class="eyebrow">MISSION REPORT · ${esc(r.unitId || 'MIXED CHALLENGE')}</div>
          <h1>${r.newBadge ? '部門升級，徽章到手！' : r.mode === 'review' ? (r.correct === r.total ? '返修完成，觀念歸位。' : '再修一輪，把觀念補齊。') : passed ? '任務完成，繼續前進。' : '找到弱點，就有改善方向。'}</h1>
          <p>${u ? esc(u.room) + ' · ' : ''}${modeName(r)} · ${esc(r.correct)}／${esc(r.total)}題答對</p>
          <div class="result-chips">
            <span>${icon('star')}+${esc(r.earnedXP)} XP</span>
            ${r.newBadge ? `<span>${icon('badge')}${u.badge}</span>` : ''}
            <span>${icon('wrench')}${r.total - r.correct ? (r.total - r.correct) + '題已送返修' : '本次全數答對'}</span>
          </div>
        </div>
        <div class="result-score">
          <b class="number">${esc(r.score)}</b>
          <small>練習得分</small>
        </div>
      </div>
      <div class="result-actions">
        ${E.reviewIds(state, bank).length ? `<button class="btn btn-primary" data-action="review">${icon('wrench')}繼續複習</button><a class="btn" href="#/home">回到總覽</a>` : `<a class="btn btn-primary" href="#/home">${icon('home')}繼續下一個單元</a>`}
        ${u ? `<a class="btn" href="#/guide/materials/${u.topicCode}">${icon('book')}閱讀本章講義</a>` : ''}
      </div>
      <div class="result-toolbar">
        <h2>逐題解析</h2><label><input type="checkbox" id="result-only-wrong">只看錯題</label><span id="result-count" role="status">顯示 ${r.results.length} 題解析</span>
      </div>
      ${r.results.map((item, i) => {
        const q = qmap.get(item.id);
        if (!q) return '';
        return `
          <article class="feedback-card ${item.correct ? 'right' : 'wrong'}">
            <div class="feedback-meta">
              ${icon(item.correct ? 'circlecheck' : 'cross')}
              <span>第${i + 1}題 · ${q.unit} · ${item.correct ? '答對' : '待返修'}</span>
            </div>
            <h3>${esc(q.stem)}</h3>
            <div class="answer-lines">
              <div><span>你的答案</span>${esc(formatAnswer(q, item.answer))}</div>
              <div><span>正確答案</span>${esc(formatAnswer(q, q.answer))}</div>
            </div>
            <p class="explanation">${esc(q.explanation)}</p>
            <div class="button-row" style="margin-top:10px">
              <button class="text-link feedback-poster" data-action="poster" data-unit="${q.unit}">${icon('book')}查看${q.unit}複習圖</button>
            </div>
          </article>
        `;
      }).join('')}
      ${footer()}
    `;
  }
return { quizView, resultView };
}
window.FactoryQuiz = { render: ctx => create(ctx).quizView(), result: (ctx, id) => create(ctx).resultView(id) };
})();
