import type { Topic } from '@/core/types';
import type { DiagramController, DiagramState } from '@/core/interactive-diagram';
import { getUnitSummaryAsset } from '@/data/unit-summary-diagrams';
import { createUnitSummaryReader } from '@/components/UnitSummaryReader';
import { h } from '@/utils/render';
import { prepareInteractiveDiagram } from '@/utils/interactive-diagrams';
import { saveSummaryPreferences } from '@/utils/unit-summary-preferences';

/** One chapter entrance for the interactive overview and its readable semantic guide. */
export function appendUnitSummary(container: HTMLElement, topic: Topic): void {
  const assetUrl = getUnitSummaryAsset(topic.code);
  if (!assetUrl) return;
  const prefix = `unit-summary-${topic.code}`;
  const section = h('section', {
    className: 'unit-summary', 'aria-labelledby': prefix,
    'data-no-terminology': 'true', 'data-unit-summary': topic.code,
  });
  const heading = h('h2', { id: prefix, className: 'study-h2 unit-summary__title' }, '單元總結・互動關聯圖');
  const description = h('p', { className: 'unit-summary__description' },
    '用全圖掌握主線，切換清晰閱讀放大節點；文字導讀可逐一複習概念與關係。');
  const makeButton = (label: string, name: string, action: () => void): HTMLButtonElement => {
    const button = h('button', { type: 'button', className: 'unit-summary__view-button', 'aria-label': name, title: name }, label);
    button.addEventListener('click', action);
    return button;
  };
  let controller: DiagramController | null = null;
  let graphReady = false;
  let pendingNodeId = '';
  const graphPanel = h('div', { id: `${prefix}-graph`, role: 'tabpanel', 'aria-labelledby': `${prefix}-graph-tab` });
  const readerPanel = h('div', { id: `${prefix}-reader`, role: 'tabpanel', 'aria-labelledby': `${prefix}-reader-tab`, hidden: '' });
  const graphTab = h('button', {
    id: `${prefix}-graph-tab`, role: 'tab', type: 'button', className: 'unit-summary__tab',
    'aria-controls': graphPanel.id, 'aria-selected': 'true',
  }, '互動圖');
  const readerTab = h('button', {
    id: `${prefix}-reader-tab`, role: 'tab', type: 'button', className: 'unit-summary__tab',
    'aria-controls': readerPanel.id, 'aria-selected': 'false', tabindex: '-1',
  }, '文字導讀');
  const tabs = h('div', { className: 'unit-summary__tabs', role: 'tablist', 'aria-label': '單元總結閱讀方式' }, graphTab, readerTab);
  const reader = createUnitSummaryReader(topic.code, (nodeId) => {
    showTab('graph');
    if (graphReady) { controller?.command('focus-node', nodeId); frame.focus(); }
    else { pendingNodeId = nodeId; controller?.retry(); }
  });
  readerPanel.appendChild(reader.element);
  function showTab(view: 'graph' | 'reader'): void {
    const isGraph = view === 'graph';
    graphPanel.hidden = !isGraph;
    readerPanel.hidden = isGraph;
    for (const [tab, active] of [[graphTab, isGraph], [readerTab, !isGraph]] as const) {
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    if (isGraph) requestAnimationFrame(() => controller?.command('sync'));
    else void reader.load();
  }
  graphTab.addEventListener('click', () => showTab('graph'));
  readerTab.addEventListener('click', () => showTab('reader'));
  tabs.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target = event.key === 'Home' ? graphTab : event.key === 'End' ? readerTab
      : document.activeElement === graphTab ? readerTab : graphTab;
    showTab(target === graphTab ? 'graph' : 'reader');
    target.focus();
  });
  const overview = makeButton('全圖', '顯示完整關聯圖', () => {
    saveSummaryPreferences({ mode: 'overview' }); controller?.command('overview');
  });
  const readable = makeButton('清晰閱讀', '自動放大節點文字', () => {
    saveSummaryPreferences({ mode: 'readable' }); controller?.command('readable');
  });
  const zoomOut = makeButton('−', '縮小互動圖與文字', () => controller?.command('zoom-out'));
  const zoomIn = makeButton('＋', '放大互動圖與文字', () => controller?.command('zoom-in'));
  const scale = h('output', { className: 'unit-summary__scale', 'aria-label': '圖表縮放比例' }, '—');
  const modeGroup = h('div', { className: 'unit-summary__view-controls', role: 'group', 'aria-label': '圖表閱讀比例' }, overview, readable);
  const zoomGroup = h('div', { className: 'unit-summary__zoom', role: 'group', 'aria-label': '互動圖縮放控制' }, zoomOut, scale, zoomIn);
  const expand = makeButton('展開閱讀', '全螢幕閱讀互動總結', () => {
    const action = document.fullscreenElement === section ? document.exitFullscreen() : section.requestFullscreen();
    void action.catch(() => { hint.textContent = '可使用「另開完整互動圖」取得更大的閱讀空間。'; });
  });
  expand.hidden = !document.fullscreenEnabled;
  const fullView = h('a', {
    href: assetUrl, target: '_blank', rel: 'noopener noreferrer', className: 'unit-summary__link',
    'aria-label': `另開${topic.name}完整互動總結圖`,
  }, '另開完整圖 ↗');
  const toolbar = h('div', { className: 'unit-summary__toolbar' }, modeGroup, zoomGroup, expand, fullView);
  const hint = h('p', { className: 'unit-summary__hint' }, '正在準備互動圖…');
  const figure = h('figure', { className: 'unit-summary__figure', 'aria-busy': 'true' });
  const frame = h('iframe', {
    className: 'unit-summary__frame', title: `${topic.name}：單元互動總結`,
    sandbox: 'allow-scripts allow-downloads', allow: 'fullscreen; clipboard-write',
    allowfullscreen: '', referrerpolicy: 'no-referrer',
  });
  const statusText = h('p', { role: 'status', 'aria-live': 'polite' }, '互動圖載入中…');
  const retry = makeButton('重新載入互動圖', '重新載入互動圖', () => controller?.retry());
  retry.hidden = true;
  const status = h('div', { className: 'unit-summary__load-status' }, h('span', { className: 'unit-summary__spinner', 'aria-hidden': 'true' }), statusText, retry);
  const controls = [overview, readable, zoomOut, zoomIn];
  controls.forEach((button) => { button.disabled = true; });
  frame.addEventListener('diagram-state', (event) => {
    const state = (event as CustomEvent<DiagramState>).detail;
    const ready = state.status === 'ready';
    graphReady = ready;
    section.dataset.diagramMode = state.mode;
    status.hidden = ready;
    frame.classList.toggle('unit-summary__frame--ready', ready);
    figure.classList.toggle('unit-summary__figure--error', state.status === 'error');
    controls.forEach((button) => { button.disabled = !ready; });
    zoomOut.disabled = !ready || state.scale <= .25;
    zoomIn.disabled = !ready || state.scale >= 3;
    overview.setAttribute('aria-pressed', String(ready && state.mode === 'overview'));
    readable.setAttribute('aria-pressed', String(ready && state.mode === 'readable'));
    scale.textContent = ready ? `${Math.round(state.scale * 100)}%` : '—';
    retry.hidden = state.status !== 'error';
    statusText.textContent = state.message ?? '互動圖載入中…';
    hint.textContent = !ready ? state.message ?? '圖表載入後即可縮放與點選概念。'
      : state.mode === 'overview' ? '全圖顯示所有關係；可切換清晰閱讀，或使用文字導讀。'
        : '拖曳畫布查看其他節點；文字導讀提供大字概念與關係說明。';
    if (state.nodeId) reader.select(state.nodeId);
    if (ready && pendingNodeId) {
      const nodeId = pendingNodeId;
      pendingNodeId = '';
      controller?.command('focus-node', nodeId);
    }
  });
  figure.append(frame, status);
  graphPanel.append(toolbar, hint, figure);
  section.append(heading, description, tabs, graphPanel, readerPanel);
  container.appendChild(section);
  controller = prepareInteractiveDiagram(frame, assetUrl);
  const onFullscreen = (): void => {
    const expanded = document.fullscreenElement === section;
    expand.textContent = expanded ? '離開全螢幕' : '展開閱讀';
    expand.setAttribute('aria-label', expanded ? '離開全螢幕閱讀' : '全螢幕閱讀互動總結');
    expand.setAttribute('aria-pressed', String(expanded));
    controller?.command('sync');
  };
  const route = location.hash;
  const onTeardown = (): void => {
    if (!section.isConnected && location.hash === route) return;
    controller?.destroy();
    reader.destroy();
    document.removeEventListener('fullscreenchange', onFullscreen);
    window.removeEventListener('route-teardown', onTeardown);
    if (document.fullscreenElement === section) void document.exitFullscreen();
  };
  document.addEventListener('fullscreenchange', onFullscreen);
  window.addEventListener('route-teardown', onTeardown);
}
