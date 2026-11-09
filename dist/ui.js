(function () { 'use strict';
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
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    badge: '<path d="m12 2 8 4-1 11-7 5-7-5L4 6l8-4Z"/><path d="m8 11 3 3 5-6"/>',
    spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
    arrowup: '<path d="m5 15 7-7 7 7M12 8v13"/>',
    chevrondown: '<path d="m6 9 6 6 6-6"/>',
    chevronup: '<path d="m18 15-6-6-6 6"/>',
    chevronright: '<path d="m9 18 6-6-6-6"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    trash: '<path d="M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>'
  };
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.factory}</svg>`;
const fmt = n => new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 3 }).format(n);
function modeName(r) {
    if (r.mode === 'unseen') return '未練題目練習';
    if (r.mode === 'quick' && (r.questionIds?.length || r.total) === 1) return '單題練習';
    return r.mode === 'exam' ? '科目' + (r.subject === 1 ? '一' : '二') + '模擬' : r.mode === 'review' ? '到期複習' : r.mode === 'quick' ? '5題快練' : '10題闖關';
  }
function footer() {
    return `<footer class="footnote"><span>iPAS 智慧生產工程師 · 初級兩科學科</span><a href="https://ipd.nat.gov.tw/ipas/certification/SPE/exam-info" target="_blank" rel="noopener">官方考試資訊 ${icon('external')}</a></footer>`;
  }
function preview(src) {
    const image = window.FactoryPreviews?.[src];
    return `src="${esc(image?.src || src)}" ${image ? `width="${image.width}" height="${image.height}"` : ''} loading="lazy" decoding="async"`;
  }
window.FactoryUI = { esc, icon, fmt, modeName, footer, preview };
})();
