(function () {
  'use strict';
  const preparedMaterials = new WeakMap();

  function prepare(details) {
    const template = document.createElement('template');
    template.innerHTML = details || '<p>講義內容準備中。</p>';
    template.content.querySelector('h1')?.remove();
    for (const image of template.content.querySelectorAll('img[src]')) {
      const source = image.getAttribute('src');
      const preview = window.FactoryPreviews?.[source];
      if (!preview) continue;
      image.src = preview.src;
      image.width = preview.width;
      image.height = preview.height;
      image.loading = 'lazy';
      image.decoding = 'async';
      if (image.closest('a, button')) continue;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'reader-image-button';
      button.dataset.action = 'lightbox'; button.dataset.src = source;
      button.dataset.title = image.alt || '教材高解析圖解';
      button.setAttribute('aria-label', `放大閱讀：${button.dataset.title}`);
      button.title = '點選開啟高解析原圖';
      image.replaceWith(button); button.append(image);
    }
    const headings = [...template.content.querySelectorAll('h2, h3')];
    const level = headings.some(h => h.tagName === 'H2') ? 'H2' : 'H3';
    const sections = headings.filter(h => h.tagName === level).map((heading, index) => {
      heading.id = `reading-section-${index}`;
      heading.tabIndex = -1;
      return { id: heading.id, title: heading.textContent };
    });
    for (const table of template.content.querySelectorAll('table')) {
      const wrap = document.createElement('div');
      wrap.className = 'reader-table';
      wrap.tabIndex = 0;
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', '教材表格，可左右捲動');
      table.replaceWith(wrap);
      wrap.append(table);
    }
    // Keep outline anchors outside layout containment: measuring a heading must
    // not force the browser to render its entire offscreen section.
    let chunk = document.createElement('section');
    chunk.className = 'reader-chunk';
    const children = [...template.content.childNodes];
    template.content.prepend(chunk);
    for (const node of children) {
      if (node.nodeType === 1 && node.tagName === level) {
        chunk = document.createElement('section'); chunk.className = 'reader-chunk';
        node.after(chunk);
        continue;
      }
      chunk.append(node);
    }
    return { html: template.innerHTML, sections };
  }

  function render({ material, materials, units, topicList, icon, esc, reference = false }) {
    if (!material) return '<p class="guide-empty" role="status">找不到這篇講義，請從講義目錄重新選擇。</p>';
    if (!material.details) return `<div class="guide-empty" role="status" data-material-loading="${esc(material.topicCode)}">正在載入 ${esc(material.title)}…</div>`;
    const unit = units.find(u => u.topicCode === material.topicCode || u.id === material.unitId);
    let prepared = preparedMaterials.get(material);
    if (!prepared || prepared.source !== material.details) {
      prepared = { ...prepare(material.details), source: material.details };
      preparedMaterials.set(material, prepared);
    }
    const readingList = topicList.filter(code => !['APPX01', 'APPX02'].includes(code));
    const index = readingList.indexOf(material.topicCode);
    const adjacent = (offset, label) => {
      const code = readingList[index + offset];
      const next = materials.find(m => m.topicCode === code);
      return next ? `<a class="reader-next" href="#/guide/materials/${esc(code)}">
        <small>${label}</small><strong>${esc(next.title)}</strong>${icon(offset > 0 ? 'arrow' : 'back')}
      </a>` : '<span></span>';
    };
    return `
      <div class="reading-page ${reference ? 'reading-page--reference' : ''}" data-reading-key="${esc(material.topicCode)}">
        ${!reference ? `<a class="reader-back" href="#/guide/materials">${icon('back')}全部講義<span>${index + 1} / ${readingList.length}</span></a>` : ''}
        <header class="reader-heading">
          <div class="eyebrow">${reference ? 'QUICK REFERENCE' : esc(unit?.id || material.topicCode)} · ${reference ? '考前重點整理' : '精讀講義'}</div>
          <h2>${esc(material.title)}</h2>
          <p>${esc(material.summary || '掌握核心觀念，連結現場情境與考試重點。')}</p>
          ${!reference && material.coreConcepts?.length ? `<div class="reader-concepts">${material.coreConcepts.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}
          ${unit && !reference ? `<button class="reader-practice" data-action="unit" data-unit="${esc(unit.id)}">${icon('flag')}本章練習${icon('arrow')}</button>` : ''}
        </header>
        <div class="reader-body"><aside class="reader-tools" aria-label="本章閱讀工具">
          ${prepared.sections.length ? `<details class="reader-disclosure reader-sections">
            <summary>${icon('route')}本章段落<span>${prepared.sections.length} 節</span>${icon('chevrondown')}</summary>
            <nav class="reader-outline" aria-label="本章段落">${prepared.sections.map((section, i) => `
              <button data-action="reading-section" data-target="${section.id}"><small>${String(i + 1).padStart(2, '0')}</small>${esc(section.title)}</button>
            `).join('')}</nav>
          </details>` : ''}
          ${!reference && (material.diagram3D || material.explainerImg || material.interactiveUrl) ? `<details class="reader-disclosure reader-visuals">
            <summary>${icon('network')}本章圖解<span>展開查看</span>${icon('chevrondown')}</summary>
            <div class="reader-visual-links">
              ${material.interactiveUrl ? `<button class="btn btn-small" data-action="open-interactive" data-url="${esc(material.interactiveUrl)}" data-title="${esc(material.title)} 互動架構圖">${icon('network')}互動架構圖</button>` : ''}
              ${material.diagram3D || material.explainerImg ? `<button class="btn btn-small" data-action="lightbox" data-src="${esc(material.diagram3D || material.explainerImg)}" data-title="${esc(material.title)} 圖解">${icon('eye')}放大圖解</button>` : ''}
            </div>
          </details>` : ''}
        </aside><div class="reader-main">
        <article class="material-content reader-article">${prepared.html}
          ${material.topicCode === 'APPX02' ? `<details class="reader-supplements"><summary>補充辨析：SPC、MRP 與通訊協定</summary>${window.FactoryGuideNotes(icon)}</details>` : ''}
        </article>
        ${!reference ? `<nav class="reader-pagination" aria-label="講義前後篇">${adjacent(-1, '上一篇')}${adjacent(1, '下一篇')}</nav>` : ''}
        </div></div>
      </div>`;
  }

  window.FactoryReading = { render };
})();
