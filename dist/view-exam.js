(function () { 'use strict';
function render(ctx, subTab) {
const { DATA, icon, esc, footer } = ctx;
function examView(subTab = 'quiz') {
    const isPdfs = (subTab === 'pdfs');
    if (isPdfs) {
      return `
        <p class="section-description">官方樣題、歷屆試題解答與鑑定指引 · ${(DATA.pdfs || []).length} 份 PDF</p>
        <div class="pdf-grid">
          ${(DATA.pdfs || []).map(p => `
            <article class="pdf-card">
              <div class="pdf-header">
                <div class="pdf-icon">${icon('book')}</div>
                <div class="pdf-meta">
                  <h3>${esc(p.title)}</h3>
                  <small>官方 PDF · ${esc(p.size)}</small>
                </div>
              </div>
              <div class="button-row">
                <a class="btn btn-small btn-primary" href="assets/pdf/${p.name}" target="_blank" rel="noopener">${icon('external')}在線開啟</a>
                <a class="btn btn-small" href="assets/pdf/${p.name}" download="${p.name}">${icon('download')}下載 PDF</a>
              </div>
            </article>
          `).join('')}
        </div>
        ${footer()}
      `;
    }

    return `
      <p class="section-description">選擇考試科目，開始 50 題、75 分鐘的計時演練。</p>
      <div class="exam-grid">
        ${[1, 2].map(s => `
          <section class="exam-card">
            <span class="room-icon ${s === 1 ? 'mint' : 'blue'}">${icon(s === 1 ? 'calendar' : 'network')}</span>
            <div class="eyebrow">SUBJECT 0${s}</div>
            <h2>${s === 1 ? '生產與作業管理基礎' : '智慧製造生產線管理基礎'}</h2>
            <div class="exam-stats">
              <span><strong class="number">50</strong><small>題單選</small></span>
              <span><strong class="number">75</strong><small>分鐘</small></span>
              <span><strong class="number">100</strong><small>分滿分</small></span>
            </div>
            <p>${s === 1 ? '涵蓋 L111～L116 六大單元，每單元均勻抽題。' : '涵蓋 L121～L126 六大單元，每單元均勻抽題。'}<br>時間到將自動交卷；離開頁面後計時仍會持續。</p>
            <button class="btn btn-primary" data-action="start" data-mode="exam" data-subject="${s}">${icon('flag')}開始科目${s === 1 ? '一' : '二'}模擬</button>
          </section>
        `).join('')}
      </div>
      <details class="panel source-panel"><summary>關於練習題與正式考試</summary>
        <p>本網站題目為依官方範圍設計的原創練習題與實戰題庫，全庫共收錄 476 題。50題／75分鐘用於模擬正式作答節奏；網站的 80 分通關門檻是遊戲規則，正式獲證標準請依當年度簡章判定（雙科平均 70 分以上，任一科不低於 60 分）。</p>
        <div class="source-links">
          <a href="https://ipd.nat.gov.tw/ipas/certification/SPE/exam-info" target="_blank" rel="noopener">官方考試資訊 ↗</a>
          <a href="https://ipd.nat.gov.tw/ipas/certification/SPE/learning-resources" target="_blank" rel="noopener">官方歷屆試題 ↗</a>
        </div>
      </details>
      ${footer()}
    `;
  }
return examView(subTab);
}
window.FactoryExam = { render };
})();
