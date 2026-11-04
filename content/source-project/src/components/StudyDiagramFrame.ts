import type { StudyGraph } from '@/core/study-diagram';
import { h } from '@/utils/render';
import { plainDiagramText } from '@/utils/study-diagram-label';

const kindNames: Record<string, string> = {
  steps: '步驟流程', decision: '條件決策', groups: '分組關係', flow: '流程關係',
  planning: '規劃泳道', sequenceDiagram: '互動時序', 'stateDiagram-v2': '狀態轉移',
};
let frameSequence = 0;

function textGuide(graph: StudyGraph): HTMLElement {
  const details = h('details', { className: 'study-diagram__guide' });
  details.appendChild(h('summary', {}, '文字導讀與流程關係'));
  const nodes = h('dl', { className: 'study-diagram__terms' });
  graph.nodes.forEach((node, index) => {
    nodes.appendChild(h('dt', {}, `${String(index + 1).padStart(2, '0')}`));
    nodes.appendChild(h('dd', {}, plainDiagramText(node.label)));
  });
  details.appendChild(nodes);
  if (graph.edges.length) {
    const list = h('ul', { className: 'study-diagram__relations' });
    const name = (id: string): string => plainDiagramText(graph.nodes.find((node) => node.id === id)?.label
      ?? graph.groups.find((group) => group.id === id)?.title ?? id).split('\n')[0];
    for (const edge of graph.edges) list.appendChild(h('li', {},
      `${name(edge.from)} ${edge.bidirectional ? '↔' : edge.type === 'arrow_open' ? '—' : '→'} ${name(edge.to)}${edge.label ? `｜${edge.label}` : ''}`));
    details.appendChild(list);
  }
  return details;
}

/** Shared reader controls for native layouts and the specialist Mermaid renderers. */
export function createStudyDiagramFrame(content: HTMLElement, title: string, kind: string, graph: StudyGraph | null): HTMLElement {
  const figure = h('figure', { className: 'study-diagram', 'data-no-terminology': 'true', 'data-diagram-kind': kind });
  const id = `study-diagram-${++frameSequence}`;
  const route = location.hash;
  const heading = h('figcaption', { className: 'study-diagram__heading', id },
    h('span', { className: 'study-diagram__type' }, kindNames[kind] ?? '學習圖解'),
    h('strong', {}, title));
  const actions = h('div', { className: 'study-diagram__actions', role: 'group', 'aria-label': '圖表閱讀工具' });
  const makeButton = (label: string, text: string): HTMLButtonElement => h('button', { type: 'button', title: label, 'aria-label': label }, text);
  const smaller = makeButton('縮小圖表', '−'); const reset = makeButton('重設圖表大小', '100%');
  const larger = makeButton('放大圖表', '＋'); const expand = makeButton('展開圖表閱讀', '⛶ 展開');
  actions.append(smaller, reset, larger, expand);
  const top = h('div', { className: 'study-diagram__toolbar' }, heading, actions);
  const viewport = h('div', { className: 'study-diagram__viewport', tabindex: '0', role: 'region', 'aria-labelledby': id }, content);
  figure.append(top, viewport);
  const footer = h('div', { className: 'study-diagram__footer' });
  footer.appendChild(h('span', {}, graph ? `${graph.nodes.length} 個節點 · ${graph.edges.length} 組關係` : '可放大檢視與水平捲動'));
  if (graph?.edges.some((edge) => edge.bidirectional)) footer.appendChild(h('span', {}, '↔ 雙向關係'));
  if (graph?.edges.some((edge) => edge.dashed)) footer.appendChild(h('span', {}, '┄ 虛線依原圖標示'));
  figure.appendChild(footer);
  if (graph) figure.appendChild(textGuide(graph));
  let zoom = 1;
  const setZoom = (value: number): void => {
    zoom = Math.max(.75, Math.min(2, value)); content.style.zoom = String(zoom);
    reset.textContent = `${Math.round(zoom * 100)}%`;
    smaller.disabled = zoom <= .75; larger.disabled = zoom >= 2;
    content.querySelectorAll<HTMLElement>('.learning-graph').forEach((canvas) => canvas.dispatchEvent(new Event('study-diagram-resize')));
    if (content.classList.contains('learning-graph')) content.dispatchEvent(new Event('study-diagram-resize'));
  };
  smaller.addEventListener('click', () => setZoom(zoom - .25));
  larger.addEventListener('click', () => setZoom(zoom + .25));
  reset.addEventListener('click', () => setZoom(1));
  let dialog: HTMLDialogElement | null = null;
  expand.addEventListener('click', () => {
    if (dialog) { dialog.close(); return; }
    const marker = document.createComment('study-diagram-position'); figure.before(marker);
    const focusBefore = document.activeElement as HTMLElement | null;
    dialog = h('dialog', { className: 'study-diagram-dialog', 'aria-labelledby': id });
    document.body.appendChild(dialog); dialog.appendChild(figure);
    expand.textContent = '✕ 收合'; expand.setAttribute('aria-label', '收合圖表閱讀');
    dialog.addEventListener('close', () => {
      marker.replaceWith(figure); dialog?.remove(); dialog = null;
      expand.textContent = '⛶ 展開'; expand.setAttribute('aria-label', '展開圖表閱讀');
      focusBefore?.focus({ preventScroll: true });
    }, { once: true });
    dialog.showModal(); expand.focus();
  });
  const teardown = (): void => {
    // The router constructs its next page before removing the connected page.
    if (!figure.isConnected && location.hash === route && !dialog) return;
    if (dialog) dialog.close();
    window.removeEventListener('route-teardown', teardown);
  };
  window.addEventListener('route-teardown', teardown);
  return figure;
}
