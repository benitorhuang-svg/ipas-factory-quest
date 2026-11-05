(function () {
  'use strict';
  const items = [
    ['home', 'home', '工廠總覽', '總覽'], ['repair', 'clock', '到期複習', '複習'],
    ['atlas', 'book', '複習圖鑑', '圖鑑'], ['guide', 'bulb', '備考寶典', '寶典'],
    ['exam', 'flag', '考前模擬', '模擬'], ['progress', 'chart', '成長紀錄', '紀錄'],
  ];
  const names = { home: '工廠總覽', unit: '部門任務', quiz: '任務進行中', result: '任務報告', repair: '到期複習', atlas: '複習圖鑑', guide: '備考寶典', exam: '考前模擬', progress: '成長紀錄' };

  const sectionPages = {
    home: { title: '工廠總覽', tabs: [] },
    unit: { title: '單元練習', tabs: [] },
    repair: { title: '到期複習', tabs: [] },
    progress: { title: '成長紀錄', tabs: [] },
    atlas: {
      title: '單元架構與視覺圖鑑', label: '圖鑑單元分類', initial: 'all',
      tabs: [
        ['all', '全部圖鑑', '12 單元與全廠總覽'],
        ['s1', '科目一', '生產與作業管理基礎 · 6 單元'],
        ['s2', '科目二', '智慧製造生產線管理基礎 · 6 單元'],
        ['overview', '全廠總覽', '全廠宏觀與跨層級全景 · 5 張總覽'],
      ],
    },
    guide: {
      title: '備考寶典', label: '備考寶典分區', initial: 'materials',
      tabs: [['materials', '精讀講義'], ['glossary', '名詞辭典'], ['formulas', '公式手冊'], ['traps', '易錯觀念']],
    },
    exam: {
      title: '考前模擬', label: '考前模擬分區', initial: 'quiz',
      tabs: [['quiz', '模擬測驗'], ['pdfs', '歷屆試題']],
    },
  };

  function render({ body, view, route, pageTitle, icon, esc, wrongCount }) {
    const nav = mobile => items.map(([id, glyph, label, short]) => {
      const active = id === view || (id === 'home' && ['unit', 'quiz', 'result'].includes(view));
      return `<a href="#/${id}" class="${mobile ? '' : 'nav-button '}${active ? 'active' : ''}" aria-label="${label}${id === 'repair' && wrongCount ? `，${wrongCount} 題待複習` : ''}" ${active ? 'aria-current="page"' : ''}>${icon(glyph)}<span class="nav-text">${mobile ? short : label}</span>${!mobile && id === 'repair' && wrongCount ? `<span class="nav-count">${wrongCount}</span>` : ''}</a>`;
    }).join('');
    const section = sectionPages[view] || (pageTitle ? { title: pageTitle, tabs: [] } : null);
    const activeTab = section?.tabs.some(([id]) => id === route.arg) ? route.arg : section?.initial;
    const header = section ? `
      <header class="topbar section-topbar ${section.tabs.length ? '' : 'section-topbar--plain'}">
        <h1 class="section-title">${esc(pageTitle || section.title)}</h1>
        ${section.tabs.length ? `<nav class="section-tabs" aria-label="${section.label}">${section.tabs.map(([id, label, description]) => `
          <a href="#/${view}/${id}" class="section-tab ${view === 'guide' ? 'study-tab ' : ''}${activeTab === id ? 'active' : ''}" ${activeTab === id ? 'aria-current="page"' : ''}${description ? ` title="${esc(description)}"` : ''}>${label}</a>
        `).join('')}</nav>` : ''}
      </header>` : `
      <header class="topbar"><div class="topbar-left"><a href="#/home" class="mobile-brand"><span class="brand-mark">${icon('factory')}</span>智造闖關</a><div class="breadcrumb">學習中心<span>／</span><strong>${names[view] || '工廠總覽'}</strong></div></div></header>`;
    return `
      <a class="skip" data-action="skip" href="#content">跳到主要內容</a>
      <aside class="sidebar">
        <a href="#/home" class="brand" aria-label="智造闖關首頁"><span class="brand-mark">${icon('factory')}</span><span class="brand-name">智造闖關<small>FACTORY QUEST</small></span></a>
        <div class="nav-label">你的學習工廠</div>
        <nav class="side-nav" aria-label="主要導覽">${nav(false)}</nav>
        <div class="sidebar-note"><span>一步一步，累積實力。</span><small>iPAS 智慧生產工程師</small></div>
      </aside>
      <div class="workspace">
        ${header}
        <main id="content" class="page page--${view} ${view === 'quiz' ? 'quiz-page' : ''} ${section ? 'page--section' : ''}" tabindex="-1">${body}</main>
      </div>
      <nav class="mobile-nav" aria-label="手機導覽">${nav(true)}</nav>`;
  }
  window.FactoryShell = { render };
})();
