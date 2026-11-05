(function () {
  'use strict';
  const key = 'factory-exam-catalog-v1', size = 25;
  const state = { query: '', subject: 'all', notesOnly: false, page: 0 };
  let context;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(key));
    if (saved && typeof saved.query === 'string') state.query = saved.query.slice(0, 120);
    if (['all', 'L11', 'L12', 'L21', 'L22'].includes(saved?.subject)) state.subject = saved.subject;
    state.notesOnly = saved?.notesOnly === true;
    if (Number.isInteger(saved?.page) && saved.page >= 0 && saved.page < 8) state.page = saved.page;
  } catch {}
  const normalize = text => String(text).normalize('NFKC').trim().toLowerCase();
  function matches(question) {
    if (state.subject !== 'all' && question.subject !== state.subject || state.notesOnly && !question.hasNote) return false;
    const query = normalize(state.query);
    const id = query.match(/^(l(?:11|12|21|22))[\s-]*0*(\d+)$/);
    if (id) return normalize(question.subject) === id[1] && question.question === Number(id[2]);
    const number = query.match(/^(?:第\s*)?0*(\d+)\s*題?$/);
    if (number) return question.question === Number(number[1]);
    const text = normalize([question.id, question.concept, question.materialCode, context.DATA.studyMaterials.find(chapter => chapter.topicCode === question.materialCode)?.title].join(' '));
    return query.split(/\s+/).every(word => text.includes(word));
  }
  function results() {
    const { DATA, esc } = context;
    const questions = DATA.officialQuestions.filter(matches);
    state.page = Math.min(state.page, Math.max(0, Math.ceil(questions.length / size) - 1));
    const start = state.page * size, page = questions.slice(start, start + size);
    const count = questions.length ? `顯示 ${start + 1}–${start + page.length} / ${questions.length} 題` : '找不到符合的試題';
    return `<p id="exam-result-count" class="library-result" role="status" tabindex="-1">${count}</p>
      <div class="exam-result-list">${page.map(question => `<a class="exam-result" href="#/guide/questions/${question.id}" data-action="question-open" data-question="${question.id}">
        <span class="exam-result-number">${question.subject}<strong>第 ${question.question} 題</strong></span>
        <span class="exam-result-core">${esc(question.concept)}${question.hasNote ? '<small>有題目用語提醒</small>' : ''}</span><span aria-hidden="true">→</span>
      </a>`).join('')}</div>
      ${questions.length ? `<nav class="exam-list-pagination" aria-label="試題清單分頁"><button type="button" class="btn btn-small" data-action="question-page" data-page="${state.page - 1}" ${state.page === 0 ? 'disabled' : ''}>上一頁</button><span>第 ${state.page + 1} / ${Math.ceil(questions.length / size)} 頁</span><button type="button" class="btn btn-small" data-action="question-page" data-page="${state.page + 1}" ${start + size >= questions.length ? 'disabled' : ''}>下一頁</button></nav>` : '<div class="guide-empty"><p>試試題號、章節或核心關鍵字。</p><button type="button" class="btn btn-small" data-action="question-clear">清除篩選</button></div>'}`;
  }
  function persist() { try { window.sessionStorage.setItem(key, JSON.stringify(state)); } catch {} }
  function render(ctx) {
    context = ctx;
    const { DATA, esc } = ctx;
    return `<section class="exam-catalog" aria-labelledby="exam-catalog-title">
      <a class="reader-back" href="#/guide/materials">全部講義</a><div class="library-intro"><div><div class="eyebrow">115 年第一次 · 公告試題</div><h2 id="exam-catalog-title">從考題核心找到解題方向</h2><p>依原始題號查閱說明，再回到對應章節理解觀念。</p></div><span>${DATA.officialQuestions.length} 題</span></div>
      <div class="exam-search-tools"><div class="library-search"><label class="sr-only" for="exam-question-search">搜尋試題題號或考查核心</label><input id="exam-question-search" type="search" maxlength="120" placeholder="搜尋 L12-7、OEE 或章節名稱" value="${esc(state.query)}"></div>
      <label class="library-select"><span class="sr-only">試題科目</span><select id="exam-question-subject"><option value="all">全部科目</option>${DATA.officialSubjects.map(subject => `<option value="${subject.code}" ${subject.code === state.subject ? 'selected' : ''}>${subject.code} · ${esc(subject.title)}</option>`).join('')}</select></label>
      <label class="exam-note-filter"><input id="exam-question-notes" type="checkbox" ${state.notesOnly ? 'checked' : ''}>只看用語提醒</label></div>
      <div id="exam-results">${results()}</div></section>`;
  }
  function update(reset = false) {
    const host = document.getElementById('exam-results');
    if (!host) return;
    const search = document.getElementById('exam-question-search'), subject = document.getElementById('exam-question-subject'), notes = document.getElementById('exam-question-notes');
    state.query = reset ? '' : search.value; state.subject = reset ? 'all' : subject.value; state.notesOnly = reset ? false : notes.checked; state.page = 0;
    search.value = state.query; subject.value = state.subject; notes.checked = state.notesOnly;
    host.innerHTML = results(); persist();
    if (reset) search.focus();
  }
  function paginate(value) {
    if (!Number.isInteger(value) || value < 0 || value >= 8) return;
    state.page = value;
    document.getElementById('exam-results').innerHTML = results(); persist();
    const count = document.getElementById('exam-result-count'); count.focus({ preventScroll: true }); count.scrollIntoView({ block: 'nearest' });
  }
  window.FactoryQuestionCatalog = { render, update, paginate };
})();
