(function () {
  'use strict';
  function render({ byUnit, bank, E, state, icon, esc, footer, home }, id) {
    const unit = byUnit(id);
    if (!unit) return home();
    const best = state.best[id];
    return `<a class="reader-back" href="#/home">${icon('back')}全部單元</a>
      <div class="unit-layout"><section class="panel unit-brief">
        <div class="eyebrow">${id} · 科目${unit.subject === 1 ? '一' : '二'} · ${E.catalog(bank).unique.filter(q => q.unit === id).length} 題不同內容</div>
        <h2>本章練習</h2><p class="unit-mission">${esc(unit.mission)}</p>
        <ul class="topic-list">${unit.topics.map(topic => `<li>${icon('check')}${esc(topic)}</li>`).join('')}</ul>
        <div class="unit-practice-actions"><button class="btn btn-primary" data-action="start" data-unit="${id}" data-mode="mission">開始 10 題闖關${icon('arrow')}</button><button class="btn" data-action="start" data-unit="${id}" data-mode="quick">5 題快練</button></div>
        <p class="unit-best">${best !== undefined ? `目前最佳 ${best} 分${state.passedUnits.includes(id) ? ` · 已取得${esc(unit.badge)}` : ''}` : '自由挑戰，依自己的步調開始。'}</p>
        <details class="unit-rules"><summary>通關與計分規則</summary><p>10 題闖關達 80 分即可通關；首次通關加 50 XP。5 題快練用於回想觀念，不授予通關徽章。</p></details>
      </section><section class="panel unit-study" aria-labelledby="unit-study-title">
        <h2 id="unit-study-title">先理解，再練習</h2><p>${esc(unit.takeaway)}</p>
        <a class="unit-study-link" href="#/guide/materials/${unit.topicCode}">${icon('book')}精讀講義${icon('arrow')}</a>
        ${unit.interactiveUrl ? `<button class="unit-study-link" data-action="open-interactive" data-url="${esc(unit.interactiveUrl)}" data-title="${esc(unit.title)} 互動圖">${icon('network')}互動架構圖${icon('arrow')}</button>` : ''}
        <button class="unit-image" data-action="lightbox" data-src="${esc(unit.diagram3D || `assets/${id}.png`)}" data-title="${esc(unit.title)} 圖解"><img ${window.FactoryUI.preview(unit.diagram3D || `assets/${id}.png`)} alt="${esc(unit.title)} 圖解預覽"><span>${icon('eye')}放大圖解</span></button>
      </section></div>${footer()}`;
  }
  window.FactoryUnit = { render };
})();
