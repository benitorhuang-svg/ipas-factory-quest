(function () {
  'use strict';
  function render({ state, bank, E, qmap, units, esc, icon, footer }) {
    const list = E.reviewIds(state, bank).map(id => qmap.get(id)).filter(Boolean);
    const entries = new Map(E.reviewEntries(state, bank));
    const wrongCount = list.filter(q => !entries.get(q.id).lastCorrect).length;
    if (!list.length) return `<div class="empty">${icon('circlecheck')}<h2>今日複習已完成</h2><p>待加強與到期題會集中在這裡；下次優先換新題，答對題降低出現權重。</p><a class="btn btn-primary" href="#/home">開始單元練習${icon('arrow')}</a></div>${footer()}`;
    return `<section class="repair-summary"><div><h2>${list.length} 題待複習</h2><p>${wrongCount} 題待加強 · ${list.length - wrongCount} 題已到期。錯題優先重練；到期題從同單元、同類型優先換新題，已答對題降低出現權重。每次最多 10 題，答對後三天再複習。</p></div><button class="btn btn-primary" data-action="review">開始今日複習${icon('arrow')}</button></section>
      <div class="review-groups">${units.map(unit => {
        const questions = list.filter(q => q.unit === unit.id);
        if (!questions.length) return '';
        return `<details class="review-group" ${list.length <= 10 ? 'open' : ''}><summary><span>${unit.id}</span><strong>${esc(unit.title)}</strong><small>${questions.length} 題</small>${icon('chevrondown')}</summary><div>${questions.map(q => `<article class="repair-card"><div><small>${entries.get(q.id).lastCorrect ? '到期參考題 · 作答時優先換新題' : '上次答錯 · 優先重練'} · 已練習 ${entries.get(q.id).attempts || 1} 次</small><h3>${esc(q.stem)}</h3></div><button class="btn btn-small" data-action="poster" data-unit="${unit.id}" aria-label="查看 ${unit.id} 複習圖">${icon('book')}複習圖</button></article>`).join('')}</div></details>`;
      }).join('')}</div>${footer()}`;
  }
  window.FactoryReview = { render };
})();
