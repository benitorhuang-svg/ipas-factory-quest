import type { StudyGraph, StudyGraphLayout, StudyGraphNode, StudyGraphUnit } from '@/core/study-diagram';
import { h } from '@/utils/render';
import { appendDiagramLabel, plainDiagramText } from '@/utils/study-diagram-label';
import { planStudyGraph } from '@/utils/study-graph-layout';
import { connectStudyGraph } from '@/components/StudyGraphConnections';

function graphCard(node: StudyGraphNode, graph: StudyGraph, layout: StudyGraphLayout): HTMLElement {
  const incoming = graph.edges.filter((edge) => edge.to === node.id);
  const outgoing = graph.edges.filter((edge) => edge.from === node.id);
  const role = node.shape === 'diamond' ? 'decision' : !incoming.length ? 'entry' : !outgoing.length ? 'result' : 'process';
  const card = h('div', { className: `sg-card sg-card--${role}`, 'data-graph-node': node.id,
    'data-original-label': plainDiagramText(node.label) });
  const conditions = incoming.filter((edge) => edge.label);
  if (conditions.length) {
    const badges = h('div', { className: 'sg-card__conditions', 'aria-label': '連入條件' });
    for (const edge of conditions) {
      const source = graph.nodes.find((item) => item.id === edge.from);
      const prefix = incoming.length > 1 ? `${plainDiagramText(source?.label ?? edge.from).split('\n')[0]}：` : '';
      badges.appendChild(h('span', { className: `sg-condition${layout.feedback.has(edge.id) ? ' sg-condition--feedback' : ''}`,
        'data-condition-edge': edge.id, title: `${plainDiagramText(source?.label ?? edge.from)} → ${plainDiagramText(node.label)}` }, `${prefix}${edge.label}`));
    }
    card.appendChild(badges);
  }
  if (role === 'decision') card.appendChild(h('span', { className: 'sg-card__role' }, '◇ 判斷'));
  const label = h('div', { className: 'sg-label' }); appendDiagramLabel(label, node.label); card.appendChild(label);
  return card;
}

function graphUnit(unit: StudyGraphUnit, graph: StudyGraph, layout: StudyGraphLayout): HTMLElement {
  if (!unit.group) return graphCard(unit.nodes[0], graph, layout);
  const group = h('section', { className: 'sg-group', 'data-graph-group': unit.id });
  const heading = h('div', { className: 'sg-group__heading' }); appendDiagramLabel(heading, unit.group.title);
  if (graph.nodes.some((node) => node.id === unit.id)) heading.dataset.graphNode = unit.id;
  group.appendChild(heading);
  const members = new Set(unit.nodes.map((node) => node.id));
  const innerGraph = { ...graph, groups: [], nodes: unit.nodes,
    edges: graph.edges.filter((edge) => members.has(edge.from) && members.has(edge.to)) };
  const innerLayout = planStudyGraph(innerGraph);
  const body = h('div', { className: 'sg-group__body' });
  for (const row of innerLayout.rows) {
    const line = h('div', { className: 'sg-row sg-row--inner', style: `--sg-columns:${row.length}` });
    row.forEach((item) => line.appendChild(graphCard(item.nodes[0], graph, layout)));
    body.appendChild(line);
  }
  group.appendChild(body);
  return group;
}

export function createStudyGraph(graph: StudyGraph): { element: HTMLElement; kind: string; connect: () => void } {
  const layout = planStudyGraph(graph);
  const canvas = h('div', { className: `learning-graph learning-graph--${layout.kind}`, 'data-graph-direction': graph.direction });
  for (const row of layout.rows) {
    const columns = row.length > 4 ? 3 : row.length;
    const line = h('div', { className: `sg-row${columns === 4 ? ' sg-row--four' : ''}`, style: `--sg-columns:${columns}` });
    row.forEach((unit) => line.appendChild(graphUnit(unit, graph, layout)));
    canvas.appendChild(line);
  }
  return { element: canvas, kind: layout.kind, connect: () => connectStudyGraph(canvas, graph, layout) };
}
