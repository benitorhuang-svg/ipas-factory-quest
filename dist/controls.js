(function () { 'use strict';
function bind(ctx) {
const { go, save, render, icon, esc, E, DATA, qmap, toast, modal, closeModal, poster, lightbox, openInteractive, openQuizHelper, start, updateQuizStatus, submit, exportProgress, importInput } = ctx;
document.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b || b.disabled) return;
    // Safari pointer activation does not focus buttons before opening a dialog.
    b.focus({ preventScroll: true });
    const a = b.dataset.action;
    switch (a) {
      case 'skip':
        e.preventDefault();
        document.getElementById('content').focus();
        break;
      case 'nav':
        closeModal();
        go(b.dataset.view);
        break;
      case 'unit':
        go('unit', b.dataset.unit);
        break;
      case 'filter':
        ctx.filter = b.dataset.filter === 'all' ? 'all' : Number(b.dataset.filter);
        render();
        break;
      case 'poster':
        poster(b.dataset.unit);
        break;
      case 'poster-file':
        lightbox(b.dataset.file, b.dataset.title || '分解結構圖');
        break;
      case 'lightbox':
        lightbox(b.dataset.src, b.dataset.title || '圖解檢視');
        break;
      case 'open-interactive':
        openInteractive(b.dataset.url, b.dataset.title || '互動式架構圖');
        break;
      case 'quiz-helper':
        openQuizHelper(b.dataset.unit);
        break;
      case 'exam-tab':
        go('exam', b.dataset.tab || 'quiz');
        break;
      case 'guide-tab':
        go('guide', b.dataset.tab, b.dataset.subtab || '');
        break;
      case 'reading-section': {
        e.preventDefault();
        const heading = document.getElementById(b.dataset.target);
        const disclosure = b.closest('details');
        if (disclosure && !window.matchMedia?.('(min-width: 1360px)').matches) disclosure.open = false;
        ctx.readingPosition.jump(heading);
        break;
      }
      case 'clear-library':
        window.FactoryGuide.filterCatalog(true);
        break;
      case 'close':
        closeModal();
        break;
      case 'retry-media':
        window.FactoryMedia.retry(b.closest('dialog') || document.getElementById('content'));
        break;
      case 'start':
        start(b.dataset.mode, b.dataset.unit || null, Number(b.dataset.subject) || null);
        break;
      case 'force-start':
        start(b.dataset.mode, b.dataset.unit || null, Number(b.dataset.subject) || null, true);
        break;
      case 'resume':
        closeModal();
        go('quiz');
        break;
      case 'review':
        start('review');
        break;
      case 'jump': {
        const question = document.getElementById('question-' + b.dataset.q);
        question?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
        question?.querySelector('h2')?.focus({ preventScroll: true });
        break;
      }
      case 'report':
        go('result', b.dataset.id);
        break;
      case 'export':
        exportProgress();
        break;
      case 'import':
        importInput.click();
        break;
      case 'reset':
        modal(`
          <button class="modal-close" data-action="close" aria-label="關閉">${icon('cross')}</button>
          <h2>要讓工廠重新開始嗎？</h2>
          <p>目前裝置的徽章、經驗、成績與未完成作答都會清除。建議先匯出進度備份。</p>
          <div class="button-row">
            <button class="btn btn-danger" data-action="confirm-reset">清除並重新開始</button>
            <button class="btn" data-action="close">保留進度</button>
          </div>
        `);
        break;
      case 'confirm-reset':
        if (!ctx.canEdit()) return;
        ctx.state = E.emptyState();
        ctx.lastReport = null;
        save();
        closeModal();
        go('home');
        toast('已重新開始。');
        break;
    }
  });
document.addEventListener('change', e => {
    if (e.target.id === 'library-group') window.FactoryGuide.filterCatalog();
    if (e.target.id === 'result-only-wrong') {
      document.querySelectorAll('.feedback-card.right').forEach(card => { card.hidden = e.target.checked; });
      const total = document.querySelectorAll('.feedback-card:not([hidden])').length;
      document.getElementById('result-count').textContent = `顯示 ${total} 題解析`;
    }
  });
document.addEventListener('input', e => {
    if (e.target.id === 'library-search') {
      window.FactoryGuide.filterCatalog();
      return;
    }
    if (e.target.id === 'glossary-input') {
      ctx.guideSearch = e.target.value;
      window.FactoryGuide.updateGlossary(DATA, ctx.guideSearch, esc);
      return;
    }
    const id = e.target.dataset.answer;
    if (!id || !ctx.state.active) return;
    if (!ctx.canEdit()) return;
    const q = qmap.get(id);
    if (!q) return;
    ctx.state.active.answers[id] = q.kind === 'choice' ? Number(e.target.value) : e.target.value;
    if (q.kind === 'number') ctx.saveSoon();
    else save();
    const err = document.getElementById('error-' + id);
    if (err) err.textContent = String(e.target.value).trim() && E.parseNumber(e.target.value) === null ? '請輸入數字；單位已標示在右側。' : '';
    updateQuizStatus();
  });
document.addEventListener('submit', e => {
    if (e.target.id === 'quiz-form') {
      e.preventDefault();
      submit();
    }
  });
}
window.FactoryControls = { bind };
})();
