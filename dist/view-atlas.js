(function () {
  'use strict';
  function render({ DATA, units, esc, icon, footer }, requested = 'all') {
    const filter = ['all', 's1', 's2', 'overview'].includes(requested) ? requested : 'all';
    const assets = DATA.visualAssets || {};
    const overviews = [
      { title: 'ISA-95 智慧工廠五層架構', label: '互動全景', desc: '從 ERP、MES 到控制與現場設備，理解五層工廠的連結。', image: 'assets/learning-units/07_智慧製造概論與ISA95架構_3D.png', url: assets.isa95Interactive || 'assets/interactive-diagrams/isa95-smart-factory.html' },
      { title: '23 單元互動架構總覽', label: '章節閱讀器', desc: '初級、實作與中級教材的互動架構索引。', image: 'assets/S1_Overview.png', url: 'assets/interactive-diagrams/unit-summaries/index.html' },
      { title: '智慧生產工程師職能全景', label: '3D 職能圖', desc: '連結生產管理與智動化現場的核心能力。', image: 'assets/infographics/智慧生產工程師職能-分解爆炸圖-imagegen-3D-v2.png' },
      { title: '科目一全科架構', label: '生產與作業管理', desc: '整合排程、物料、工時、品質與精實管理。', image: 'assets/S1_Overview.png' },
      { title: '科目二全科架構', label: '智慧製造產線', desc: '整合 IIoT、AI、CPS、設備與 MES 現場管理。', image: 'assets/S2_Overview.png' },
    ];
    const overviewGrid = () => `<div class="atlas-overview-grid">${overviews.map(item => `<button type="button" class="atlas-overview diagram-hub-card" data-action="${item.url ? 'open-interactive' : 'lightbox'}" ${item.url ? `data-url="${esc(item.url)}"` : `data-src="${esc(item.image)}"`} data-title="${esc(item.title)}">
      <span class="atlas-overview-image"><img ${window.FactoryUI.preview(item.image)} alt=""></span><span class="atlas-overview-copy"><small>${item.label}</small><strong>${item.title}</strong><span>${item.desc}</span><span class="atlas-overview-open">${item.url ? '開啟互動圖' : '放大閱讀'}${icon('arrow')}</span></span>
    </button>`).join('')}</div>`;
    const selected = units.filter(unit => filter === 's1' ? unit.subject === 1 : filter === 's2' ? unit.subject === 2 : true);
    const cards = selected.map(unit => `<article class="atlas-unit unit-atlas-card">
      <header class="atlas-unit-heading"><span>${unit.id} · 科目${unit.subject === 1 ? '一' : '二'}</span><h3>${esc(unit.title)}</h3><p>${esc(unit.takeaway)}</p></header>
      <div class="atlas-unit-previews">
        <button type="button" data-action="poster" data-unit="${unit.id}" aria-label="放大 ${esc(unit.title)} 架構圖"><img ${window.FactoryUI.preview(`assets/${unit.id}.png`)} alt=""><span>架構圖${icon('eye')}</span></button>
        ${unit.diagram3D ? `<button type="button" data-action="lightbox" data-src="${esc(unit.diagram3D)}" data-title="${esc(unit.title)} 3D 圖解" aria-label="放大 ${esc(unit.title)} 3D 圖解"><img ${window.FactoryUI.preview(unit.diagram3D)} alt=""><span>3D 圖解${icon('eye')}</span></button>` : ''}
      </div>
      <div class="atlas-unit-actions">${unit.interactiveUrl ? `<button type="button" class="atlas-interactive" data-action="open-interactive" data-url="${esc(unit.interactiveUrl)}" data-title="${esc(unit.title)} 互動架構圖">${icon('network')}互動架構圖${icon('arrow')}</button>` : ''}<div><a href="#/guide/materials/${unit.topicCode}">精讀講義</a><a href="#/unit/${unit.id}">單元練習</a></div></div>
    </article>`).join('');
    return `<section class="atlas-content" aria-label="圖鑑內容">
      ${filter !== 'overview' ? `<header class="atlas-heading"><div><h2>${filter === 's1' ? '生產與作業管理基礎' : filter === 's2' ? '智慧製造生產線管理基礎' : '單元圖鑑'}</h2><p>看架構、讀圖解，再連結到講義與練習。</p></div><span>${selected.length} 單元</span></header><div class="atlas-unit-grid">${cards}</div>` : ''}
      ${filter === 'overview' ? `<header class="atlas-heading"><div><h2>全廠總覽</h2><p>從整體架構理解各單元的關係。</p></div><span>${overviews.length} 張總覽</span></header>${overviewGrid()}` : filter === 'all' ? `<details class="atlas-overview-collection"><summary><span>${icon('network')}全廠總覽與跨單元架構</span><small>${overviews.length} 張圖</small>${icon('chevrondown')}</summary>${overviewGrid()}</details>` : ''}
    </section>${footer()}`;
  }
  window.FactoryAtlas = { render };
})();
