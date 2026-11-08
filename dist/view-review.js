(function () {
  'use strict';
  function render({ state, bank, E, qmap, units, esc, icon, footer }) {
    const list = E.reviewIds(state, bank).map(id => qmap.get(id)).filter(Boolean);
    const entries = new Map(E.reviewEntries(state, bank));
    if (!list.length) return `<div class="empty">${icon('circlecheck')}<h2>目前沒有待複習的錯題</h2><p>答錯的題目會加入這裡，答對後移出。繼續單元練習時，同類型優先抽未練題，已答對題降低出現權重，逐步練完整個題庫。</p><a class="btn btn-primary" href="#/home">開始單元練習${icon('arrow')}</a></div>${footer()}`;
    return `<section class="repair-summary"><div><h2>${list.length} 題錯題待複習</h2><p>只複習上次答錯的原題，每次最多 10 題；答對立即移出，答錯保留。單元練習同類型優先抽未練題，已答對題降低出現權重。</p></div><button class="btn btn-primary" data-action="review">開始錯題複習${icon('arrow')}</button></section>
      <div class="review-groups">${units.map(unit => {
        const questions = list.filter(q => q.unit === unit.id);
        if (!questions.length) return '';
        return `<details class="review-group" ${list.length <= 10 ? 'open' : ''}><summary><span>${unit.id}</span><strong>${esc(unit.title)}</strong><small>${questions.length} 題</small>${icon('chevrondown')}</summary><div>${questions.map(q => `<article class="repair-card"><div><small>上次答錯 · 重練原題 · 已練習 ${entries.get(q.id).attempts || 1} 次</small><h3>${esc(q.stem)}</h3></div><button class="btn btn-small" data-action="poster" data-unit="${unit.id}" aria-label="查看 ${unit.id} 複習圖">${icon('book')}複習圖</button></article>`).join('')}</div></details>`;
      }).join('')}</div>${footer()}`;
  }
  window.FactoryReview = { render };
})();
