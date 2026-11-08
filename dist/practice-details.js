(function () {
  'use strict';
  const key = 'factory-practice-details-v1', size = 20;
  const filters = { query: '', unit: 'all', status: 'all', page: 0 };
  const statuses = { all: '全部狀態', practiced: '已練習', unseen: '未練習', wrong: '最近答錯', correct: '最近答對' };
  let context;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(key));
    if (typeof saved?.query === 'string') filters.query = saved.query.slice(0, 120);
    if (saved?.unit === 'all' || window.FactoryEngine.UNITS.includes(saved?.unit)) filters.unit = saved.unit;
    if (Object.hasOwn(statuses, saved?.status)) filters.status = saved.status;
    if (Number.isInteger(saved?.page) && saved.page >= 0 && saved.page < 100) filters.page = saved.page;
  } catch {}
  const normalize = text => String(text).normalize('NFKC').trim().toLowerCase();
  function rows() {
    const { E, state, bank } = context;
    const entries = new Map(E.reviewEntries(state, bank)), { unique, aliases } = E.catalog(bank);
    const query = normalize(filters.query), alias = aliases.get(query.toUpperCase());
    return unique.map(q => {
      const entry = entries.get(q.id), attempts = entry?.attempts || 0, correct = entry?.correctCount || 0;
      return { q, attempts, correct, wrong: attempts - correct, status: attempts ? (entry.lastCorrect ? 'correct' : 'wrong') : 'unseen' };
    }).filter(row => {
      if (filters.unit !== 'all' && row.q.unit !== filters.unit) return false;
      if (filters.status === 'practiced' ? !row.attempts : filters.status !== 'all' && row.status !== filters.status) return false;
      const title = context.units.find(unit => unit.id === row.q.unit)?.title || '';
      const text = normalize(`${row.q.id} ${row.q.unit} ${title} ${row.q.stem}`);
      return row.q.id === alias || query.split(/\s+/).every(word => text.includes(word));
    });
  }
  function results() {
    const { esc, fmt } = context, matches = rows();
    const pages = Math.max(1, Math.ceil(matches.length / size));
    filters.page = Math.min(filters.page, pages - 1);
    const start = filters.page * size, page = matches.slice(start, start + size);
    return `<p id="practice-detail-count" role="status" tabindex="-1">${matches.length ? `顯示 ${start + 1}–${start + page.length}／${matches.length} 題` : '找不到符合條件的題目'}</p>
      <ol class="practice-question-list" start="${start + 1}">${page.map(row => `<li class="practice-question-card" data-practice-question="${esc(row.q.id)}">
        <div><div class="practice-question-meta">${esc(row.q.id)} · ${esc(context.units.find(unit => unit.id === row.q.unit)?.title || row.q.unit)}</div><h3>${esc(row.q.stem)}</h3></div>
        <dl class="practice-question-counts"><div><dt>練習次數</dt><dd>${fmt(row.attempts)}<small> 次</small></dd></div><div><dt>答對</dt><dd>${fmt(row.correct)}<small> 次</small></dd></div><div><dt>答錯</dt><dd>${fmt(row.wrong)}<small> 次</small></dd></div><div><dt>最近結果</dt><dd><span class="practice-status practice-status--${row.status}">${statuses[row.status]}</span></dd></div></dl>
      </li>`).join('')}</ol>
      ${matches.length ? `<nav class="practice-detail-pagination" aria-label="逐題練習明細分頁"><button class="btn btn-small" data-action="practice-page" data-page="${filters.page - 1}" ${filters.page === 0 ? 'disabled' : ''}>上一頁</button><span>第 ${filters.page + 1}／${pages} 頁</span><button class="btn btn-small" data-action="practice-page" data-page="${filters.page + 1}" ${filters.page + 1 >= pages ? 'disabled' : ''}>下一頁</button></nav>` : '<button class="btn btn-small" data-action="practice-clear">清除篩選</button>'}`;
  }
  function persist() { try { window.sessionStorage.setItem(key, JSON.stringify(filters)); } catch {} }
  function render(ctx) {
    context = ctx;
    const { units, esc } = ctx;
    return `<details class="panel practice-details" open><summary>逐題練習明細</summary>
      <p class="backup-note">查看每道題的累計練習、答對與答錯次數，以及最近一次作答結果。只計已交卷紀錄，相同內容合併顯示。</p>
      <div class="practice-detail-tools"><div class="practice-detail-field"><label for="practice-detail-search">搜尋題目</label><input id="practice-detail-search" type="search" maxlength="120" placeholder="輸入題號或題目關鍵字" value="${esc(filters.query)}"></div>
        <div class="practice-detail-field"><label for="practice-detail-unit">單元</label><select id="practice-detail-unit"><option value="all">全部單元</option>${units.map(unit => `<option value="${unit.id}" ${unit.id === filters.unit ? 'selected' : ''}>${unit.id} · ${esc(unit.title)}</option>`).join('')}</select></div>
        <div class="practice-detail-field"><label for="practice-detail-status">作答狀態</label><select id="practice-detail-status">${Object.entries(statuses).map(([value, label]) => `<option value="${value}" ${value === filters.status ? 'selected' : ''}>${label}</option>`).join('')}</select></div>
        <button class="btn btn-small" data-action="practice-clear">清除篩選</button></div>
      <div id="practice-detail-results">${results()}</div></details>`;
  }
  function update(reset = false) {
    const host = document.getElementById('practice-detail-results');
    if (!host) return;
    const search = document.getElementById('practice-detail-search'), unit = document.getElementById('practice-detail-unit'), status = document.getElementById('practice-detail-status');
    filters.query = reset ? '' : search.value; filters.unit = reset ? 'all' : unit.value; filters.status = reset ? 'all' : status.value; filters.page = 0;
    search.value = filters.query; unit.value = filters.unit; status.value = filters.status;
    host.innerHTML = results(); persist();
    if (reset) search.focus();
  }
  function paginate(page) {
    const host = document.getElementById('practice-detail-results');
    if (!host || !Number.isInteger(page) || page < 0 || page >= Math.ceil(rows().length / size)) return;
    filters.page = page;
    host.innerHTML = results(); persist();
    const count = document.getElementById('practice-detail-count');
    count.focus({ preventScroll: true }); count.scrollIntoView({ block: 'nearest' });
  }
  window.FactoryPracticeDetails = { render, update, paginate };
})();
