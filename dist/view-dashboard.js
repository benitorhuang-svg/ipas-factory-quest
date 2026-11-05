(function () {
  'use strict';
  function render({ units, bank, qmap, state, filter, E, icon, esc, fmt, footer }) {
    const next = units.find(u => !state.passedUnits.includes(u.id)) || units.reduce((a, b) => (state.best[a.id] || 0) <= (state.best[b.id] || 0) ? a : b);
    const active = state.active;
    const activeUnit = units.find(u => u.id === active?.unitId);
    const wrong = E.reviewIds(state, bank).length;
    const subset = units.filter(unit => filter === 'all' || unit.subject === filter);
    return `<section class="dashboard-next" aria-labelledby="next-title">
      <div class="dashboard-next-copy"><div class="eyebrow">${active ? '繼續上次進度' : '下一個學習任務'}</div>
        <h2 id="next-title">${esc(active ? activeUnit?.title || (active.mode === 'exam' ? '計時模擬測驗' : '到期複習') : wrong ? '今日到期複習' : next.title)}</h2>
        <p>${active ? `已完成 ${active.questionIds.filter(id => qmap.has(id) && E.hasAnswer(qmap.get(id), active.answers[id])).length} / ${active.questionIds.length} 題，接著完成這次練習。` : wrong ? `${wrong} 題待複習：錯題優先重練，到期題優先換新題。` : esc(next.takeaway)}</p>
        <div class="dashboard-next-actions"><button class="btn btn-primary" data-action="${active ? 'resume' : wrong ? 'review' : 'unit'}" ${active || wrong ? '' : `data-unit="${next.id}"`}>${active ? '繼續作答' : wrong ? '開始今日複習' : '開始本章練習'}${icon('arrow')}</button><a class="text-link" href="#/guide/materials/${activeUnit?.topicCode || next.topicCode}">先讀講義</a></div>
      </div><div class="dashboard-next-symbol" aria-hidden="true">${icon('factory')}<span>FACTORY<br>QUEST</span></div>
    </section>
    <dl class="dashboard-metrics" aria-label="學習概況">
      <div><dt>已通關單元</dt><dd>${state.passedUnits.length}<small> / ${units.length}</small></dd></div>
      <div><dt>累積經驗</dt><dd>${fmt(state.xp)}<small> XP</small></dd></div>
      <div><dt>今日待複習</dt><dd><a href="#/repair">${wrong}<small> 題${icon('arrow')}</small></a></dd></div>
    </dl>
    <section aria-labelledby="challenge-title"><div class="dashboard-section-heading"><h2 id="challenge-title">選一個單元開始</h2>
      <div class="subject-toggle" role="group" aria-label="考科篩選">${[['all', '全部'], [1, '科目一'], [2, '科目二']].map(([value, label]) => `<button type="button" data-action="filter" data-filter="${value}" class="${filter === value ? 'active' : ''}" aria-pressed="${filter === value}">${label}</button>`).join('')}</div>
    </div>
    ${[1, 2].filter(subject => subset.some(u => u.subject === subject)).map(subject => `
      <div class="subject-group-label">科目${subject === 1 ? '一 · 生產與作業管理基礎' : '二 · 智慧製造生產線管理基礎'}</div>
      <div class="dashboard-unit-grid">${subset.filter(u => u.subject === subject).map(unit => `<a class="dashboard-unit ${state.passedUnits.includes(unit.id) ? 'passed' : ''}" href="#/unit/${unit.id}">
        <div class="dashboard-unit-meta"><span>${unit.id}</span><span>${state.passedUnits.includes(unit.id) ? '已通關' : '尚未通關'}</span></div>
        <h3>${esc(unit.title)}</h3><p>${esc(unit.room)} · 10 題練習</p>
        <div class="dashboard-unit-bottom"><span>${state.best[unit.id] !== undefined ? `最佳 ${state.best[unit.id]} 分` : '閱讀、練習與圖解'}</span>${icon('arrow')}</div>
      </a>`).join('')}</div>`).join('')}
    </section>${footer()}`;
  }
  window.FactoryDashboard = { render };
})();
