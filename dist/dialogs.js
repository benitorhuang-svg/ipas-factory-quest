(function () {
  'use strict';
  function create({ DATA, byUnit, icon, esc }) {
    let current = null;
    function dispose(record, restore) {
      if (!record || record.done) return;
      record.done = true;
      record.dialog.remove();
      if (current === record) current = null;
      if (restore && record.trigger?.isConnected) record.trigger.focus({ preventScroll: true });
    }
    function closeModal(restore = true) {
      if (!current) return;
      const record = current;
      if (record.dialog.open) record.dialog.close();
      dispose(record, restore);
    }
    function modal(content, className = '', label = '學習工具') {
      const trigger = current?.trigger || document.activeElement;
      closeModal(false);
      const dialog = document.createElement('dialog');
      dialog.id = 'modal';
      dialog.className = className;
      dialog.innerHTML = content;
      const title = dialog.querySelector('h2, .dialog-title, .poster-toolbar strong');
      if (title) {
        title.id = 'modal-title';
        dialog.setAttribute('aria-labelledby', title.id);
      } else dialog.setAttribute('aria-label', label);
      const record = { dialog, trigger, done: false };
      current = record;
      document.body.append(dialog);
      dialog.addEventListener('close', () => dispose(record, true));
      dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const box = dialog.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeModal();
      });
      dialog.showModal();
      (dialog.querySelector('[data-action="close"]') || dialog.querySelector('button, a'))?.focus();
      return dialog;
    }
    function toolbar(title, url) {
      return `<header class="media-toolbar"><h2>${esc(title)}</h2><div class="media-actions"><a class="btn btn-small" href="${esc(url)}" target="_blank" rel="noopener">${icon('external')}獨立開啟</a><button class="modal-close" data-action="close" aria-label="關閉視窗">${icon('cross')}</button></div></header>`;
    }
    function lightbox(src, title = '高解析圖解') {
      modal(`${toolbar(title, src)}<div class="media-image"><img src="${esc(src)}" alt="${esc(title)}" decoding="async"></div>`, 'media-dialog', title);
    }
    function poster(id) {
      const unit = byUnit(id);
      if (unit) lightbox(`assets/${id}.png`, `${id} ${unit.title} · 架構分解圖`);
    }
    function openInteractive(url, title = '互動式架構圖') {
      const fullUrl = url + (url.includes('?') ? '&' : '?') + 'embed=1';
      modal(`${toolbar(title, url)}<iframe class="media-frame" src="${esc(fullUrl)}" title="${esc(title)}" allowfullscreen></iframe>`, 'media-dialog media-dialog--interactive', title);
    }
    function openQuizHelper(id) {
      const unit = byUnit(id);
      if (!unit) return;
      const material = (DATA.studyMaterials || []).find(m => m.topicCode === unit.topicCode);
      modal(`<button class="modal-close" data-action="close" aria-label="關閉重點">${icon('cross')}</button>
        <div class="eyebrow">${esc(id)} · 單元重點</div><h2>${esc(unit.title)}</h2>
        <p>${esc(material?.summary || unit.takeaway)}</p>
        <ul class="topic-list">${unit.topics.map(topic => `<li>${icon('check')}${esc(topic)}</li>`).join('')}</ul>
        <div class="button-row"><button class="btn btn-primary" data-action="guide-tab" data-tab="materials" data-subtab="${unit.topicCode}">閱讀完整講義${icon('arrow')}</button><button class="btn" data-action="poster" data-unit="${id}">架構圖</button></div>`, 'helper-dialog');
    }
    return { modal, closeModal, lightbox, poster, openInteractive, openQuizHelper };
  }
  window.FactoryDialogs = { create };
})();
