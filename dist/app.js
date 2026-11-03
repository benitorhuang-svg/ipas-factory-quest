(function(){
  'use strict';
  const DATA = window.FACTORY_QUEST_DATA, E = window.FactoryEngine;
  const units = DATA.units, bank = DATA.questions, qmap = new Map(bank.map(q => [q.id, q]));
  const KEY = 'factory-quest-ipas-v1';
  const app = document.getElementById('app');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const paths = {
    factory: '<path d="M3 21V10l6 3V8l6 3V3h5v18H3Z"/><path d="M6 17h1m4 0h1m4 0h1"/>',
    home: '<path d="m3 10 9-7 9 7v11H3V10Z"/><path d="M9 21v-8h6v8"/>',
    wrench: '<path d="M14 6a5 5 0 0 0-6 6L2 18l4 4 6-6a5 5 0 0 0 6-6l-4 4-4-4 4-4Z"/>',
    book: '<path d="M12 6c-3-3-7-3-10-2v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2Zm0 0v15"/>',
    flag: '<path d="M5 22V3m0 0c5-4 9 4 15 0v11c-6 4-10-4-15 0"/>',
    chart: '<path d="M4 3v18h18M8 16V9m5 7V5m5 11v-5"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    circlecheck: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    cross: '<path d="m6 6 12 12M18 6 6 18"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1L12 2Z"/>',
    trophy: '<path d="M7 3h10v5c0 8-10 8-10 0V3Zm0 2H3v3c0 3 4 4 5 4m9-7h4v3c0 3-4 4-5 4m-4 3v5m-5 2h10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18m-13 5h2m4 0h2"/>',
    route: '<circle cx="5" cy="5" r="3"/><circle cx="19" cy="19" r="3"/><path d="M8 5h8a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h8"/>',
    box: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10L3 7m9 5 9-5m-9 5v10M7 4.8l9 5"/>',
    gauge: '<path d="M4 18a10 10 0 1 1 16 0H4Zm8-5 5-5"/><circle cx="12" cy="13" r="2"/>',
    shield: '<path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',
    network: '<rect x="8" y="2" width="8" height="6" rx="1"/><rect x="2" y="16" width="7" height="6" rx="1"/><rect x="15" y="16" width="7" height="6" rx="1"/><path d="M12 8v4m-7 4v-4h14v4"/>',
    brain: '<path d="M12 4c-4-5-9 0-6 3-5 0-5 7-1 8-2 5 4 8 7 4 3 4 9 1 7-4 4-1 4-8-1-8 3-3-2-8-6-3Zm0 0v15M7 10l5 2 5-2"/>',
    bulb: '<path d="M8 16c-6-5-3-13 4-13s10 8 4 13v3H8v-3Zm1 6h6m-6-9 3 3 3-3m-3 3v3"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
    external: '<path d="M14 3h7v7m0-7L10 14m0-11H3v18h18v-7"/>',
    save: '<path d="M3 3h14l4 4v14H3V3Zm4 0v6h10V3M7 21v-8h10v8"/>',
    flame: '<path d="M13 2c1 5 8 8 6 15-2 7-14 6-15-1-1-4 2-7 5-10 0 4 1 5 2 5 3-2 1-5 2-9Z"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    badge: '<path d="m12 2 8 4-1 11-7 5-7-5L4 6l8-4Z"/><path d="m8 11 3 3 5-6"/>',
    spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
    arrowup: '<path d="m5 15 7-7 7 7M12 8v13"/>',
    trash: '<path d="M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>'
  };
  const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.factory}</svg>`;
  const byUnit = id => units.find(u => u.id === id);
  const fmt = n => new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 3 }).format(n);

  const topicList = [
    'M11101', 'M11102', 'M11103', 'M11201', 'M11202', 'M11203',
    'M12101', 'M12102', 'M12103', 'M12201', 'M12202', 'M12203',
    'M13101', 'M13201',
    'M21101', 'M21102', 'M21201', 'M21202',
    'M22101', 'M22102', 'M22201', 'M22202', 'M22301',
    'APPX01', 'APPX02', 'APPX03', 'APPX04', 'APPX05'
  ];

  let storageFailed = false, toastTimer, filter = 'all', lastReport = null, guideSearch = '', currentMaterialTopic = 'M11101';
  let state;
  try { state = E.restore(JSON.parse(localStorage.getItem(KEY)), bank); } catch { state = E.emptyState(); }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch {
      if (!storageFailed) {
        storageFailed = true;
        toast('目前無法自動儲存，請至成長紀錄匯出備份。');
      }
      return false;
    }
  }

  function route() {
    const r = location.hash.replace(/^#\/?/, '').split('/');
    return { view: r[0] || 'home', arg: r[1] || '', subArg: r[2] || '' };
  }

  function go(view, arg = '', subArg = '') {
    let hash = '#/' + view;
    if (arg) hash += '/' + arg;
    if (subArg) hash += '/' + subArg;
    if (location.hash === hash) render();
    else location.hash = hash;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function toast(message) {
    document.querySelector('.toast')?.remove();
    clearTimeout(toastTimer);
    const n = document.createElement('div');
    n.className = 'toast';
    n.setAttribute('role', 'status');
    n.textContent = message;
    document.body.appendChild(n);
    toastTimer = setTimeout(() => n.remove(), 3600);
  }

  function closeModal() {
    document.getElementById('modal')?.close();
  }

  function modal(content, cls = '') {
    closeModal();
    document.getElementById('modal')?.remove();
    const d = document.createElement('dialog');
    d.id = 'modal';
    d.className = cls;
    d.innerHTML = content;
    document.body.appendChild(d);
    d.addEventListener('close', () => d.remove());
    d.addEventListener('click', e => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
    d.showModal();
    return d;
  }

  function lightbox(src, title = '高解析圖解') {
    modal(`
      <div class="lightbox-dialog">
        <div class="lightbox-toolbar">
          <strong>${esc(title)}</strong>
          <div class="button-row">
            <a class="btn btn-small" href="${src}" target="_blank" rel="noopener">${icon('external')}原尺寸新視窗</a>
            <button class="modal-close" data-action="close" aria-label="關閉">${icon('cross')}</button>
          </div>
        </div>
        <img src="${src}" alt="${esc(title)}" decoding="async">
      </div>
    `, 'lightbox-dialog-wrap');
  }

  function openInteractive(url, title = '互動式架構圖') {
    const fullUrl = url.includes('?') ? url + '&embed=1' : url + '?embed=1';
    modal(`
      <div class="iframe-dialog">
        <div class="iframe-toolbar">
          <strong>${icon('network')} ${esc(title)}</strong>
          <div class="button-row">
            <a class="btn btn-small" href="${url}" target="_blank" rel="noopener">${icon('external')}獨立視窗開啟</a>
            <button class="modal-close" data-action="close" aria-label="關閉">${icon('cross')}</button>
          </div>
        </div>
        <iframe class="iframe-frame" src="${fullUrl}" allowfullscreen></iframe>
      </div>
    `, 'iframe-dialog-wrap');
  }

  function poster(id) {
    const u = byUnit(id);
    if (!u) return;
    modal(`
      <div class="poster-toolbar">
        <strong>${esc(id)} ${esc(u.title)} 高解析分解結構圖</strong>
        <div class="button-row">
          <a class="btn btn-small" href="assets/${id}.png" target="_blank" rel="noopener">${icon('external')}原尺寸</a>
          <button class="modal-close" data-action="close" aria-label="關閉複習圖">${icon('cross')}</button>
        </div>
      </div>
      <img src="assets/${id}.png" alt="${esc(id + ' ' + u.title + ' 重點複習資訊圖')}" decoding="async">
    `, 'poster-dialog');
  }

  function openQuizHelper(unitId) {
    const u = byUnit(unitId);
    const sm = (DATA.studyMaterials || []).find(m => m.unitId === unitId || m.topicCode === (u ? u.topicCode : ''));
    if (!u && !sm) {
      toast('目前為跨單元挑戰，建議冷靜回想各章節核心定義。');
      return;
    }
    modal(`
      <div class="lightbox-dialog" style="max-width:800px">
        <div class="lightbox-toolbar">
          <strong>💡 ${esc(u ? u.id + ' ' + u.title : '單元重點速記')}</strong>
          <button class="modal-close" data-action="close" aria-label="關閉">${icon('cross')}</button>
        </div>
        ${u && u.diagram3D ? `
          <div style="margin-bottom:14px;border-radius:10px;overflow:hidden;border:1px solid var(--line);max-height:220px;cursor:pointer" data-action="lightbox" data-src="${u.diagram3D}" data-title="${esc(u.title)} 3D 渲染圖解">
            <img src="${u.diagram3D}" alt="3D圖解" style="width:100%;height:100%;object-fit:cover">
          </div>
        ` : ''}
        <div style="font-size:13px;line-height:1.8;color:var(--ink);margin-bottom:12px">
          <strong>單元核心提要：</strong><br>${esc(u ? u.takeaway : '')}
        </div>
        ${sm && sm.coreConcepts ? `
          <div style="margin-bottom:14px">
            <strong style="font-size:11px;color:var(--muted)">核心考點標籤：</strong>
            <div class="concept-tags" style="margin-top:6px">
              ${sm.coreConcepts.map(c => `<span class="concept-tag">${esc(c)}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        <div class="button-row">
          ${u && u.interactiveUrl ? `<button class="btn btn-small" data-action="open-interactive" data-url="${u.interactiveUrl}" data-title="${esc(u.title)} 互動架構圖">${icon('network')}開啟本單元互動架構圖</button>` : ''}
          ${u ? `<button class="btn btn-small" data-action="poster" data-unit="${u.id}">${icon('book')}架構分解圖</button>` : ''}
          ${u ? `<button class="btn btn-small btn-primary" data-action="guide-tab" data-tab="materials" data-subtab="${u.topicCode}">${icon('bulb')}閱讀完整精讀講義</button>` : ''}
        </div>
      </div>
    `);
  }

  function renderGuideSelectOptions(currentVal) {
    return `
      <optgroup label="── 快速切換寶典專區 ──">
        <option value="tab:materials" ${currentVal === 'tab:materials' ? 'selected' : ''}>📖 單元精讀講義與 3D 圖解</option>
        <option value="tab:diagrams" ${currentVal === 'tab:diagrams' ? 'selected' : ''}>🗺️ 互動架構與職能全景</option>
        <option value="tab:glossary" ${currentVal === 'tab:glossary' ? 'selected' : ''}>📖 專有名詞辭典 (165 詞條)</option>
        <option value="tab:formulas" ${currentVal === 'tab:formulas' ? 'selected' : ''}>📐 核心公式速查 (8 大題型)</option>
        <option value="tab:traps" ${currentVal === 'tab:traps' ? 'selected' : ''}>⚠️ 考古題避坑手冊 (10 大盲點)</option>
        <option value="tab:pdfs" ${currentVal === 'tab:pdfs' ? 'selected' : ''}>📄 官方公告試題與簡章 PDF</option>
      </optgroup>
      <optgroup label="── 初級科目一：生產與作業管理基礎 (6單元) ──">
        <option value="topic:M11101" ${currentVal === 'topic:M11101' ? 'selected' : ''}>L111 生產管理基本概念</option>
        <option value="topic:M11102" ${currentVal === 'topic:M11102' ? 'selected' : ''}>L112 製造流程管理概念</option>
        <option value="topic:M11103" ${currentVal === 'topic:M11103' ? 'selected' : ''}>L113 物料管理概論</option>
        <option value="topic:M11201" ${currentVal === 'topic:M11201' ? 'selected' : ''}>L114 工業工程概論與標準工時</option>
        <option value="topic:M11202" ${currentVal === 'topic:M11202' ? 'selected' : ''}>L115 品質管理與統計製程管制</option>
        <option value="topic:M11203" ${currentVal === 'topic:M11203' ? 'selected' : ''}>L116 精實生產與現場績效管理</option>
      </optgroup>
      <optgroup label="── 初級科目二：智慧製造生產線管理基礎 (6單元) ──">
        <option value="topic:M12101" ${currentVal === 'topic:M12101' ? 'selected' : ''}>L121 智慧製造概論與 ISA-95 架構</option>
        <option value="topic:M12102" ${currentVal === 'topic:M12102' ? 'selected' : ''}>L122 工業物聯網 IIoT 與通訊協定</option>
        <option value="topic:M12103" ${currentVal === 'topic:M12103' ? 'selected' : ''}>L123 人工智慧 AI 與機器視覺檢測</option>
        <option value="topic:M12201" ${currentVal === 'topic:M12201' ? 'selected' : ''}>L124 網宇實體系統 CPS 與數位雙生</option>
        <option value="topic:M12202" ${currentVal === 'topic:M12202' ? 'selected' : ''}>L125 智動化生產設備與傳送系統</option>
        <option value="topic:M12203" ${currentVal === 'topic:M12203' ? 'selected' : ''}>L126 智慧工廠生產模式與 MES 整合</option>
      </optgroup>
      <optgroup label="── 科目三：現場實作與評分標準 ──">
        <option value="topic:M13101" ${currentVal === 'topic:M13101' ? 'selected' : ''}>M13101 生產管理與流程實作</option>
        <option value="topic:M13201" ${currentVal === 'topic:M13201' ? 'selected' : ''}>M13201 智慧製造現場管理實作</option>
      </optgroup>
      <optgroup label="── 中級智慧製造工程師教材 (全9章) ──">
        <option value="topic:M21101" ${currentVal === 'topic:M21101' ? 'selected' : ''}>M21101 生產管理實務與精實管理</option>
        <option value="topic:M21102" ${currentVal === 'topic:M21102' ? 'selected' : ''}>M21102 智慧工廠技術綜觀與 MES 實務</option>
        <option value="topic:M21201" ${currentVal === 'topic:M21201' ? 'selected' : ''}>M21201 MES 全廠管控與排程優化</option>
        <option value="topic:M21202" ${currentVal === 'topic:M21202' ? 'selected' : ''}>M21202 線平衡與品質要因分析</option>
        <option value="topic:M22101" ${currentVal === 'topic:M22101' ? 'selected' : ''}>M22101 物聯網與 CPS 基本原理</option>
        <option value="topic:M22102" ${currentVal === 'topic:M22102' ? 'selected' : ''}>M22102 智慧設備維護與製程大數據</option>
        <option value="topic:M22201" ${currentVal === 'topic:M22201' ? 'selected' : ''}>M22201 感測器、機器視覺與機器人</option>
        <option value="topic:M22202" ${currentVal === 'topic:M22202' ? 'selected' : ''}>M22202 通訊建構、智慧控制與介面</option>
        <option value="topic:M22301" ${currentVal === 'topic:M22301' ? 'selected' : ''}>M22301 設備操作與效率指標辨識</option>
      </optgroup>
      <optgroup label="── 考綱對照與實戰附錄 ──">
        <option value="topic:APPX01" ${currentVal === 'topic:APPX01' ? 'selected' : ''}>APPX01 核心公式與計算題彙整</option>
        <option value="topic:APPX02" ${currentVal === 'topic:APPX02' ? 'selected' : ''}>APPX02 考古題盲點與常見陷阱</option>
        <option value="topic:APPX03" ${currentVal === 'topic:APPX03' ? 'selected' : ''}>APPX03 官方學習資源與參考書目導引</option>
        <option value="topic:APPX04" ${currentVal === 'topic:APPX04' ? 'selected' : ''}>APPX04 官方考綱對照與複習補充</option>
        <option value="topic:APPX05" ${currentVal === 'topic:APPX05' ? 'selected' : ''}>APPX05 115 年試題導向實戰練習</option>
      </optgroup>
    `;
  }

  let mermaidSeq = 0;
  async function renderMermaidDiagrams() {
    if (!window.mermaid) return;
    try {
      if (!window.__mermaid_inited) {
        window.mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'base',
          htmlLabels: true,
          themeVariables: {
            fontFamily: '"Noto Sans TC", system-ui, sans-serif',
            fontSize: '13px',
            primaryColor: '#eef5e6',
            primaryTextColor: '#174b3e',
            primaryBorderColor: '#88a96f',
            lineColor: '#527c50',
            secondaryColor: '#f7f8f3',
            tertiaryColor: '#ffffff',
            actorBkg: '#eef5e6',
            actorBorder: '#88a96f',
            actorTextColor: '#174b3e',
            noteBkgColor: '#fff9e6',
            noteTextColor: '#7c5e10',
            noteBorderColor: '#e2ca70'
          },
          flowchart: { curve: 'linear', nodeSpacing: 35, rankSpacing: 40 }
        });
        window.__mermaid_inited = true;
      }

      const blocks = document.querySelectorAll('.mermaid:not([data-processed="true"]), pre.mermaid:not([data-processed="true"])');
      for (const block of blocks) {
        block.setAttribute('data-processed', 'true');
        const decoder = document.createElement('textarea');
        decoder.innerHTML = block.innerHTML.trim();
        const code = decoder.value.trim();
        if (!code) continue;
        const id = 'mermaid-chart-' + (++mermaidSeq);
        try {
          const { svg } = await window.mermaid.render(id, code);
          const container = document.createElement('div');
          container.className = 'mermaid-rendered';
          container.innerHTML = svg;
          const parent = block.closest('.mermaid-block') || block;
          parent.replaceWith(container);
        } catch (err) {
          console.warn('Mermaid render error:', err);
          document.getElementById(id)?.remove();
          document.getElementById('d' + id)?.remove();
        }
      }
    } catch (e) {
      console.warn('Mermaid initialization error:', e);
    }
  }

  const navItems = [
    ['home', 'home', '工廠總覽', '總覽'],
    ['repair', 'wrench', '返修中心', '返修'],
    ['atlas', 'book', '複習圖鑑', '圖鑑'],
    ['guide', 'bulb', '備考寶典', '寶典'],
    ['exam', 'flag', '考前模擬', '模擬'],
    ['progress', 'chart', '成長紀錄', '紀錄']
  ];

  function navHTML(view, mobile = false) {
    return navItems.map(([id, ic, text, short]) => `<button type="button" class="${mobile ? '' : 'nav-button '}${view === id || (id === 'home' && ['unit', 'quiz', 'result'].includes(view)) ? 'active' : ''}" data-action="nav" data-view="${id}" ${view === id ? 'aria-current="page"' : ''}>${icon(ic)}<span>${mobile ? short : text}</span>${!mobile && id === 'repair' && E.wrongIds(state).length ? `<span class="nav-count">${E.wrongIds(state).length}</span>` : ''}</button>`).join('');
  }

  function shell(body, view) {
    const r = route();
    let currentSelectVal = 'tab:materials';
    if (view === 'guide') {
      if (r.arg === 'materials' || !r.arg) {
        currentSelectVal = 'topic:' + currentMaterialTopic;
      } else {
        currentSelectVal = 'tab:' + r.arg;
      }
    }
    return `
      <a class="skip" data-action="skip" href="#content">跳到主要內容</a>
      <aside class="sidebar">
        <a href="#/home" class="brand" aria-label="智造闖關首頁">
          <span class="brand-mark">${icon('factory')}</span>
          <span class="brand-name">智造闖關<small>FACTORY QUEST</small></span>
        </a>
        <div class="nav-label">你的學習工廠</div>
        <nav class="side-nav" aria-label="主要導覽">${navHTML(view)}</nav>
        <div class="sidebar-tip">
          <div class="tip-label">${icon('bulb')}一點一滴，變成實力</div>
          <p>12大單元、476題題庫。<br>28篇精讀講義、3D圖解與試題全收錄。</p>
        </div>
        <div class="sidebar-footer">iPAS 智慧生產工程師・初級<br>兩科十二單元・全題庫備考專用</div>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <div class="topbar-left">
            <div class="mobile-brand"><span class="brand-mark">${icon('factory')}</span>智造闖關</div>
            <div class="breadcrumb">學習中心<span>／</span><strong>${({ home: '工廠總覽', unit: '部門任務', quiz: '任務進行中', result: '任務報告', repair: '返修中心', atlas: '複習圖鑑', guide: '備考寶典', exam: '考前模擬', progress: '成長紀錄' })[view] || '工廠總覽'}</strong></div>
          </div>
          <div class="topbar-guide-selector">
            <label for="topbar-guide-select" class="topbar-select-label">${icon('bulb')} 備考寶典：</label>
            <select id="topbar-guide-select" class="topbar-select" aria-label="切換備考寶典章節">
              ${renderGuideSelectOptions(currentSelectVal)}
            </select>
          </div>
          <div class="profile"><span>${E.level(state.xp)}</span><div class="avatar" aria-hidden="true">廠</div></div>
        </header>
        <main id="content" class="page ${view === 'quiz' ? 'quiz-page' : ''}" tabindex="-1">${body}</main>
      </div>
      <nav class="mobile-nav" aria-label="手機導覽">${navHTML(view, true)}</nav>
    `;
  }

  function intro(kicker, title, description, extra = '') {
    return `<div class="page-intro"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${description}</p></div>${extra}</div>`;
  }

  function footer() {
    return `<div class="footnote">${icon('shield')}依經濟部 115 年度 iPAS 智慧生產工程師鑑定範圍整理（職能基準 MPM3117-001v3）<span>／</span><a href="https://ipd.nat.gov.tw/ipas/certification/SPE/exam-info" target="_blank" rel="noopener">官方考試資訊 ${icon('external')}</a></div>`;
  }

  function factoryArt() {
    const count = state.passedUnits.length;
    return `<svg viewBox="0 0 450 275" role="img" aria-label="你的學習工廠，已完成${count}個部門"><ellipse cx="226" cy="239" rx="185" ry="20" fill="#d2dfbf"/><path d="M49 196 208 265 411 177 251 110Z" fill="#dce8ca" stroke="#b8c99f" stroke-width="1.5"/><path d="M216 222 390 145v37l-174 77Z" fill="#b1c68e"/><path d="M78 174v-74l37-18 37 19 38-19 38 20v113Z" fill="#f9fbed" stroke="#365b3e" stroke-width="2.5"/><path d="m78 100 37-18 37 19 38-19 38 20 131-57-38-20-37 18-38-19-37 17-37-18-131 59Z" fill="#c3d3a8" stroke="#365b3e" stroke-width="2.5"/><path d="m228 102 131-57v112l-131 58Z" fill="#8da975" stroke="#365b3e" stroke-width="2.5"/><path d="M99 72V30l19-8 17 8v34" fill="#e5edcf" stroke="#365b3e" stroke-width="2.5"/><path d="m118 23 17 7v34l-17 8Z" fill="#adbf8e"/><path d="M99 31 118 40l17-10" fill="none" stroke="#365b3e" stroke-width="2"/>${[0, 1, 2, 3, 4, 5].map((n) => `<rect x="${88 + n * 20}" y="120" width="14" height="26" rx="2" fill="${n < count ? '#d5f468' : '#cad8b9'}" stroke="#719266" stroke-width="1.5"/>`).join('')}<path d="M150 201v-40h44v59" fill="#32634a" stroke="#365b3e" stroke-width="2"/><path d="M157 163v39m9-39v43m9-43v47m10-47v50" stroke="#7c9c69" stroke-width="1.5"/>${[0, 1, 2, 3, 4, 5].map(n => `<path d="m${238 + n * 18} ${115 - n * 8} 12-6v22l-12 6Z" fill="${n + 6 < count ? '#d5f468' : '#d7e5b7'}" stroke="#567851" stroke-width="1.3"/>`).join('')}<path d="m337 147 30-13 25 11-31 14Z" fill="#eac079" stroke="#856c43" stroke-width="1.5"/><path d="M337 147v27l24 11v-26Z" fill="#d7a867" stroke="#856c43" stroke-width="1.5"/><path d="m361 159 31-14v27l-31 13Z" fill="#f4d391" stroke="#856c43" stroke-width="1.5"/><path d="m53 198 29-13 26 12-29 13Z" fill="#f5f8ec" stroke="#7c9569" stroke-width="1.5"/><path d="M53 198v11l26 13v-12Zm26 12 29-13v11l-29 14Z" fill="#c3d4a6" stroke="#7c9569" stroke-width="1.5"/><path d="M391 181v-39" stroke="#476741" stroke-width="3"/><path d="M392 143c31 0 20 30 0 14-20 14-30-12 0-14Z" fill="#9ebd76" stroke="#6b8d54" stroke-width="1.4"/><path d="m260 229 32-14m-60 27 16-7m-51 23 16-7" stroke="#f6f8e9" stroke-width="3"/><circle cx="363" cy="44" r="17" fill="#ecc479" opacity=".75"/><path d="M51 55h33m-15-9v18" stroke="#a0b68c" stroke-width="1.5"/></svg>`;
  }

  function unitCard(u) {
    const passed = state.passedUnits.includes(u.id), best = state.best[u.id];
    return `
      <button type="button" class="unit-card ${passed ? 'passed' : ''}" data-action="unit" data-unit="${u.id}" aria-label="進入${u.id} ${u.title}">
        <div class="unit-top">
          <span class="room-icon ${u.color}">${icon(u.icon)}</span>
          <span class="unit-state">${passed ? icon('circlecheck') + '已通關' : '自由挑戰'}</span>
        </div>
        <div class="unit-code">${u.id}</div>
        <h3>${u.room}</h3>
        <div class="formal-title">${u.title}</div>
        <p class="unit-desc">${u.mission}</p>
        <div class="unit-bottom">
          <span>${best !== undefined ? '最佳 ' + best + ' 分' : '10題／關'}</span>
          <strong>${passed ? '再次挑戰' : '進入部門'}${icon('arrow')}</strong>
        </div>
      </button>
    `;
  }

  function home() {
    const next = units.find(u => !state.passedUnits.includes(u.id)) || units.reduce((a, b) => (state.best[a.id] || 0) <= (state.best[b.id] || 0) ? a : b);
    const active = state.active;
    const wrong = E.wrongIds(state).length;
    const subset = units.filter(u => filter === 'all' || u.subject === filter);
    return `
      ${intro('LET’S BUILD YOUR KNOWLEDGE', '廠長，歡迎回到工廠。', '把每一個觀念，變成解決現場問題的真實實力。', `<span class="tag">${icon('calendar')}兩科十二單元・476題題庫</span>`)}
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow">YOUR SMART FACTORY JOURNEY</div>
          <h2>知識就緒，<br>工廠開工。</h2>
          <p>涵蓋生產管理、流程、物料、IE、品質、精實與智造六大領域。<br>收錄 28 篇精讀講義、3D 渲染圖解與 476 題實戰題庫。</p>
          <div class="button-row">
            <button type="button" class="btn btn-primary" data-action="${active ? 'resume' : 'unit'}" ${active ? '' : `data-unit="${next.id}"`}>${icon(active ? 'save' : 'arrow')}${active ? '繼續未完成任務' : '開始 ' + next.id + ' 任務'}</button>
            <button class="btn" data-action="nav" data-view="guide">${icon('bulb')}看備考寶典</button>
          </div>
          <div class="hero-note">${icon('clock')}12 單元完整對齊官方大綱・自編與實戰題庫</div>
        </div>
        <div class="hero-art">${factoryArt()}<div class="factory-progress"><i class="status-dot"></i>學習工廠 ${state.passedUnits.length}／${units.length} 部門已通關</div></div>
      </section>
      <div class="stats-row">
        <div class="stat"><span class="stat-icon">${icon('star')}</span><div><div class="stat-label">累積學習經驗</div><div class="stat-value number">${fmt(state.xp)}<small>XP</small></div></div></div>
        <div class="stat"><span class="stat-icon">${icon('trophy')}</span><div><div class="stat-label">部門通關進度</div><div class="stat-value number">${state.passedUnits.length}<small>／${units.length}</small></div></div></div>
        <div class="stat"><span class="stat-icon">${icon('wrench')}</span><div><div class="stat-label">待處理返修工單</div><div class="stat-value number">${wrong}<small>題</small></div></div></div>
      </div>
      <div class="section-heading">
        <h2>選擇你的挑戰<span class="section-caption">所有部門皆可自由進入</span></h2>
        <div class="subject-toggle" role="group" aria-label="考科篩選">${[['all', '全部 (12單元)'], [1, '科目一 (6單元)'], [2, '科目二 (6單元)']].map(([v, t]) => `<button type="button" data-action="filter" data-filter="${v}" class="${filter === v ? 'active' : ''}" aria-pressed="${filter === v}">${t}</button>`).join('')}</div>
      </div>
      ${[1, 2].filter(s => subset.some(u => u.subject === s)).map(s => `
        <div class="subject-group-label">SUBJECT ${s === 1 ? '01' : '02'} · ${s === 1 ? '生產與作業管理基礎 (6單元)' : '智慧製造生產線管理基礎 (6單元)'}</div>
        <div class="unit-grid">${subset.filter(u => u.subject === s).map(unitCard).join('')}</div>
      `).join('')}
      <div class="daily-strip">
        ${icon('wrench')}
        <div>
          <strong>${wrong ? '把錯題修好，讓觀念穩下來。' : '今天的第一張工單，等你開工。'}</strong>
          <p>${wrong ? '用不同順序重做錯題，答對就能完成返修。' : '先完成一關，再到返修中心整理還不熟悉的觀念。'}</p>
        </div>
        <button class="btn btn-small" data-action="${wrong ? 'review' : 'unit'}" data-unit="${next.id}">${wrong ? '開始返修' : '接下任務'}${icon('arrow')}</button>
      </div>
      ${footer()}
    `;
  }

  function unitView(id) {
    const u = byUnit(id);
    if (!u) return home();
    const best = state.best[id];
    const unitQuestions = bank.filter(q => q.unit === id);
    return `
      <button class="text-link" data-action="nav" data-view="home">${icon('back')}回到工廠總覽</button>
      <div class="unit-banner">
        <span class="room-icon ${u.color}">${icon(u.icon)}</span>
        <div>
          <div class="unit-code">${u.id} · SUBJECT 0${u.subject} · 收錄 ${unitQuestions.length} 題</div>
          <h1>${u.room}</h1>
          <p>${u.title}</p>
        </div>
      </div>
      <div class="brief-grid">
        <section class="panel">
          <div class="eyebrow muted">MISSION BRIEF</div>
          <h2 style="margin-top:7px">${u.mission}</h2>
          <ul class="topic-list">${u.topics.map(t => `<li>${icon('circlecheck')}${esc(t)}</li>`).join('')}</ul>
          <div class="mission-rules">
            <span><strong class="number">10 題</strong>抽題闖關</span>
            <span><strong class="number">80 分</strong>通關門檻</span>
            <span><strong class="number">+50 XP</strong>首次通關加成</span>
            <span><strong class="number">${unitQuestions.length} 題</strong>本單元題庫池</span>
          </div>
          <div class="button-row">
            <button class="btn btn-primary" data-action="start" data-unit="${u.id}" data-mode="mission">${icon('flag')}開始 10 題闖關</button>
            <button class="btn" data-action="start" data-unit="${u.id}" data-mode="quick">5 題快練${icon('arrow')}</button>
            <button class="btn" data-action="guide-tab" data-tab="materials" data-subtab="${u.topicCode}">${icon('bulb')}單元精讀講義</button>
            ${u.interactiveUrl ? `<button class="btn" data-action="open-interactive" data-url="${u.interactiveUrl}" data-title="${esc(u.title)} 互動架構圖">${icon('network')}互動架構圖</button>` : ''}
          </div>
          <p class="brief-tip">${esc(u.takeaway)}</p>
          ${best !== undefined ? `<p class="muted" style="margin-top:16px;font-size:11px">目前最佳紀錄：${best}分${state.passedUnits.includes(id) ? '・已獲得「' + u.badge + '」徽章' : ''}</p>` : ''}
        </section>
        <section class="brief-poster" style="cursor:pointer" data-action="lightbox" data-src="${u.diagram3D || `assets/${u.id}.png`}" data-title="${esc(u.title)} 圖解">
          <img src="${u.diagram3D || `assets/${u.id}.png`}" alt="${u.title} 複習圖預覽">
          <button class="btn btn-small" data-action="lightbox" data-src="${u.diagram3D || `assets/${u.id}.png`}" data-title="${esc(u.title)} 3D重點圖解">${icon('eye')}${u.diagram3D ? '展開 3D 重點圖解' : '展開重點複習圖'}</button>
        </section>
      </div>
      <p class="gallery-note">10題闖關會累積部門最佳成績；5題快練用於快速回想，不授予部門通關徽章。</p>
      ${footer()}
    `;
  }

  function atlas() {
    return `
      ${intro('KNOWLEDGE ATLAS', '單元架構分解圖鑑', '12 個章節高解析分解結構圖與兩大全科總覽，隨時放大或新視窗開啟。')}
      <div class="gallery-grid">
        ${units.map(u => `
          <button class="poster-card" data-action="poster" data-unit="${u.id}">
            <div class="poster-thumb"><img loading="lazy" src="assets/${u.id}.png" alt="${u.id} 複習圖預覽"></div>
            <div class="poster-info">
              <span class="unit-code">${u.id} · 科目${u.subject === 1 ? '一' : '二'}</span>
              <h3>${esc(u.title)}</h3>
              <small>展開高解析架構圖</small>
            </div>
          </button>
        `).join('')}
        <button class="poster-card" data-action="poster-file" data-file="assets/S1_Overview.png" data-title="科目一：生產與作業管理基礎 全科架構">
          <div class="poster-thumb"><img loading="lazy" src="assets/S1_Overview.png" alt="科目一架構圖"></div>
          <div class="poster-info">
            <span class="unit-code">SUBJECT 01 · 總覽</span>
            <h3>科目一全科分解結構圖</h3>
            <small>展開全科架構圖</small>
          </div>
        </button>
        <button class="poster-card" data-action="poster-file" data-file="assets/S2_Overview.png" data-title="科目二：智慧製造生產線管理基礎 全科架構">
          <div class="poster-thumb"><img loading="lazy" src="assets/S2_Overview.png" alt="科目二架構圖"></div>
          <div class="poster-info">
            <span class="unit-code">SUBJECT 02 · 總覽</span>
            <h3>科目二全科分解結構圖</h3>
            <small>展開全科架構圖</small>
          </div>
        </button>
      </div>
      <p class="gallery-note">高解析結構圖依據官方大綱編製；點擊可放大預覽，或點選「原尺寸」在新分頁檢視。</p>
      ${footer()}
    `;
  }

  function repair() {
    const ids = E.wrongIds(state), list = ids.map(id => qmap.get(id)).filter(Boolean);
    if (!list.length) return `
      ${intro('REPAIR CENTER', '把錯題，修成你的強項。', '每張返修工單都來自你實際答錯的題目。')}
      <div class="empty">
        ${icon('circlecheck')}
        <h2>目前沒有待返修工單</h2>
        <p>完成闖關後，錯題會自動集中到這裡。再答對一次，即可移出待返修清單。</p>
        <button class="btn btn-primary" data-action="nav" data-view="home">接下新的任務${icon('arrow')}</button>
      </div>
      ${footer()}
    `;
    return `
      ${intro('REPAIR CENTER', '把錯題，修成你的強項。', '重新回想、再做一次，答對就能完成返修。')}
      <div class="repair-summary">
        <div>
          <h2><strong>${list.length}</strong> 張工單待處理</h2>
          <p>每次最多 10 題，跨單元混合返修；交卷後統一解析。</p>
        </div>
        <button class="btn btn-primary" data-action="review">${icon('wrench')}開始返修挑戰</button>
      </div>
      ${list.map(q => {
        const u = byUnit(q.unit);
        return `
          <article class="repair-card">
            <span class="room-icon ${u ? u.color : 'mint'}">${icon(u ? u.icon : 'factory')}</span>
            <div>
              <small>${q.unit} · ${u ? u.room : ''} · 已練習${state.ledger[q.id]?.attempts || 1}次</small>
              <h3>${esc(q.stem)}</h3>
            </div>
            ${u ? `<button class="btn btn-small" data-action="poster" data-unit="${u.id}" aria-label="查看${u.id}複習圖">${icon('book')}<span>複習圖</span></button>` : ''}
          </article>
        `;
      }).join('')}
      ${footer()}
    `;
  }

  function guideView(subView = 'materials', selectedTopic = '') {
    const tabs = [
      ['materials', '📖 單元精讀講義與3D圖解 (' + (DATA.studyMaterials?.length || 28) + ')'],
      ['diagrams', '🗺️ 互動架構與職能全景'],
      ['glossary', '專有名詞辭典 (' + (DATA.glossary?.length || 165) + ')'],
      ['formulas', '核心公式速查 (8大題型)'],
      ['traps', '常考陷阱避坑 (10大盲點)'],
      ['pdfs', '官方試題與簡章 PDF (' + (DATA.pdfs?.length || 7) + ')']
    ];

    if (selectedTopic) currentMaterialTopic = selectedTopic;
    let content = '';

    if (subView === 'materials') {
      const materials = DATA.studyMaterials || [];
      const current = materials.find(m => m.topicCode === currentMaterialTopic) || materials[0] || {};
      const u = units.find(x => x.topicCode === current.topicCode || x.id === current.unitId);

      const curIdx = topicList.indexOf(currentMaterialTopic);
      const prevTopic = curIdx > 0 ? topicList[curIdx - 1] : null;
      const nextTopic = curIdx < topicList.length - 1 ? topicList[curIdx + 1] : null;

      content = `
        <div class="chapter-nav-bar">
          <button type="button" class="btn btn-small" data-action="prev-material" ${prevTopic ? '' : 'disabled'}>
            ${icon('back')} 上一單元
          </button>
          <div class="chapter-select-wrap">
            <label for="material-page-select" class="sr-only">選擇講義單元</label>
            <select id="material-page-select" class="material-page-select" aria-label="選擇講義單元">
              ${renderGuideSelectOptions('topic:' + currentMaterialTopic)}
            </select>
          </div>
          <button type="button" class="btn btn-small" data-action="next-material" ${nextTopic ? '' : 'disabled'}>
            下一單元 ${icon('arrow')}
          </button>
        </div>

        <section class="material-hero">
          <div>
            <div class="eyebrow">${current.topicCode} ${u ? '· ' + u.room : ''}</div>
            <h2>${esc(current.title)}</h2>
            <p>${esc(current.summary || '掌握本單元核心架構與官方出題方向。')}</p>
            ${current.coreConcepts && current.coreConcepts.length ? `
              <div class="concept-tags">
                ${current.coreConcepts.map(c => `<span class="concept-tag">${esc(c)}</span>`).join('')}
              </div>
            ` : ''}
            <div class="button-row" style="margin-top:16px">
              ${u ? `<button class="btn btn-primary btn-small" data-action="unit" data-unit="${u.id}">${icon('flag')}進入 ${u.id} 單元刷題</button>` : ''}
              ${current.interactiveUrl ? `<button class="btn btn-small" data-action="open-interactive" data-url="${current.interactiveUrl}" data-title="${esc(current.title)} 互動架構圖">${icon('network')}開啟全螢幕互動架構圖</button>` : ''}
              ${current.diagram3D ? `<button class="btn btn-small" data-action="lightbox" data-src="${current.diagram3D}" data-title="${esc(current.title)} 3D渲染圖">${icon('eye')}查看 3D 全景圖</button>` : ''}
            </div>
          </div>
          ${current.diagram3D || current.explainerImg ? `
            <div class="material-hero-img" data-action="lightbox" data-src="${current.diagram3D || current.explainerImg}" data-title="${esc(current.title)} 圖解">
              <img src="${current.diagram3D || current.explainerImg}" alt="${esc(current.title)} 圖解">
            </div>
          ` : ''}
        </section>

        <article class="material-content">
          ${current.details || '<p class="muted">講義內容準備中...</p>'}
        </article>
      `;
    } else if (subView === 'diagrams') {
      const va = DATA.visualAssets || {};
      const infographics = va.infographics || [];
      content = `
        <div class="diagram-hub-grid">
          <article class="diagram-hub-card">
            <div class="diagram-hub-thumb" data-action="open-interactive" data-url="${va.isa95Interactive || 'assets/interactive-diagrams/isa95-smart-factory.html'}" data-title="ISA-95 智慧工廠五層架構全景互動圖">
              <img src="assets/learning-units/07_智慧製造概論與ISA95架構_3D.png" alt="ISA-95 互動圖解">
            </div>
            <div class="diagram-hub-body">
              <h3>ISA-95 智慧工廠五層架構 (互動式)</h3>
              <p>貫穿 Enterprise (ERP)、Operations (MES)、Control (SCADA/PLC) 到現場設備層的垂直與水平整合模型。</p>
              <div class="button-row">
                <button class="btn btn-primary btn-small" data-action="open-interactive" data-url="${va.isa95Interactive || 'assets/interactive-diagrams/isa95-smart-factory.html'}" data-title="ISA-95 智慧工廠五層架構全景互動圖">${icon('network')}開啟互動架構圖</button>
              </div>
            </div>
          </article>

          ${infographics.map(info => `
            <article class="diagram-hub-card">
              <div class="diagram-hub-thumb" data-action="lightbox" data-src="${info.path}" data-title="${esc(info.title)}">
                <img src="${info.path}" alt="${esc(info.title)}">
              </div>
              <div class="diagram-hub-body">
                <h3>${esc(info.title)}</h3>
                <p>${esc(info.desc || '官方核心職能基準與單元對應關係。')}</p>
                <div class="button-row">
                  <button class="btn btn-small" data-action="lightbox" data-src="${info.path}" data-title="${esc(info.title)}">${icon('eye')}展開檢視原圖</button>
                </div>
              </div>
            </article>
          `).join('')}

          <article class="diagram-hub-card">
            <div class="diagram-hub-thumb" data-action="open-interactive" data-url="assets/interactive-diagrams/unit-summaries/index.html" data-title="23 單元架構互動總覽">
              <img src="assets/S1_Overview.png" alt="單元架構互動總覽">
            </div>
            <div class="diagram-hub-body">
              <h3>23 單元互動架構圖總覽中心</h3>
              <p>涵蓋初級兩科 12 單元、實作 2 單元與中級 9 單元的專屬互動架構閱讀器。</p>
              <div class="button-row">
                <button class="btn btn-small" data-action="open-interactive" data-url="assets/interactive-diagrams/unit-summaries/index.html" data-title="23 單元架構互動總覽">${icon('network')}開啟總覽閱讀器</button>
              </div>
            </div>
          </article>
        </div>
      `;
    } else if (subView === 'glossary') {
      const q = guideSearch.trim().toLowerCase();
      const list = (DATA.glossary || []).filter(item => {
        if (!q) return true;
        return (item.abbreviation && item.abbreviation.toLowerCase().includes(q)) ||
               (item.chinese && item.chinese.toLowerCase().includes(q)) ||
               (item.english && item.english.toLowerCase().includes(q));
      });
      content = `
        <div class="guide-search">
          <span class="search-icon">${icon('wrench')}</span>
          <input type="text" id="glossary-input" placeholder="輸入縮寫或關鍵字搜尋（例：MES, MRP, OEE, CPS, 庫存, 機器人）..." value="${esc(guideSearch)}">
        </div>
        <p class="muted" style="margin-bottom:14px;font-size:12px">共收錄 ${DATA.glossary?.length || 0} 條標準術語，目前篩選顯示 ${list.length} 條結果。</p>
        <div class="glossary-grid">
          ${list.map(t => `
            <article class="glossary-card">
              <span class="glossary-abbr">${esc(t.abbreviation)}</span>
              <div class="glossary-zh">${esc(t.chinese)}</div>
              <div class="glossary-en">${esc(t.english)}</div>
            </article>
          `).join('')}
        </div>
      `;
    } else if (subView === 'formulas') {
      content = `
        <article class="guide-card">
          <h3>${icon('gauge')} 題型一：標準工時 (ST) 與評比寬放計算</h3>
          <div class="guide-sub"><strong>重要觀念：</strong>標準工時是產能規劃與效率衡量的基石。考試務必先看題目是指定「外加法」還是「內含法」！</div>
          <div class="guide-formula">
            • 正常時間 NT = 觀測時間 OT × (評比係數 Rating % / 100%)<br>
            • 標準工時 ST（外加法，以 NT 為基準）：ST = NT × (1 + Allowance %)<br>
            • 標準工時 ST（內含法，以 ST 為基準）：ST = NT / (1 - Allowance %)
          </div>
        </article>
        <article class="guide-card">
          <h3>${icon('box')} 題型二：經濟訂購量 (EOQ) 與經濟生產量 (EPQ)</h3>
          <div class="guide-sub"><strong>重要觀念：</strong>EOQ 假設一次整批進貨；EPQ 假設邊生產邊耗用（生產速率 p > 耗用速率 d）。</div>
          <div class="guide-formula">
            • 基本 EOQ = √(2 × D × S / H)<br>
            • 生產批量 EPQ = √(2 × D × S / [H × (1 - d/p)])<br>
            • 再訂購點 ROP = (日平均需求 d × 前置時間 LT) + 安全庫存 SS
          </div>
        </article>
        <article class="guide-card">
          <h3>${icon('route')} 題型三：生產線平衡率 (Line Balancing) 與瓶頸消除</h3>
          <div class="guide-sub"><strong>重要觀念：</strong>生產線瓶頸站決定整條線的穩態產出週期時間（Cycle Time）！</div>
          <div class="guide-formula">
            • 需求節拍 Takt Time = 有效可用生產時間 / 顧客需求量<br>
            • 線平衡率 LE = (各工作站加工時間總和 ΣTi) / (工作站數 K × 瓶頸週期時間 T_cycle) × 100%<br>
            • 平衡損失率 d = 100% - 線平衡率 LE
          </div>
        </article>
        <article class="guide-card">
          <h3>${icon('flame')} 題型四：全面生產維護 TPM 與設備綜合效率 (OEE)</h3>
          <div class="guide-sub"><strong>重要觀念：</strong>OEE 是可用率、性能率與良品率三大要素相乘，缺一不可！</div>
          <div class="guide-formula">
            • 可用率 (Availability) = 實際運轉時間 / 計畫稼動時間<br>
            • 性能率 (Performance) = (理論週期時間 × 總生產量) / 實際運轉時間<br>
            • 良品率 (Quality) = 良品數量 / 總生產數量<br>
            • OEE = 可用率 × 性能率 × 良品率
          </div>
        </article>
        <article class="guide-card">
          <h3>${icon('shield')} 題型五：統計製程管制 SPC 與製程能力指數 (Cp/Cpk)</h3>
          <div class="guide-sub"><strong>重要觀念：</strong>Cp 評估變異寬度潛力；Cpk 評估是否產生中心偏移。雙側規格時以兩側較差者判定。</div>
          <div class="guide-formula">
            • 製程能力指數 Cp = (USL - LSL) / 6σ<br>
            • 上限能力 Cpu = (USL - μ) / 3σ；下限能力 Cpl = (μ - LSL) / 3σ<br>
            • 綜合能力 Cpk = min(Cpu, Cpl) = Cp × (1 - k)
          </div>
        </article>
      `;
    } else if (subView === 'traps') {
      content = `
        <article class="guide-card">
          <div class="guide-trap-header">${icon('cross')} 陷阱 1：外加寬放 vs 內含寬放的公式倒轉</div>
          <div class="trap-wrong">❌ 常見誘答：一律無腦套用 ST = NT × (1 + 寬放率)</div>
          <div class="trap-right">✔ 正確解答：外加法以正常時間為基數 ST = NT × (1 + 寬放率)；內含法以標準時間為基數 ST = NT / (1 - 寬放率)</div>
          <p class="muted">若寬放率為 20%，外加法係數為 1.20；內含法係數為 1 / 0.8 = 1.25。考題若強調「以工作日標準時間為基準」，必須用內含法！</p>
        </article>
        <article class="guide-card">
          <div class="guide-trap-header">${icon('cross')} 陷阱 2：SPC 管制界限 (UCL/LCL) 與工程規格界限 (USL/LSL) 的混淆</div>
          <div class="trap-wrong">❌ 常見誘答：管制界限是由客戶設計圖面或工程規範決定</div>
          <div class="trap-right">✔ 正確解答：規格界限由設計圖決定；管制界限完全依製程統計數據算得 (μ ± 3σ)</div>
          <p class="muted">管制圖「不能」把客戶規格界限直接畫在上面當作管制線；製程穩定並不保證產品符合規格界限。</p>
        </article>
        <article class="guide-card">
          <div class="guide-trap-header">${icon('cross')} 陷阱 3：MRP 淨需求推算中，「排定收貨」是否等於安全庫存？</div>
          <div class="trap-wrong">❌ 常見誘答：把安全庫存當作已到貨供給直接扣抵</div>
          <div class="trap-right">✔ 正確解答：安全庫存是期末保留量；排定收貨是已下達未結清之採購或製令</div>
          <p class="muted">淨需求 = max(0, 毛需求 + 目標安全庫存 - 期初可用庫存 - 排定收貨)。需求日之後才到的物料不能扣抵當期需求。</p>
        </article>
        <article class="guide-card">
          <div class="guide-trap-header">${icon('cross')} 陷阱 4：AOI 光學檢測之「過殺率 (Overkill)」與「漏判率 (Underkill)」</div>
          <div class="trap-wrong">❌ 常見誘答：過殺是把壞品放行給客戶</div>
          <div class="trap-right">✔ 正確解答：過殺 (假警報/虛驚) 是把良品判成不良品；漏判 (致命瑕疵) 是把不良品判成良品放行</div>
          <p class="muted">過殺率會增加重工成本；漏判率會導致客訴與品質災難。高靈敏度雖然能降低漏判，但往往會提高過殺率。</p>
        </article>
        <article class="guide-card">
          <div class="guide-trap-header">${icon('cross')} 陷阱 5：工業物聯網 MQTT 協定與 Modbus 的架構區別</div>
          <div class="trap-wrong">❌ 常見誘答：MQTT 是主從輪詢架構；Modbus 是發布/訂閱</div>
          <div class="trap-right">✔ 正確解答：Modbus 採主從輪詢 (Master/Slave / Client/Server)；MQTT 採 Broker 發布/訂閱架構</div>
          <p class="muted">Modbus 沒有內建語意模型且無法主動推送事件；MQTT 適合低頻寬不穩定網路事件通知；OPC UA 則提供完整物件語意資訊模型。</p>
        </article>
      `;
    } else if (subView === 'pdfs') {
      content = `
        <div class="pdf-grid">
          ${(DATA.pdfs || []).map(p => `
            <article class="pdf-card">
              <div class="pdf-header">
                <div class="pdf-icon">${icon('book')}</div>
                <div class="pdf-meta">
                  <h3>${esc(p.title)}</h3>
                  <small>${esc(p.name)} · ${p.size}</small>
                </div>
              </div>
              <div class="button-row">
                <a class="btn btn-small btn-primary" href="assets/pdf/${p.name}" target="_blank" rel="noopener">${icon('external')}在線開啟</a>
                <a class="btn btn-small" href="assets/pdf/${p.name}" download="${p.name}">${icon('download')}下載 PDF</a>
              </div>
            </article>
          `).join('')}
        </div>
      `;
    }

    return `
      ${intro('STUDY GUIDE & RESOURCES', '備考寶典與核心資源庫', '28 篇單元精讀講義、3D 渲染圖解、互動架構圖、名詞辭典與官方歷屆試題下載。')}
      <div class="guide-tabs" role="tablist">
        ${tabs.map(([key, label]) => `
          <button type="button" class="guide-tab ${subView === key ? 'active' : ''}" data-action="guide-tab" data-tab="${key}">${label}</button>
        `).join('')}
      </div>
      <div id="guide-tab-content">
        ${content}
      </div>
      ${footer()}
    `;
  }

  function examView() {
    return `
      ${intro('FINAL CHALLENGE', '考前，來一場完整演練。', '切換到單選題與計時作答，練習取捨、速度與穩定度。')}
      <div class="exam-grid">
        ${[1, 2].map(s => `
          <section class="exam-card">
            <span class="room-icon ${s === 1 ? 'mint' : 'blue'}">${icon(s === 1 ? 'calendar' : 'network')}</span>
            <div class="eyebrow">SUBJECT 0${s}</div>
            <h2>${s === 1 ? '生產與作業管理基礎' : '智慧製造生產線管理基礎'}</h2>
            <div class="exam-stats">
              <span><strong class="number">50</strong><small>題單選</small></span>
              <span><strong class="number">75</strong><small>分鐘</small></span>
              <span><strong class="number">100</strong><small>分滿分</small></span>
            </div>
            <p>${s === 1 ? '涵蓋 L111～L116 六大單元，每單元均勻抽題。' : '涵蓋 L121～L126 六大單元，每單元均勻抽題。'}<br>時間到將自動交卷；離開頁面後計時仍會持續。</p>
            <button class="btn btn-primary" data-action="start" data-mode="exam" data-subject="${s}">${icon('flag')}開始科目${s === 1 ? '一' : '二'}模擬</button>
          </section>
        `).join('')}
      </div>
      <div class="panel source-panel">
        <h3>關於練習題與正式考試</h3>
        <p>本網站題目為依官方範圍設計的原創練習題與實戰題庫，全庫共收錄 476 題。50題／75分鐘用於模擬正式作答節奏；網站的 80 分通關門檻是遊戲規則，正式獲證標準請依當年度簡章判定（雙科平均 70 分以上，任一科不低於 60 分）。</p>
        <div class="source-links">
          <a href="https://ipd.nat.gov.tw/ipas/certification/SPE/exam-info" target="_blank" rel="noopener">官方考試資訊 ↗</a>
          <a href="https://ipd.nat.gov.tw/ipas/certification/SPE/learning-resources" target="_blank" rel="noopener">官方歷屆試題 ↗</a>
        </div>
      </div>
      ${footer()}
    `;
  }

  function modeName(r) {
    return r.mode === 'exam' ? '科目' + (r.subject === 1 ? '一' : '二') + '模擬' : r.mode === 'review' ? '錯題返修' : r.mode === 'quick' ? '5題快練' : '10題闖關';
  }

  function progressView() {
    const history = [...state.history].reverse();
    return `
      ${intro('GROWTH LOG', '每次解題，都算數。', '看看拿下的部門徽章，也看看還能進步的地方。')}
      <div class="stats-row">
        <div class="stat"><span class="stat-icon">${icon('star')}</span><div><div class="stat-label">累積經驗</div><div class="stat-value number">${fmt(state.xp)}<small>XP</small></div></div></div>
        <div class="stat"><span class="stat-icon">${icon('flame')}</span><div><div class="stat-label">連續學習</div><div class="stat-value number">${E.streak(state)}<small>天</small></div></div></div>
        <div class="stat"><span class="stat-icon">${icon('check')}</span><div><div class="stat-label">已答對不同題目</div><div class="stat-value number">${state.earnedCorrectIds.length}<small>／${bank.length}</small></div></div></div>
      </div>
      <div class="progress-grid">
        <section class="panel">
          <h2 class="medal-title">${icon('badge')}部門成就徽章</h2>
          <div class="badge-grid">
            ${units.map(u => `
              <div class="badge ${state.passedUnits.includes(u.id) ? 'earned' : ''}">
                <div class="badge-emblem">${icon(u.icon)}</div>
                <strong>${u.badge}</strong>
                <small>${u.id} · ${state.best[u.id] !== undefined ? state.best[u.id] + '分' : '未通關'}</small>
              </div>
            `).join('')}
          </div>
          <p class="backup-note">每個部門的10題闖關達80分，即可取得徽章。每題首次答對＋10 XP，部門首次通關另＋50 XP；重複答對同一題不重複累積經驗。</p>
          <h3 style="margin-top:25px">最近任務</h3>
          ${history.length ? history.slice(0, 12).map(r => `
            <button class="history-item" style="width:100%;background:transparent;text-align:left" data-action="report" data-id="${esc(r.runId)}">
              <span><strong>${r.unitId ? r.unitId + ' · ' : ''}${modeName(r)}</strong><small>${new Date(r.completedAt).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' })} · ${r.correct}／${r.total}題答對</small></span>
              <span class="history-score number">${r.score}<small>分</small></span>
            </button>
          `).join('') : '<p class="history-empty">完成第一場任務後，這裡就會留下你的紀錄。</p>'}
        </section>
        <div>
          <section class="panel">
            <h2>保管你的學習進度</h2>
            <p class="backup-note">進度自動儲存在目前瀏覽器。換裝置或清除瀏覽資料前，可先匯出備份，再到新裝置匯入。</p>
            <div class="backup-actions">
              <button class="btn btn-small" data-action="export">${icon('download')}匯出進度</button>
              <button class="btn btn-small" data-action="import">${icon('upload')}匯入進度</button>
            </div>
            <div class="danger-area">
              <p>重新開始會清除此裝置的成績、徽章與作答紀錄。</p>
              <button class="btn btn-small btn-danger" data-action="reset">${icon('trash')}重新開始</button>
            </div>
          </section>
          <section class="panel source-panel">
            <h3>學習資料來源</h3>
            <p>單元依據 115 年度 iPAS 智慧生產工程師初級範圍編排；收錄 476 題自編與實戰練習題，公式依題目指定定義計算。</p>
            <div class="source-links">
              <a href="https://ipd.nat.gov.tw/ipas/certification/SPE/exam-info" target="_blank" rel="noopener">官方範圍 ↗</a>
              <a href="https://www.oee.com/calculating-oee/" target="_blank" rel="noopener">OEE 定義 ↗</a>
              <a href="https://asq.org/quality-resources/seven-basic-quality-tools" target="_blank" rel="noopener">品管工具 ↗</a>
            </div>
          </section>
        </div>
      </div>
      ${footer()}
    `;
  }

  function runQuestions() {
    return (state.active?.questionIds || []).map(id => qmap.get(id)).filter(Boolean);
  }

  function quizView() {
    const run = state.active;
    if (!run) return `
      <div class="empty">
        ${icon('flag')}
        <h2>還沒有進行中的任務</h2>
        <p>選擇一個部門，或進入考前模擬開始作答。</p>
        <button class="btn btn-primary" data-action="nav" data-view="home">回到工廠${icon('arrow')}</button>
      </div>
    `;
    const qs = runQuestions(), unit = byUnit(run.unitId), answers = run.answers;
    return `
      <div class="quiz-top">
        <div>
          <h1>${unit ? unit.room : modeName(run)}</h1>
          <p>${run.unitId ? run.unitId + ' · ' : ''}${modeName(run)} · 答完統一交卷與解析</p>
        </div>
        <div class="button-row">
          ${run.unitId ? `<button type="button" class="quiz-helper-btn" data-action="quiz-helper" data-unit="${run.unitId}">${icon('bulb')}<span>單元重點速記</span></button>` : ''}
          ${run.mode === 'exam' ? `<div id="clock" class="timer number" aria-label="模擬剩餘時間">${icon('clock')}<span>75:00</span></div>` : ''}
          <button class="btn btn-small" aria-label="暫存離開" data-action="nav" data-view="home">${icon('save')}<span>暫存離開</span></button>
        </div>
      </div>
      ${run.mode === 'exam' ? '<div class="exam-warning">模擬採50題單選、75分鐘。時間到自動交卷，未答題以答錯計；離開頁面後仍持續計時。</div>' : ''}
      <div class="quiz-status">
        <div class="quiz-status-line">
          <span>已完成 <strong id="answered-count" class="number">0</strong>／${qs.length} 題</span>
          <span id="save-note" class="muted">進度自動儲存</span>
        </div>
        <div class="question-nav" aria-label="題目導航">
          ${qs.map((q, i) => `<button type="button" class="question-dot ${E.hasAnswer(q, answers[q.id]) ? 'done' : ''}" data-action="jump" data-q="${q.id}" data-qdot="${q.id}" aria-label="跳至第${i + 1}題">${i + 1}</button>`).join('')}
        </div>
      </div>
      <form id="quiz-form" novalidate>
        ${qs.map((q, i) => `
          <article id="question-${q.id}" class="question-card">
            <div class="question-meta">
              <span class="question-no number">${String(i + 1).padStart(2, '0')}</span>
              <span>${q.unit} · ${({ concept: '觀念辨識', scenario: '現場決策', calculation: '計算挑戰' })[q.skill] || '單元挑戰'}</span>
              ${q.kind === 'number' ? '<span class="tag tag-green">輸入數值</span>' : ''}
            </div>
            <h2>${esc(q.stem)}</h2>
            ${q.kind === 'choice' ? `
              <div class="options">
                ${q.options.map((o, j) => `
                  <label class="option">
                    <input type="radio" name="${q.id}" data-answer="${q.id}" value="${j}" ${answers[q.id] === j ? 'checked' : ''}>
                    <span class="option-letter">${'ABCD'[j]}</span>
                    <span>${esc(o)}</span>
                  </label>
                `).join('')}
              </div>
            ` : `
              <label class="sr-only" for="number-${q.id}">第${i + 1}題數值答案，單位${esc(q.answerUnit)}</label>
              <div class="numeric-row">
                <input id="number-${q.id}" type="text" inputmode="decimal" autocomplete="off" data-answer="${q.id}" value="${esc(answers[q.id] ?? '')}" placeholder="輸入計算結果" aria-describedby="error-${q.id}">
                <span class="number-unit">${esc(q.answerUnit)}</span>
              </div>
              <div id="error-${q.id}" class="input-error" aria-live="polite"></div>
            `}
            ${run.mode !== 'exam' ? `
              <details class="hint">
                <summary>${icon('bulb')}需要一點提示</summary>
                <p>${esc(q.hint)}</p>
              </details>
            ` : ''}
          </article>
        `).join('')}
        <div class="quiz-submit">
          <div>
            <strong>完成後，一次看懂解題關鍵。</strong>
            <p id="submit-note">還有${qs.length}題等待你的決定</p>
          </div>
          <button type="submit" id="submit-run" class="btn btn-primary" disabled>提交任務${icon('arrow')}</button>
        </div>
      </form>
      ${footer()}
    `;
  }

  function formatAnswer(q, a) {
    if (!E.hasAnswer(q, a)) return '未作答';
    return q.kind === 'number' ? fmt(E.parseNumber(a)) + ' ' + q.answerUnit : 'ABCD'[a] + '. ' + q.options[a];
  }

  function resultView(id) {
    const r = state.history.find(x => x.runId === id) || lastReport || state.history.at(-1);
    if (!r) return home();
    const u = byUnit(r.unitId), passed = r.score >= 80;
    return `
      <div class="result-hero ${passed ? '' : 'failed'}">
        <div>
          <div class="eyebrow">MISSION REPORT · ${r.unitId || 'MIXED CHALLENGE'}</div>
          <h1>${r.newBadge ? '部門升級，徽章到手！' : r.mode === 'review' ? (r.correct === r.total ? '返修完成，觀念歸位。' : '再修一輪，把觀念補齊。') : passed ? '任務完成，繼續前進。' : '找到弱點，就有改善方向。'}</h1>
          <p>${u ? u.room + ' · ' : ''}${modeName(r)} · ${r.correct}／${r.total}題答對</p>
          <div class="result-chips">
            <span>${icon('star')}+${r.earnedXP} XP</span>
            ${r.newBadge ? `<span>${icon('badge')}${u.badge}</span>` : ''}
            <span>${icon('wrench')}${r.total - r.correct ? (r.total - r.correct) + '題已送返修' : '本次全數答對'}</span>
          </div>
        </div>
        <div class="result-score">
          <b class="number">${r.score}</b>
          <small>練習得分</small>
        </div>
      </div>
      <div class="result-actions">
        <button class="btn btn-primary" data-action="nav" data-view="home">${icon('home')}回到工廠</button>
        ${E.wrongIds(state).length ? `<button class="btn" data-action="review">${icon('wrench')}立即返修</button>` : ''}
        ${u ? `<button class="btn" data-action="poster" data-unit="${u.id}">${icon('book')}看本單元複習圖</button>` : ''}
        ${u ? `<button class="btn" data-action="guide-tab" data-tab="materials" data-subtab="${u.topicCode}">${icon('bulb')}閱讀精讀講義</button>` : ''}
      </div>
      <div class="section-heading">
        <h2>逐題解題報告</h2>
        <span class="muted" style="font-size:11px">答錯不是結束，是下一張改善工單。</span>
      </div>
      ${r.results.map((item, i) => {
        const q = qmap.get(item.id);
        if (!q) return '';
        return `
          <article class="feedback-card ${item.correct ? 'right' : 'wrong'}">
            <div class="feedback-meta">
              ${icon(item.correct ? 'circlecheck' : 'cross')}
              <span>第${i + 1}題 · ${q.unit} · ${item.correct ? '答對' : '待返修'}</span>
            </div>
            <h3>${esc(q.stem)}</h3>
            <div class="answer-lines">
              <div><span>你的答案</span>${esc(formatAnswer(q, item.answer))}</div>
              <div><span>正確答案</span>${esc(formatAnswer(q, q.answer))}</div>
            </div>
            <p class="explanation">${esc(q.explanation)}</p>
            <div class="button-row" style="margin-top:10px">
              <button class="text-link feedback-poster" data-action="poster" data-unit="${q.unit}">${icon('book')}查看${q.unit}複習圖</button>
            </div>
          </article>
        `;
      }).join('')}
      ${footer()}
    `;
  }

  function render() {
    const r = route();
    let body;
    if (r.view === 'home') body = home();
    else if (r.view === 'unit') body = unitView(r.arg);
    else if (r.view === 'atlas') body = atlas();
    else if (r.view === 'repair') body = repair();
    else if (r.view === 'guide') body = guideView(r.arg || 'materials', r.subArg);
    else if (r.view === 'exam') body = examView();
    else if (r.view === 'progress') body = progressView();
    else if (r.view === 'quiz') body = quizView();
    else if (r.view === 'result') body = resultView(r.arg);
    else { go('home'); return; }

    app.innerHTML = shell(body, r.view);
    document.title = `${({ home: '學習工廠', unit: byUnit(r.arg)?.room, quiz: '任務挑戰', result: '任務報告', repair: '返修中心', atlas: '複習圖鑑', guide: '備考寶典', exam: '考前模擬', progress: '成長紀錄' })[r.view] || '智造闖關'}｜智造闖關 Factory Quest`;
    if (r.view === 'quiz') { updateQuizStatus(); tick(); }
    setTimeout(renderMermaidDiagrams, 50);
  }

  function start(mode, unitId = null, subject = null, force = false) {
    if (state.active && !force) {
      modal(`
        <button class="modal-close" data-action="close" aria-label="關閉">${icon('cross')}</button>
        <h2>上一張任務還在進行中</h2>
        <p>可以接著完成目前作答，或放下未交卷的答案，開啟新的挑戰。已交卷的成績與徽章會保留。</p>
        <div class="button-row">
          <button class="btn btn-primary" data-action="resume">繼續原任務</button>
          <button class="btn" data-action="force-start" data-mode="${mode}" data-unit="${unitId || ''}" data-subject="${subject || ''}">開始新任務</button>
        </div>
      `);
      return;
    }
    let qs;
    try {
      qs = E.select(bank, { mode, unitId, subject, wrongIds: E.wrongIds(state) });
    } catch (e) {
      toast(e.message);
      return;
    }
    if (!qs.length) {
      toast(mode === 'review' ? '目前沒有待返修題目。' : '題庫尚未準備完成。');
      return;
    }
    closeModal();
    state.active = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'r' + Date.now() + Math.random().toString(36).slice(2),
      mode,
      unitId,
      subject,
      questionIds: qs.map(q => q.id),
      answers: {},
      startedAt: Date.now()
    };
    save();
    go('quiz');
  }

  function updateQuizStatus() {
    const run = state.active;
    if (!run) return;
    const qs = runQuestions(), count = qs.filter(q => E.hasAnswer(q, run.answers[q.id])).length;
    const counter = document.getElementById('answered-count');
    if (!counter) return;
    counter.textContent = count;
    const note = document.getElementById('submit-note');
    if (note) note.textContent = count === qs.length ? '全部完成，準備查看你的任務報告' : '還有' + (qs.length - count) + '題等待你的決定';
    const subBtn = document.getElementById('submit-run');
    if (subBtn) subBtn.disabled = count !== qs.length;
    qs.forEach(q => document.querySelector(`[data-qdot="${q.id}"]`)?.classList.toggle('done', E.hasAnswer(q, run.answers[q.id])));
  }

  function submit(auto = false) {
    const run = state.active;
    if (!run) return;
    if (!auto && !runQuestions().every(q => E.hasAnswer(q, run.answers[q.id]))) {
      toast('請先完成所有題目，再提交任務。');
      return;
    }
    const result = E.grade(state, run, bank);
    state = result.state;
    lastReport = result.report;
    save();
    closeModal();
    go('result', result.report.runId);
    if (auto) toast('模擬時間到，已自動交卷。');
  }

  function tick() {
    const run = state.active;
    if (!run || run.mode !== 'exam') return;
    const remaining = Math.max(0, 75 * 60 - Math.floor((Date.now() - run.startedAt) / 1000));
    const clock = document.getElementById('clock');
    if (clock) {
      clock.querySelector('span').textContent = String(Math.floor(remaining / 60)).padStart(2, '0') + ':' + String(remaining % 60).padStart(2, '0');
      clock.classList.toggle('urgent', remaining < 300);
    }
    if (remaining === 0) submit(true);
  }

  function exportProgress() {
    const payload = { ...state, exportedAt: new Date().toISOString() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'factory-quest-progress-' + E.dateKey() + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('進度備份已匯出。');
  }

  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = '.json,application/json';
  importInput.hidden = true;
  document.body.appendChild(importInput);
  importInput.addEventListener('change', async () => {
    const f = importInput.files[0];
    if (!f) return;
    try {
      if (f.size > 2000000) throw new Error('備份檔案太大，請選擇本網站匯出的進度。');
      const raw = JSON.parse(await f.text());
      if (raw.version !== 1 || !Array.isArray(raw.earnedCorrectIds) || !raw.best || !Array.isArray(raw.history)) throw new Error('這不是有效的智造闖關進度檔。');
      const incoming = E.restore(raw, bank);
      modal(`
        <button class="modal-close" data-action="close" aria-label="關閉">${icon('cross')}</button>
        <h2>匯入這份學習進度？</h2>
        <p>備份包含${incoming.passedUnits.length}個已通關部門與${incoming.xp} XP。匯入後會取代目前裝置的進度。</p>
        <div class="button-row">
          <button class="btn btn-primary" id="confirm-import">匯入並取代</button>
          <button class="btn" data-action="close">保留目前進度</button>
        </div>
      `);
      document.getElementById('confirm-import').addEventListener('click', () => {
        state = incoming;
        lastReport = null;
        save();
        closeModal();
        go('progress');
        toast('進度已匯入。');
      });
    } catch (e) {
      toast(e.message || '無法讀取進度備份。');
    }
    importInput.value = '';
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b || b.disabled) return;
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
        filter = b.dataset.filter === 'all' ? 'all' : Number(b.dataset.filter);
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
      case 'guide-tab':
        go('guide', b.dataset.tab, b.dataset.subtab || '');
        break;
      case 'prev-material': {
        const curIdx = topicList.indexOf(currentMaterialTopic);
        if (curIdx > 0) {
          currentMaterialTopic = topicList[curIdx - 1];
          go('guide', 'materials', currentMaterialTopic);
        }
        break;
      }
      case 'next-material': {
        const curIdx = topicList.indexOf(currentMaterialTopic);
        if (curIdx < topicList.length - 1) {
          currentMaterialTopic = topicList[curIdx + 1];
          go('guide', 'materials', currentMaterialTopic);
        }
        break;
      }
      case 'close':
        closeModal();
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
      case 'jump':
        document.getElementById('question-' + b.dataset.q)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
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
        state = E.emptyState();
        lastReport = null;
        save();
        closeModal();
        go('home');
        toast('已重新開始。');
        break;
    }
  });

  document.addEventListener('change', e => {
    if (e.target.id === 'topbar-guide-select' || e.target.id === 'material-page-select') {
      const val = e.target.value;
      if (val.startsWith('tab:')) {
        const tab = val.replace('tab:', '');
        go('guide', tab);
      } else if (val.startsWith('topic:')) {
        const topic = val.replace('topic:', '');
        currentMaterialTopic = topic;
        go('guide', 'materials', topic);
      }
    }
  });

  document.addEventListener('input', e => {
    if (e.target.id === 'glossary-input') {
      guideSearch = e.target.value;
      const q = guideSearch.trim().toLowerCase();
      const list = (DATA.glossary || []).filter(item => {
        if (!q) return true;
        return (item.abbreviation && item.abbreviation.toLowerCase().includes(q)) ||
               (item.chinese && item.chinese.toLowerCase().includes(q)) ||
               (item.english && item.english.toLowerCase().includes(q));
      });
      const grid = document.querySelector('.glossary-grid');
      if (grid) {
        grid.innerHTML = list.map(t => `
          <article class="glossary-card">
            <span class="glossary-abbr">${esc(t.abbreviation)}</span>
            <div class="glossary-zh">${esc(t.chinese)}</div>
            <div class="glossary-en">${esc(t.english)}</div>
          </article>
        `).join('');
      }
      return;
    }
    const id = e.target.dataset.answer;
    if (!id || !state.active) return;
    const q = qmap.get(id);
    if (!q) return;
    state.active.answers[id] = q.kind === 'choice' ? Number(e.target.value) : e.target.value;
    save();
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

  window.addEventListener('hashchange', render);
  window.addEventListener('load', () => setTimeout(renderMermaidDiagrams, 100));
  window.addEventListener('storage', e => {
    if (e.key === KEY && e.newValue) {
      try {
        state = E.restore(JSON.parse(e.newValue), bank);
        render();
      } catch {}
    }
  });

  setInterval(tick, 1000);
  render();
})();
