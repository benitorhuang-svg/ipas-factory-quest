(function () {
  'use strict';
  let queue = Promise.resolve();
  let sequence = 0;
  let initialized = false;
  const sourceSelector = '.mermaid:not([data-diagram-state]), .language-mermaid:not([data-diagram-state])';

  function initialize() {
    if (initialized) return;
    window.mermaid.initialize({
      startOnLoad: false, securityLevel: 'loose', theme: 'base', htmlLabels: true,
      suppressErrorRendering: true,
      themeVariables: {
        fontFamily: '"Noto Sans TC", system-ui, sans-serif', fontSize: '16px',
        primaryColor: '#eef5e6', primaryTextColor: '#174b3e', primaryBorderColor: '#88a96f',
        lineColor: '#527c50', secondaryColor: '#f7f8f3', tertiaryColor: '#ffffff',
        actorBkg: '#eef5e6', actorBorder: '#88a96f', actorTextColor: '#174b3e',
        noteBkgColor: '#fff9e6', noteTextColor: '#7c5e10', noteBorderColor: '#e2ca70',
      },
      themeCSS: 'foreignObject > div { display:inline-block !important; width:max-content; max-width:280px; white-space:normal !important; overflow-wrap:normal; line-height:1.6; } .nodeLabel p { margin:0; }',
      flowchart: { curve: 'linear', nodeSpacing: 44, rankSpacing: 60, padding: 22, wrappingWidth: 280, useMaxWidth: false },
      sequence: { wrap: true, useMaxWidth: false, width: 190, actorMargin: 56, messageMargin: 44 },
    });
    initialized = true;
  }

  function readSource(block) {
    const decoder = document.createElement('textarea');
    decoder.innerHTML = block.innerHTML.trim();
    // Keep native Mermaid labels intact, including parentheses and quoted links.
    return decoder.value.replace(/\r\n?/g, '\n').trim();
  }

  function makeFrame(svg, block) {
    const frame = document.createElement('figure');
    frame.className = 'study-diagram';
    frame.dataset.noTerminology = 'true';
    frame.innerHTML = '<figcaption class="diagram-toolbar"><span>重點圖解 · 可橫向捲動</span><button type="button">放大閱讀</button></figcaption><div class="diagram-viewport" tabindex="0" role="region" aria-label="可捲動的重點圖解"><div class="mermaid-rendered"></div></div>';
    const graphic = frame.querySelector('.mermaid-rendered');
    graphic.innerHTML = svg;
    const image = graphic.querySelector('svg');
    if (image) {
      const box = image.getAttribute('viewBox')?.trim().split(/[ ,]+/).map(Number);
      const width = box?.[2] || parseFloat(image.getAttribute('width')) || 640;
      image.style.width = `${Math.max(width, 320)}px`;
      image.style.maxWidth = 'none';
      image.style.height = 'auto';
      image.setAttribute('role', 'img');
      image.setAttribute('aria-label', '教材重點圖解');
    }
    frame.querySelector('button').addEventListener('click', event => {
      const trigger = event.currentTarget;
      trigger.focus({ preventScroll: true });
      const dialog = document.createElement('dialog');
      dialog.className = 'diagram-dialog';
      const close = document.createElement('button');
      close.type = 'button'; close.className = 'btn'; close.textContent = '關閉圖解';
      const title = document.createElement('h2'); title.textContent = '放大閱讀圖解';
      const viewport = document.createElement('div'); viewport.className = 'diagram-viewport';
      // Move the actual graphic so SVG IDs and fragment references stay unique.
      const marker = document.createComment('diagram-position');
      graphic.before(marker); viewport.append(graphic);
      title.id = `diagram-dialog-title-${++sequence}`;
      dialog.setAttribute('aria-labelledby', title.id);
      dialog.append(title, close, viewport); document.body.append(dialog);
      close.addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => { marker.replaceWith(graphic); dialog.remove(); if (trigger.isConnected) trigger.focus({ preventScroll: true }); });
      dialog.showModal(); close.focus();
    });
    (block.closest('.mermaid-block') || block.closest('pre') || block).replaceWith(frame);
  }

  async function render(root) {
    const blocks = [...root.querySelectorAll(sourceSelector)];
    if (!blocks.length) return;
    if (!window.mermaid) {
      for (const block of blocks) showError(block, '圖解引擎尚未載入，請重新整理頁面。');
      return;
    }
    await document.fonts?.ready;
    initialize();
    for (const block of blocks) {
      if (!block.isConnected || !root.contains(block)) continue;
      block.dataset.diagramState = 'rendering';
      const id = `study-mermaid-${++sequence}`;
      try {
        const { svg } = await window.mermaid.render(id, readSource(block));
        if (block.isConnected) makeFrame(svg, block);
      } catch (error) {
        document.getElementById(id)?.remove();
        document.getElementById(`d${id}`)?.remove();
        if (block.isConnected) showError(block, '圖解暫時無法顯示，可展開查看文字來源。');
        console.warn('Study diagram render error:', error);
      }
    }
  }

  function showError(block, message) {
    block.dataset.diagramState = 'error';
    const details = document.createElement('details');
    details.className = 'diagram-error';
    const summary = document.createElement('summary'); summary.textContent = message;
    const source = document.createElement('pre'); source.textContent = readSource(block);
    details.append(summary, source);
    (block.closest('.mermaid-block') || block).replaceWith(details);
  }

  window.FactoryDiagrams = {
    readSource,
    render(root = document) {
      const job = queue.then(() => render(root));
      queue = job.catch(error => console.warn('Study diagrams initialization failed:', error));
      return job;
    },
  };
  if (window.mermaid) initialize();
})();
