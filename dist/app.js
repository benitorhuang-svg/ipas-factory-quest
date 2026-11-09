(function () {
  'use strict';
  const DATA = window.FACTORY_QUEST_DATA;
  const E = window.FactoryEngine;
  const KEY = 'factory-quest-ipas-v1';
  const app = document.getElementById('app');
  const { esc, icon, fmt, footer, modeName } = window.FactoryUI;
  const units = DATA.units;
  const bank = DATA.questions;
  let toastTimer, enhancementTimer, renderToken = 0, previousPath = null;
  const scrollPositions = new Map();
  const ctx = {
    DATA, E, units, bank, esc, icon, fmt, footer, modeName,
    qmap: new Map(bank.map(question => [question.id, question])),
    topicList: (DATA.studyMaterials || []).map(material => material.topicCode),
    byUnit: id => units.find(unit => unit.id === id),
    filter: 'all', guideSearch: '', lastReport: null,
    state: E.emptyState(), go, save, toast, render,
    home: () => window.FactoryDashboard.render(ctx),
  };
  try { ctx.state = E.restore(JSON.parse(localStorage.getItem(KEY)), bank); }
  catch { ctx.state = E.emptyState(); }
  const persistence = window.FactoryPersistence.create({ key: KEY, notify: toast, onRemote: value => {
    try { ctx.state = E.restore(JSON.parse(value), bank); ctx.lastReport = null; render(); } catch { toast('其他分頁的進度無法讀取，已保留目前資料。'); }
  } });
  ctx.canEdit = persistence.canEdit;
  ctx.saveSoon = () => persistence.schedule(ctx.state);
  Object.assign(ctx, window.FactoryDialogs.create(ctx));
  Object.assign(ctx, window.FactorySession.create(ctx));
  Object.assign(ctx, window.FactoryProgressStore.create(ctx));
  ctx.readingPosition = window.FactoryReadingPosition.create(ctx.topicList);

  function save() {
    return persistence.save(ctx.state);
  }
  function route() {
    const [view = 'home', arg = '', subArg = ''] = location.hash.replace(/^#\/?/, '').split('/');
    const kind = view || 'home';
    return { view: kind, arg: arg || ({ guide: 'materials', atlas: 'all', exam: 'quiz' }[kind] || ''), subArg };
  }
  function go(view, arg = '', subArg = '') {
    persistence.flush();
    const hash = '#/' + [view, arg, subArg].filter(Boolean).join('/');
    if (location.hash === hash) render();
    else location.hash = hash;
  }
  function toast(message) {
    document.querySelector('.toast')?.remove();
    clearTimeout(toastTimer);
    const element = document.createElement('div');
    element.className = 'toast';
    element.setAttribute('role', 'status');
    element.textContent = message;
    document.body.append(element);
    toastTimer = setTimeout(() => element.remove(), 3600);
  }
  function enhance(token) {
    window.FactoryMath.render();
    if (app.querySelector('.math-block, .math-inline')) {
      const pending = app.querySelector('.math-block:not([data-math-done="katex"]), .math-inline:not([data-math-done="katex"])');
      const loading = pending || !window.FactoryAssets.katexStyles ? window.FactoryAssets.katex() : window.FactoryAssets.katexStyles();
      loading.then(() => {
        if (token !== renderToken) return;
        window.FactoryMath.render(); ctx.readingPosition.refresh();
      }).catch(() => {});
    }
    if (app.querySelector('.mermaid, .language-mermaid')) {
      if (token === renderToken) window.FactoryDiagrams.render(app).then(() => {
        if (token === renderToken) ctx.readingPosition.refresh();
      }).catch(() => {});
    }
  }
  function render() {
    const r = route();
    if (r.view === 'guide') {
      if (['diagrams', 'interactive'].includes(r.arg)) { go('atlas', 'overview'); return; }
      if (r.arg === 'pdfs') { go('exam', 'pdfs'); return; }
      if (r.arg === 'materials' && ['APPX01', 'APPX02'].includes(r.subArg)) {
        go('guide', r.subArg === 'APPX01' ? 'formulas' : 'traps'); return;
      }
    }
    if (r.view === 'unit' && !ctx.byUnit(r.arg)) { go('home'); return; }
    if (r.view === 'result' && !ctx.state.history.length && !ctx.lastReport) { go('home'); return; }
    const views = {
      home: ctx.home,
      atlas: () => window.FactoryAtlas.render(ctx, r.arg),
      unit: () => window.FactoryUnit.render(ctx, r.arg),
      repair: () => window.FactoryReview.render(ctx),
      guide: () => window.FactoryGuide.render({ ...ctx, subView: r.arg || 'materials', selectedTopic: r.subArg }),
      exam: () => window.FactoryExam.render(ctx, r.arg),
      progress: () => window.FactoryProgress.render(ctx),
      quiz: () => window.FactoryQuiz.render(ctx),
      result: () => window.FactoryQuiz.result(ctx, r.arg),
    };
    if (!views[r.view]) { go('home'); return; }
    const path = [r.view, r.arg, r.subArg].join('/');
    const changed = previousPath !== path;
    const focus = document.activeElement;
    const focusId = focus?.id;
    const filterValue = focus?.dataset?.action === 'filter' ? focus.dataset.filter : null;
    if (changed && previousPath) scrollPositions.set(previousPath, window.scrollY);
    ctx.readingPosition.unmount();
    ctx.closeModal(false);
    document.querySelectorAll('.diagram-dialog').forEach(dialog => dialog.close());
    app.innerHTML = window.FactoryShell.render({
      body: views[r.view](), view: r.view, route: r, icon, esc,
      pageTitle: r.view === 'unit' ? ctx.byUnit(r.arg)?.title : r.view === 'quiz' && !ctx.state.active ? '練習任務' : '',
      wrongCount: E.reviewIds(ctx.state, bank).length,
    });
    window.FactoryGuide.mount();
    window.FactoryMaterials.mount(ctx);
    window.FactoryOffline.mount();
    const title = { home: '工廠總覽', repair: '到期複習', atlas: '複習圖鑑', guide: '備考寶典', exam: '考前模擬', progress: '成長紀錄', unit: ctx.byUnit(r.arg)?.title, quiz: '任務挑戰', result: '任務報告' }[r.view];
    document.title = `${title}｜智造闖關 Factory Quest`;
    if (r.view === 'quiz') { ctx.updateQuizStatus(); ctx.tick(); }
    if (changed && previousPath) {
      document.getElementById('content').focus({ preventScroll: true });
      const returningToLibrary = /^guide\/materials\//.test(previousPath) && /^guide\/(materials)?\/$/.test(path)
        || /^guide\/questions\/.+/.test(previousPath) && path === 'guide/questions/';
      const returningToPractice = path === 'progress//' && /^(quiz|result)\//.test(previousPath);
      window.scrollTo({ top: returningToLibrary || returningToPractice ? scrollPositions.get(path) || 0 : 0, behavior: 'instant' });
    } else if (!changed) {
      const target = filterValue !== null ? document.querySelector(`[data-action="filter"][data-filter="${filterValue}"]`) : document.getElementById(focusId);
      target?.focus({ preventScroll: true });
    }
    previousPath = path;
    ctx.readingPosition.mount();
    window.FactoryQuestions.restore(ctx);
    clearTimeout(enhancementTimer);
    const token = ++renderToken;
    enhancementTimer = setTimeout(() => enhance(token), 0);
  }

  window.FactoryControls.bind(ctx);
  window.FactoryMedia.bind();
  window.addEventListener('hashchange', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ctx.tick(); });
  window.addEventListener('pageshow', ctx.tick);
  setInterval(ctx.tick, 1000);
  render();
})();
