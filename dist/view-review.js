(function () {
  'use strict';
  function render({ state, bank, E, qmap, units, esc, icon, footer }) {
    const list = E.reviewIds(state, bank).map(id => qmap.get(id)).filter(Boolean);
    if (!list.length) return `<div class="empty">${icon('circlecheck')}<h2>今日複習已完成</h2><p>錯題與已到期的觀念會集中在這裡；答對後三天再回想。</p><a class="btn btn-primary" href="#/home">開始單元練習${icon('arrow')}</a></div>${footer()}`;
    return `<section class="repair-summary"><div><h2>${list.length} 題待複習</h2><p>錯題優先，再依到期日排序；每次最多 10 題，答對後三天再回想。</p></div><button class="btn btn-primary" data-action="review">開始今日複習${icon('arrow')}</button></section>
      <div class="review-groups">${units.map(unit => {
        const questions = list.filter(q => q.unit === unit.id);
        if (!questions.length) return '';
        return `<details class="review-group" ${list.length <= 10 ? 'open' : ''}><summary><span>${unit.id}</span><strong>${esc(unit.title)}</strong><small>${questions.length} 題</small>${icon('chevrondown')}</summary><div>${questions.map(q => `<article class="repair-card"><div><small>已練習 ${state.ledger[q.id]?.attempts || 1} 次</small><h3>${esc(q.stem)}</h3></div><button class="btn btn-small" data-action="poster" data-unit="${unit.id}" aria-label="查看 ${unit.id} 複習圖">${icon('book')}複習圖</button></article>`).join('')}</div></details>`;
      }).join('')}</div>${footer()}`;
  }
  window.FactoryReview = { render };
})();
