(function () {
  'use strict';
  const groups = [
    { id: 'subject1', name: '科目一', title: '生產與作業管理基礎', codes: ['M11101', 'M11102', 'M11103', 'M11201', 'M11202', 'M11203'] },
    { id: 'subject2', name: '科目二', title: '智慧製造生產線管理基礎', codes: ['M12101', 'M12102', 'M12103', 'M12201', 'M12202', 'M12203'] },
    { id: 'practical', name: '術科準備', title: '現場實作與評分標準', codes: ['M13101', 'M13201'] },
    { id: 'intermediate', name: '中級進階', title: '智慧製造工程師', codes: ['M21101', 'M21102', 'M21201', 'M21202', 'M22101', 'M22102', 'M22201', 'M22202', 'M22301'] },
    { id: 'appendix', name: '延伸閱讀', title: '考綱、書目與實戰練習', codes: ['APPX03', 'APPX04', 'APPX05'] },
  ];
  const tabs = ['materials', 'glossary', 'formulas', 'traps'];
  const libraryState = { query: '', group: 'all' };

  function catalog({ DATA, units, icon, esc }) {
    const materials = DATA.studyMaterials || [];
    const count = groups.reduce((sum, group) => sum + group.codes.filter(code => materials.some(m => m.topicCode === code)).length, 0);
    return `
      <section class="guide-library" aria-labelledby="library-title">
        <div class="library-intro"><div><div class="eyebrow">CHAPTER COLLECTION</div><h2 id="library-title">從一個章節開始</h2><p>依考試科目循序閱讀，或搜尋想複習的主題。</p></div><span>${count} 篇講義</span></div>
        <div class="library-filters">
          <div class="library-search"><label for="library-search" class="sr-only">搜尋講義</label>${icon('search')}<input id="library-search" type="search" placeholder="搜尋章節、關鍵字或單元代碼" value="${esc(libraryState.query)}" autocomplete="off"></div>
          <label class="library-select"><span class="sr-only">篩選講義分類</span><select id="library-group"><option value="all">全部分類</option>${groups.map(g => `<option value="${g.id}" ${libraryState.group === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}</select></label>
        </div>
        <p id="library-result" class="library-result" role="status">共 ${count} 篇講義</p>
        <div class="library-groups">
          ${groups.map((group, groupIndex) => `<section class="library-group" data-group="${group.id}">
            <header class="library-group-heading"><span>0${groupIndex + 1}</span><div><small>${group.name}</small><h3>${group.title}</h3></div><span class="library-group-count">${group.codes.length} 篇</span></header>
            <div class="library-grid">${group.codes.map(code => {
              const material = materials.find(m => m.topicCode === code);
              if (!material) return '';
              const unit = units.find(u => u.topicCode === code);
              const keywords = [code, unit?.id, material.title, material.summary, ...(material.coreConcepts || [])].filter(Boolean).join(' ').toLowerCase();
              return `<a class="library-entry" href="#/guide/materials/${code}" data-search="${esc(keywords)}">
                <span class="library-entry-code">${esc(unit?.id || code)}</span>
                <h4>${esc(material.title)}</h4><p>${esc(material.summary || '核心概念、圖解與應試重點。')}</p>
                <span class="library-entry-link">閱讀講義${icon('arrow')}</span>
              </a>`;
            }).join('')}</div>
          </section>`).join('')}
        </div>
        <div id="library-empty" class="guide-empty" role="status" hidden>${icon('book')}<h3>找不到符合的講義</h3><p>試試其他關鍵字，或切換到全部分類。</p><button class="btn btn-small" data-action="clear-library">清除篩選</button></div>
      </section>`;
  }

  function glossaryRows(DATA, query, esc) {
    const q = query.trim().toLowerCase();
    const list = [...(DATA.glossary || [])].sort((a, b) =>
      (a.abbreviation || '').localeCompare(b.abbreviation || '', 'en', { sensitivity: 'base', numeric: true })
    ).filter(item => [item.abbreviation, item.chinese, item.english].some(value => (value || '').toLowerCase().includes(q)));
    return { count: list.length, html: list.length ? list.map(item => `<tr>
      <td class="glossary-td-abbr"><span class="glossary-abbr">${esc(item.abbreviation)}</span></td>
      <td class="glossary-td-en">${esc(item.english)}</td><td class="glossary-td-zh">${esc(item.chinese)}</td>
    </tr>`).join('') : '<tr><td colspan="3" class="guide-empty">沒有符合的名詞，請試試其他關鍵字。</td></tr>' };
  }

  function glossary({ DATA, guideSearch, esc, icon }) {
    const rows = glossaryRows(DATA, guideSearch, esc);
    return `<section class="guide-glossary" aria-labelledby="glossary-title">
      <div class="library-intro"><div><div class="eyebrow">GLOSSARY</div><h2 id="glossary-title">讀懂每一個專業名詞</h2><p>縮寫、英文全名與中文對照，依 A–Z 排列。</p></div></div>
      <div class="guide-search"><label for="glossary-input" class="sr-only">搜尋專有名詞</label><span class="search-icon">${icon('search')}</span><input type="search" id="glossary-input" placeholder="搜尋縮寫、英文或中文，例如 OEE、庫存" value="${esc(guideSearch)}"></div>
      <p id="glossary-result" class="library-result" role="status">顯示 ${rows.count} / ${DATA.glossary?.length || 0} 個名詞</p>
      <div class="glossary-table-wrap" tabindex="0" role="region" aria-label="中英名詞對照表，可左右捲動"><table class="glossary-table"><caption class="sr-only">專有名詞中英對照</caption><thead><tr><th scope="col">縮寫</th><th scope="col">英文全名</th><th scope="col">中文</th></tr></thead><tbody id="glossary-tbody">${rows.html}</tbody></table></div>
    </section>`;
  }

  function render(context) {
    const { DATA, footer, selectedTopic } = context;
    const subView = tabs.includes(context.subView) ? context.subView : 'materials';
    let content;
    if (subView === 'glossary') content = glossary(context);
    else if (subView === 'materials' && !selectedTopic) content = catalog(context);
    else {
      const code = subView === 'formulas' ? 'APPX01' : subView === 'traps' ? 'APPX02' : selectedTopic;
      content = window.FactoryReading.render({
        ...context, materials: DATA.studyMaterials || [],
        material: (DATA.studyMaterials || []).find(m => m.topicCode === code),
        reference: subView !== 'materials',
      });
    }
    return `<div class="guide-workspace">
      <div id="guide-tab-content">${content}</div>
      ${footer()}
    </div>`;
  }

  function filterCatalog(reset = false) {
    const search = document.getElementById('library-search');
    const select = document.getElementById('library-group');
    if (!search || !select) return;
    if (reset) { search.value = ''; select.value = 'all'; }
    libraryState.query = search.value;
    libraryState.group = select.value;
    const query = search.value.trim().toLowerCase();
    let count = 0;
    for (const group of document.querySelectorAll('.library-group')) {
      let visible = 0;
      for (const entry of group.querySelectorAll('.library-entry')) {
        entry.hidden = !(select.value === 'all' || select.value === group.dataset.group) || !entry.dataset.search.includes(query);
        if (!entry.hidden) visible++;
      }
      group.hidden = visible === 0;
      group.querySelector('.library-group-count').textContent = `${visible} 篇`;
      count += visible;
    }
    document.getElementById('library-result').textContent = `共 ${count} 篇講義${query ? ` · 搜尋「${search.value.trim()}」` : ''}`;
    document.getElementById('library-empty').hidden = count > 0;
    if (reset) search.focus();
  }

  function updateGlossary(DATA, query, esc) {
    const rows = glossaryRows(DATA, query, esc);
    const body = document.getElementById('glossary-tbody');
    if (body) body.innerHTML = rows.html;
    const result = document.getElementById('glossary-result');
    if (result) result.textContent = `顯示 ${rows.count} / ${DATA.glossary?.length || 0} 個名詞`;
  }

  window.FactoryGuide = { render, filterCatalog, updateGlossary, mount: () => filterCatalog() };
})();
