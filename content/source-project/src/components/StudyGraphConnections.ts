import type { StudyGraph, StudyGraphLayout } from '@/core/study-diagram';
import { graphPorts, routeGraphEdge, type GraphBox } from '@/utils/study-graph-router';

const namespace = 'http://www.w3.org/2000/svg';
let sequence = 0;

export function connectStudyGraph(canvas: HTMLElement, graph: StudyGraph, layout: StudyGraphLayout): void {
  const svg = document.createElementNS(namespace, 'svg');
  svg.classList.add('sg-connections'); svg.setAttribute('aria-hidden', 'true');
  const prefix = `sg-arrow-${++sequence}`;
  svg.innerHTML = `<defs>${['main', 'feedback'].map((kind) => `<marker id="${prefix}-${kind}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto-start-reverse" class="sg-arrow sg-arrow--${kind}"><path d="M 0 0 L 10 5 L 0 10 z"/></marker>`).join('')}</defs>`;
  const paths = graph.edges.map((edge) => {
    const path = document.createElementNS(namespace, 'path');
    path.classList.add('sg-connection');
    path.dataset.from = edge.from; path.dataset.to = edge.to; path.dataset.edgeId = edge.id;
    path.dataset.label = edge.label; path.dataset.type = edge.type;
    const feedback = layout.feedback.has(edge.id) || edge.bidirectional;
    if (feedback) path.classList.add('sg-connection--feedback');
    if (edge.dashed) path.setAttribute('stroke-dasharray', '5 5');
    const marker = `url(#${prefix}-${feedback ? 'feedback' : 'main'})`;
    if (edge.type !== 'arrow_open') path.setAttribute('marker-end', marker);
    if (edge.bidirectional) path.setAttribute('marker-start', marker);
    const title = document.createElementNS(namespace, 'title'); title.textContent = edge.label;
    path.appendChild(title); svg.appendChild(path);
    return { edge, path };
  });
  canvas.prepend(svg);
  let scheduled = 0;
  const draw = (): void => {
    scheduled = 0; if (!canvas.isConnected) return;
    // Work in CSS coordinates even when the reader's magnification is active.
    const bounds = canvas.getBoundingClientRect();
    const scale = canvas.offsetWidth ? bounds.width / canvas.offsetWidth : 1;
    const width = bounds.width / scale; const height = bounds.height / scale;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const boxes = new Map<string, GraphBox>();
    const obstacles: GraphBox[] = [];
    canvas.querySelectorAll<HTMLElement>('[data-graph-node], .sg-group__heading').forEach((element) => {
      const rect = element.getBoundingClientRect();
      const box = { left: (rect.left - bounds.left) / scale, right: (rect.right - bounds.left) / scale,
        top: (rect.top - bounds.top) / scale, bottom: (rect.bottom - bounds.top) / scale };
      obstacles.push(box);
      if (element.dataset.graphNode) boxes.set(element.dataset.graphNode, box);
    });
    for (const { edge, path } of paths) {
      const first = boxes.get(edge.from); const last = boxes.get(edge.to);
      if (!first || !last) { path.dataset.routeError = 'missing-node'; continue; }
      const ports = graphPorts(first, last);
      const route = routeGraphEdge(ports.outerStart, ports.outerEnd, obstacles, width, height);
      path.dataset.routeError = route ? '' : 'blocked';
      if (!route) { path.removeAttribute('d'); continue; }
      const points = [ports.start, ...route, ports.end];
      path.dataset.points = JSON.stringify(points);
      path.setAttribute('d', points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' '));
    }
    canvas.dataset.routed = 'true';
  };
  const schedule = (): void => { if (!scheduled) scheduled = requestAnimationFrame(draw); };
  const observer = new ResizeObserver(schedule); observer.observe(canvas);
  canvas.querySelectorAll('[data-graph-node], .sg-group__heading').forEach((node) => observer.observe(node));
  canvas.addEventListener('study-diagram-resize', schedule);
  const route = location.hash;
  const teardown = (): void => {
    if (!canvas.isConnected && location.hash === route && !canvas.dataset.routed) return;
    observer.disconnect(); cancelAnimationFrame(scheduled);
    window.removeEventListener('route-teardown', teardown);
  };
  window.addEventListener('route-teardown', teardown);
  schedule();
}
