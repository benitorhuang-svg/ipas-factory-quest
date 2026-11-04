import type { SummaryReaderData } from '@/core/interactive-diagram';
import { getUnitSummaryReaderAsset } from '@/data/unit-summary-diagrams';
import { h } from '@/utils/render';
import { readSummaryPreferences, saveSummaryPreferences } from '@/utils/unit-summary-preferences';

const readers = new Map<string, SummaryReaderData>();

export function createUnitSummaryReader(code: string, locate: (nodeId: string) => void) {
  const element = h('div', { className: 'unit-summary-reader' });
  const status = h('p', { className: 'unit-summary-reader__status', role: 'status' }, '開啟導讀後載入本章概念。');
  const content = h('div', { className: 'unit-summary-reader__content' });
  const retry = h('button', { type: 'button', className: 'unit-summary__view-button', hidden: '' }, '重新載入文字導讀');
  const select = h('select', { 'aria-label': '選擇本章概念', className: 'unit-summary-reader__select' });
  const largeText = h('button', { type: 'button', className: 'unit-summary__view-button' }, '加大文字');
  let large = readSummaryPreferences().largeText;
  const updateSize = (): void => {
    element.classList.toggle('unit-summary-reader--large', large);
    largeText.setAttribute('aria-pressed', String(large));
  };
  updateSize();
  largeText.addEventListener('click', () => { large = !large; updateSize(); saveSummaryPreferences({ largeText: large }); });
  const nav = h('div', { className: 'unit-summary-reader__toolbar' },
    h('label', { className: 'unit-summary-reader__label' }, h('span', {}, '逐一閱讀概念'), select), largeText);
  const detail = h('article', { className: 'unit-summary-reader__detail', 'aria-label': '概念與關係導讀' });
  const notes = h('details', { className: 'unit-summary-reader__notes' }, h('summary', {}, '本章複習重點與易混淆處'));
  content.append(nav, detail, notes);
  content.hidden = true;
  element.append(status, retry, content);
  let data: SummaryReaderData | null = null;
  let selectedId = '';
  let loading = false;
  let destroyed = false;
  let request: AbortController | null = null;

  function choose(id: string): void {
    selectedId = id;
    if (!data) return;
    const node = data.nodes.find((item) => item.id === id) ?? data.nodes[0];
    if (!node) return;
    select.value = node.id;
    const position = data.nodes.indexOf(node);
    const eyebrow = h('p', { className: 'unit-summary-reader__eyebrow' }, `${position + 1} / ${data.nodes.length} · ${node.kind}`);
    const title = h('h3', { tabindex: '-1' }, node.label);
    const description = h('p', {}, node.detail || '由下列關係理解本概念在單元中的位置。');
    const focus = h('button', { type: 'button', className: 'unit-summary__view-button' }, '在互動圖中定位');
    focus.addEventListener('click', () => locate(node.id));
    detail.replaceChildren(eyebrow, title, description, focus);
    for (const direction of ['incoming', 'outgoing'] as const) {
      const relations = data.relations.filter((relation) => (direction === 'incoming' ? relation.to : relation.from) === node.id);
      if (!relations.length) continue;
      const list = h('ul', { className: 'unit-summary-reader__relations' });
      for (const relation of relations) {
        const peerId = direction === 'incoming' ? relation.from : relation.to;
        const peer = data.nodes.find((item) => item.id === peerId)!;
        const peerButton = h('button', { type: 'button', className: 'unit-summary-reader__peer' }, peer.label);
        peerButton.addEventListener('click', () => navigate(peer.id));
        list.appendChild(h('li', {}, peerButton, h('span', {}, relation.label)));
      }
      detail.append(h('h4', {}, direction === 'incoming' ? '連到這裡的概念' : '由這裡延伸的概念'), list);
    }
    const previous = h('button', { type: 'button', className: 'unit-summary__view-button' }, '← 上一概念');
    const next = h('button', { type: 'button', className: 'unit-summary__view-button' }, '下一概念 →');
    previous.disabled = position === 0;
    next.disabled = position === data.nodes.length - 1;
    previous.addEventListener('click', () => navigate(data!.nodes[position - 1].id));
    next.addEventListener('click', () => navigate(data!.nodes[position + 1].id));
    detail.appendChild(h('nav', { className: 'unit-summary-reader__steps', 'aria-label': '概念閱讀順序' }, previous, next));
  }
  function navigate(id: string): void {
    choose(id);
    detail.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true });
    detail.scrollIntoView({ block: 'nearest' });
  }
  select.addEventListener('change', () => choose(select.value));
  function render(loaded: SummaryReaderData): void {
    data = loaded;
    select.replaceChildren(...data.nodes.map((node, index) => h('option', { value: node.id }, `${index + 1}. ${node.label}`)));
    notes.replaceChildren(h('summary', {}, '本章複習重點與易混淆處'));
    for (const note of data.notes) {
      notes.append(h('h4', {}, note.title), h('ul', {}, ...note.items.map((item) => h('li', {}, item))));
    }
    content.hidden = false;
    status.hidden = true;
    retry.hidden = true;
    choose(selectedId || data.nodes[0]?.id);
  }
  async function load(): Promise<void> {
    if (destroyed || loading || data) return;
    const asset = getUnitSummaryReaderAsset(code);
    if (!asset) return;
    const cached = readers.get(code);
    if (cached) { render(cached); return; }
    loading = true;
    retry.hidden = true;
    status.hidden = false;
    status.textContent = '正在載入本章文字導讀…';
    request = new AbortController();
    const timer = window.setTimeout(() => request?.abort(), 15_000);
    try {
      const response = await fetch(asset, { signal: request.signal });
      if (!response.ok) throw new Error(`Reader response ${response.status}`);
      const loaded = await response.json() as SummaryReaderData;
      if (loaded.schemaVersion !== 1 || loaded.code !== code || !loaded.nodes?.length || !Array.isArray(loaded.relations)) {
        throw new Error('Invalid summary reader.');
      }
      if (destroyed) return;
      readers.set(code, loaded);
      render(loaded);
    } catch {
      if (!destroyed) { status.textContent = '文字導讀暫時無法載入，請重試。'; retry.hidden = false; }
    } finally { clearTimeout(timer); loading = false; }
  }
  retry.addEventListener('click', () => { void load(); });
  return { element, load, select: choose, destroy: () => { destroyed = true; request?.abort(); } };
}
