import { h } from '@/utils/render';

const svgNamespace = 'http://www.w3.org/2000/svg';
const groups = [['BP'], ['SOP', 'MPS', 'RCCP'], ['MRP', 'CRP', 'PAC']];
const connections = [
  ['BP', 'SOP', false], ['SOP', 'MPS', false], ['MPS', 'RCCP', true],
  ['MPS', 'MRP', false], ['MRP', 'CRP', true], ['MRP', 'PAC', false],
] as const;
let diagramId = 0;

/** Recognize this seven-node teaching diagram; keep its labels and relationships as the source. */
function readPlanningSource(source: string): { labels: Map<string, string>; layers: string[] } | null {
  const labels = new Map([...source.matchAll(/\b(\w+)\s*\["([^"\n]+)"\]/g)].map((match) => [match[1], match[2]]));
  if (labels.size !== 7 || !groups.flat().every((id) => labels.has(id))) return null;
  const actual = [...source.matchAll(/\b(\w+)\s*(<-->|-->)\s*(\w+)\b/g)]
    .map((match) => `${match[1]}${match[2]}${match[3]}`).sort();
  const expected = connections.map(([from, to, both]) => `${from}${both ? '<-->' : '-->'}${to}`).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) return null;
  const layers = [...source.matchAll(/subgraph\s+"([^"\n]+)"/g)].map((match) => match[1]);
  if (layers.length !== 3 || !layers[0].startsWith('戰略規劃層')) return null;
  return { labels, layers };
}

function nodeCard(id: string, label: string): HTMLElement {
  const parts = label.match(/^(.+?)\s*\((.+)\)$/);
  const name = parts?.[1].trim() ?? label;
  let english = parts?.[2] ?? '';
  const separator = english.lastIndexOf(', ');
  const abbreviation = separator >= 0 ? english.slice(separator + 2) : '';
  if (separator >= 0) english = english.slice(0, separator);
  const card = h('div', { className: 'planning-map__node', 'data-planning-node': id },
    h('span', { className: 'planning-map__name' }, name),
    h('span', { className: 'planning-map__english', lang: 'en' }, english));
  if (abbreviation) card.appendChild(h('span', { className: 'planning-map__abbreviation' }, abbreviation));
  return card;
}

function addConnections(canvas: HTMLElement): void {
  const svg = document.createElementNS(svgNamespace, 'svg');
  svg.classList.add('planning-map__connections');
  svg.setAttribute('aria-hidden', 'true');
  const prefix = `planning-arrow-${++diagramId}`;
  const defs = document.createElementNS(svgNamespace, 'defs');
  for (const kind of ['main', 'feedback']) {
    const marker = document.createElementNS(svgNamespace, 'marker');
    for (const [name, value] of Object.entries({
      id: `${prefix}-${kind}`, viewBox: '0 0 10 10', refX: '9', refY: '5',
      markerWidth: '7', markerHeight: '7', markerUnits: 'userSpaceOnUse', orient: 'auto-start-reverse',
    })) marker.setAttribute(name, value);
    marker.classList.add(`planning-map__arrow--${kind}`);
    const tip = document.createElementNS(svgNamespace, 'path');
    tip.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    marker.appendChild(tip);
    defs.appendChild(marker);
  }
  svg.appendChild(defs);
  const paths = connections.map(([from, to, both]) => {
    const path = document.createElementNS(svgNamespace, 'path');
    path.classList.add('planning-map__connection');
    path.dataset.from = from;
    path.dataset.to = to;
    if (both) path.classList.add('planning-map__connection--feedback');
    const marker = `url(#${prefix}-${both ? 'feedback' : 'main'})`;
    path.setAttribute('marker-end', marker);
    if (both) path.setAttribute('marker-start', marker);
    svg.appendChild(path);
    return { from, to, path };
  });
  canvas.prepend(svg);
  let scheduled = 0;
  const draw = (): void => {
    scheduled = 0;
    if (!canvas.isConnected) return;
    const bounds = canvas.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    for (const { from, to, path } of paths) {
      const first = canvas.querySelector<HTMLElement>(`[data-planning-node="${from}"]`)!;
      const last = canvas.querySelector<HTMLElement>(`[data-planning-node="${to}"]`)!;
      const a = first.getBoundingClientRect();
      const b = last.getBoundingClientRect();
      const ax = a.x - bounds.x + a.width / 2;
      const bx = b.x - bounds.x + b.width / 2;
      const ay = a.y - bounds.y + a.height / 2;
      const by = b.y - bounds.y + b.height / 2;
      const sameRow = Math.abs(a.y - b.y) < 2;
      const sameLane = first.parentElement === last.parentElement;
      let route: string;
      if (sameRow && !(from === 'MRP' && to === 'PAC')) {
        route = `M ${a.right - bounds.x} ${ay} H ${b.left - bounds.x}`;
      } else if (sameRow) {
        const bottom = Math.max(a.bottom, b.bottom) - bounds.y + 24;
        route = `M ${ax} ${a.bottom - bounds.y} V ${bottom} H ${bx} V ${b.bottom - bounds.y}`;
      } else if (sameLane && !(from === 'MRP' && to === 'PAC')) {
        route = `M ${ax} ${a.bottom - bounds.y} V ${b.top - bounds.y}`;
      } else if (Math.abs(a.x - b.x) < 2 && Math.min(a.width, b.width) > bounds.width * .6) {
        const right = bounds.width - 6;
        route = `M ${a.right - bounds.x} ${ay} H ${right} V ${by} H ${b.right - bounds.x}`;
      } else {
        const top = a.bottom - bounds.y;
        const bottom = b.top - bounds.y;
        route = `M ${ax} ${top} V ${(top + bottom) / 2} H ${bx} V ${bottom}`;
      }
      path.setAttribute('d', route);
    }
  };
  const schedule = (): void => {
    if (!scheduled) scheduled = requestAnimationFrame(draw);
  };
  const resize = new ResizeObserver(schedule);
  resize.observe(canvas);
  canvas.querySelectorAll<HTMLElement>('[data-planning-node]').forEach((node) => resize.observe(node));
  const route = location.hash;
  const teardown = (): void => {
    if (!canvas.isConnected && location.hash === route) return;
    cancelAnimationFrame(scheduled);
    resize.disconnect();
    window.removeEventListener('route-teardown', teardown);
  };
  window.addEventListener('route-teardown', teardown);
  schedule();
}

/** Use responsive teaching lanes for this hierarchy without rewriting the Markdown source. */
export function upgradeProductionPlanningDiagram(container: HTMLElement): void {
  for (const source of container.querySelectorAll<HTMLElement>('.mermaid')) {
    const data = readPlanningSource(source.textContent ?? '');
    if (!data) continue;
    const canvas = h('div', { className: 'planning-map__canvas' });
    groups.forEach((ids, index) => {
      const layer = data.layers[index].match(/^(.+?)\s*\((.+)\)$/);
      const lane = h('section', { className: `planning-map__lane planning-map__lane--${index + 1}` });
      lane.appendChild(h('div', { className: 'planning-map__layer' },
        h('span', { className: 'planning-map__number', 'aria-hidden': 'true' }, `0${index + 1}`),
        h('strong', { className: 'planning-map__layer-name' }, layer?.[1].trim() ?? data.layers[index]),
        h('span', { className: 'planning-map__period' }, layer?.[2] ?? '')));
      const nodes = h('div', { className: 'planning-map__nodes' });
      ids.forEach((id) => nodes.appendChild(nodeCard(id, data.labels.get(id)!)));
      lane.appendChild(nodes);
      canvas.appendChild(lane);
    });
    const figure = h('figure', {
      className: 'planning-map', 'data-no-terminology': 'true', 'aria-label': '生產規劃層級與產能回饋流程',
    }, canvas, h('figcaption', { className: 'planning-map__caption' },
      '依序由戰略規劃、戰術協調到操作執行；雙向箭頭表示產能檢核與計畫回饋。'));
    figure.dataset.studySource = source.textContent ?? '';
    (source.closest('.mermaid-block') ?? source).replaceWith(figure);
    addConnections(canvas);
  }
}
