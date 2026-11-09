(function () { 'use strict';
function render(ctx) {
const { E, state, units, bank, fmt, icon, esc, footer, modeName } = ctx;
function progressView() {
    const history = [...state.history].reverse();
    const practice = E.practiceStats(state, bank);
    return `
      <div class="stats-row" aria-label="累計學習統計">
        <div class="stat" data-stat="practiced"><span class="stat-icon">${icon('book')}</span><div><div class="stat-label">已練習題目</div><div class="stat-value number">${fmt(practice.practiced)}<small>／${practice.total} 題</small></div></div></div>
        <div class="stat" data-stat="attempts"><span class="stat-icon">${icon('chart')}</span><div><div class="stat-label">累計答題次數</div><div class="stat-value number">${fmt(practice.attempts)}<small>次</small></div></div></div>
        <button type="button" class="stat stat-start" data-stat="unseen" data-action="start" data-mode="unseen" ${practice.unseen ? '' : 'disabled'}><span class="stat-icon">${icon('flag')}</span><span><span class="stat-label">尚未練習題目</span><span class="stat-value number">${fmt(practice.unseen)}<small>題</small></span><span class="stat-start-hint">${practice.unseen ? '開始練習 · 每次最多 10 題 →' : '全部題目已練習'}</span></span></button>
        <div class="stat"><span class="stat-icon">${icon('star')}</span><div><div class="stat-label">累積經驗 · ${esc(E.level(state.xp))}</div><div class="stat-value number">${fmt(state.xp)}<small>XP</small></div></div></div>
        <div class="stat"><span class="stat-icon">${icon('flame')}</span><div><div class="stat-label">連續學習</div><div class="stat-value number">${E.streak(state)}<small>天</small></div></div></div>
        <div class="stat"><span class="stat-icon">${icon('check')}</span><div><div class="stat-label">已答對不同題目</div><div class="stat-value number">${E.masteredIds(state, bank).length}<small>／${E.catalog(bank).unique.length}</small></div></div></div>
      </div>
      <p class="backup-note practice-count-note">統計所有模式的已交卷作答，未交卷不計入；同一道題重練三次，計為 1 題已練習、3 次作答。相同內容題目合併，次數依各題保留的累計紀錄計算。</p>
      <details class="panel practice-breakdown"><summary>各單元練習統計</summary><div class="practice-table-wrap"><table>
        <caption>已交卷的練習題目與答題次數</caption><thead><tr><th scope="col">單元</th><th scope="col">已練習／總題數</th><th scope="col">未練習</th><th scope="col">答題次數</th></tr></thead>
        <tbody>${units.map(unit => {
          const counts = E.practiceStats(state, bank, unit.id);
          return `<tr><th scope="row"><a href="#/unit/${unit.id}">${unit.id} · ${esc(unit.title)}</a></th><td>${counts.practiced}／${counts.total} 題</td><td>${counts.unseen} 題</td><td>${fmt(counts.attempts)} 次</td></tr>`;
        }).join('')}</tbody></table></div></details>
      ${window.FactoryPracticeDetails.render(ctx)}
      <div class="progress-grid">
        <section class="panel">
          <h2 class="medal-title">${icon('badge')}部門成就徽章</h2>
          <div class="badge-grid">
            ${units.map(u => `
              <div class="badge ${state.passedUnits.includes(u.id) ? 'earned' : ''}">
                <div class="badge-emblem">${icon(u.icon)}</div>
                <strong>${u.badge}</strong>
                <small>${u.id} · ${state.best[u.id] !== undefined ? state.best[u.id] + '分' : '未通關'}</small>
              </div>
            `).join('')}
          </div>
          <p class="backup-note">每個部門的10題闖關達80分，即可取得徽章。每題首次答對＋10 XP，部門首次通關另＋50 XP；重複答對同一題不重複累積經驗。</p>
          <h3 style="margin-top:25px">最近任務</h3>
          ${history.length ? history.slice(0, 12).map(r => `
            <button class="history-item" style="width:100%;background:transparent;text-align:left" data-action="report" data-id="${esc(r.runId)}">
              <span><strong>${r.unitId ? esc(r.unitId) + ' · ' : ''}${modeName(r)}</strong><small>${new Date(r.completedAt).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' })} · ${esc(r.correct)}／${esc(r.total)}題答對</small></span>
              <span class="history-score number">${esc(r.score)}<small>分</small></span>
            </button>
          `).join('') : '<p class="history-empty">完成第一場任務後，這裡就會留下你的紀錄。</p>'}
        </section>
        <div>
          ${window.FactoryOffline.render(esc)}
          <section class="panel">
            <h2>保管你的學習進度</h2>
            <p class="backup-note">進度自動儲存在目前瀏覽器。換裝置或清除瀏覽資料前，可先匯出備份，再到新裝置匯入。</p>
            <div class="backup-actions">
              <button class="btn btn-small" data-action="export">${icon('download')}匯出進度</button>
              <button class="btn btn-small" data-action="import">${icon('upload')}匯入進度</button>
            </div>
            <details class="danger-area"><summary>進階資料管理</summary>
              <p>重新開始會清除此裝置的成績、徽章與作答紀錄。</p>
              <button class="btn btn-small btn-danger" data-action="reset">${icon('trash')}重新開始</button>
            </details>
          </section>
          <details class="panel source-panel"><summary>學習資料來源</summary>
            <p>收錄 ${E.catalog(bank).unique.length} 道不同內容練習題。舊進度與已取得經驗值會保留，同一內容不重複計算新獎勵。</p>
            <div class="source-links">
              <a href="https://ipd.nat.gov.tw/ipas/certification/SPE/exam-info" target="_blank" rel="noopener">官方範圍 ↗</a>
              <a href="https://www.oee.com/calculating-oee/" target="_blank" rel="noopener">OEE 定義 ↗</a>
              <a href="https://asq.org/quality-resources/seven-basic-quality-tools" target="_blank" rel="noopener">品管工具 ↗</a>
            </div>
          </details>
        </div>
      </div>
      ${footer()}
    `;
  }
return progressView();
}
window.FactoryProgress = { render };
})();
