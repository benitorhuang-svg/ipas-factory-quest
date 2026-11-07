(function () {
  'use strict';
  const originKey = 'factory-exam-origin-v1';
  let origin = null, pendingReturn = null;
  const valid = value => value && /^L(?:11|12|21|22)-\d{1,2}$/.test(value.question) && /^M\d{5}$/.test(value.material);
  try { const saved = JSON.parse(window.sessionStorage.getItem(originKey)); if (valid(saved)) origin = saved; } catch {}
  function remember(question, material) {
    origin = valid({ question, material }) ? { question, material } : null;
    try { window.sessionStorage.setItem(originKey, JSON.stringify(origin)); } catch {}
  }
  function returnTo(question, material) { if (valid({ question, material })) pendingReturn = { question, material }; }
  function restore(ctx) {
    if (!pendingReturn || location.hash !== `#/guide/materials/${pendingReturn.material}`) return;
    const row = document.getElementById(`exam-core-${pendingReturn.question}`);
    if (!row) return;
    pendingReturn = null;
    ctx.readingPosition.jump(row);
  }
  function render(ctx) {
    const { DATA, selectedTopic, esc } = ctx;
    if (!selectedTopic) return window.FactoryQuestionCatalog.render(ctx);
    const question = DATA.officialQuestions.find(item => item.id === selectedTopic);
    if (!question) return '<div class="guide-empty"><h2>找不到這道試題</h2><p>請依公告原始題號重新選擇。</p><a class="btn" href="#/guide/questions">返回試題說明</a></div>';
    const chapter = DATA.studyMaterials.find(material => material.topicCode === question.materialCode);
    const subject = DATA.officialSubjects.find(subject => subject.code === question.subject);
    const payload = chapter.questions?.[question.id];
    const own = DATA.officialQuestions.filter(item => item.subject === question.subject), index = own.indexOf(question);
    const adjacent = (offset, label) => {
      const next = own[index + offset];
      return next ? `<a class="reader-next" href="#/guide/questions/${next.id}"><small>${label} · 第 ${next.question} 題</small><strong>${esc(next.concept)}</strong></a>` : '<span></span>';
    };
    const chapterLink = (id, code, title) => `<a class="btn btn-small" data-action="question-return" data-question="${id}" data-material="${code}" href="#/guide/materials/${code}">${esc(title)}</a>`;
    const returnLink = origin && DATA.studyMaterials.some(material => material.topicCode === origin.material) ? chapterLink(origin.question, origin.material, '返回原章節位置') : '';
    const notes = payload ? payload.noteIds.map(id => chapter.notes[id]).filter(Boolean) : [];
    const content = payload ? `<div class="exam-answer"><span>公告答案</span><strong>${question.officialAnswer}</strong><p>以本題條件與公告選項為準</p></div>
      ${payload.note ? `<aside class="exam-caveat" aria-label="題目用語提醒"><strong>題目用語與適用界線</strong><p>${esc(payload.note)}</p></aside>` : ''}
      ${payload.details}
      ${notes.length ? `<details class="exam-context"><summary>相關情境與原段落補充<span>${notes.length} 則</span></summary><p class="muted">保留相關題目的共同情境，供需要時延伸對照。</p>${notes.map(note => `<section><h4>${esc(DATA.studyMaterials.find(material => material.topicCode === note.materialCode)?.title || '')} · ${esc(note.heading)}</h4>${note.html.startsWith('<li') ? `<ul>${note.html}</ul>` : note.html}</section>`).join('')}</details>` : ''}` : `<div data-material-loading="${chapter.topicCode}" role="status">載入本題說明…</div>`;
    return `<div class="reading-page exam-reading"><a class="reader-back" href="#/guide/questions">全部公告試題說明</a>
      <header class="reader-heading"><div class="eyebrow">${question.subject} · 115 年第一次 · 第 ${question.question} 題</div><h2 id="exam-question-title">${esc(question.concept)}</h2><p>連結考查核心、解題步驟與本章知識。</p>
      <div class="button-row">${returnLink}${chapterLink(question.id, question.materialCode, `本題章節：${chapter.title}`)}<a class="btn btn-small" href="${esc(subject.source)}#page=${question.sourcePage}" target="_blank" rel="noopener">對照公告試題 PDF · 第 ${question.sourcePage} 頁</a>${chapter.unitId ? `<a class="btn btn-small" href="#/unit/${chapter.unitId}">本章練習</a>` : ''}</div></header>
      <article class="reader-article material-content" aria-labelledby="exam-question-title">${content}</article>
      <div class="exam-question-jump"><label for="exam-question-jump">${question.subject} 題號</label><select id="exam-question-jump">${own.map(item => `<option value="${item.id}" ${item.id === question.id ? 'selected' : ''}>第 ${item.question} 題 · ${esc(item.concept)}</option>`).join('')}</select></div>
      <nav class="reader-pagination" aria-label="同科試題導覽">${adjacent(-1, '上一題')}${adjacent(1, '下一題')}</nav></div>`;
  }
  window.FactoryQuestions = { render, remember, returnTo, restore };
})();
