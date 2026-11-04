import type { StudyGraph, StudyGraphLayout, StudyGraphUnit } from '@/core/study-diagram';

/** Back edges affect routing, never removal from the teaching graph. */
export function graphFeedback(graph: StudyGraph): Set<string> {
  const visited = new Set<string>();
  const active = new Set<string>();
  const feedback = new Set<string>();
  function visit(id: string): void {
    visited.add(id); active.add(id);
    for (const edge of graph.edges.filter((item) => item.from === id && item.type !== 'arrow_open')) {
      if (active.has(edge.to)) feedback.add(edge.id);
      else if (!visited.has(edge.to)) visit(edge.to);
    }
    active.delete(id);
  }
  graph.nodes.forEach((node) => { if (!visited.has(node.id)) visit(node.id); });
  return feedback;
}

export function planStudyGraph(graph: StudyGraph): StudyGraphLayout {
  const feedback = graphFeedback(graph);
  const grouped = new Set(graph.groups.flatMap((group) => [...group.nodes, group.id]));
  const units: StudyGraphUnit[] = graph.groups.map((group) => ({
    id: group.id, group, nodes: graph.nodes.filter((node) => group.nodes.includes(node.id) && node.id !== group.id),
  }));
  units.push(...graph.nodes.filter((node) => !grouped.has(node.id)).map((node) => ({ id: node.id, nodes: [node] })));
  const owners = new Map<string, string>();
  units.forEach((unit) => { owners.set(unit.id, unit.id); unit.nodes.forEach((node) => owners.set(node.id, unit.id)); });
  const adjacency = new Map(units.map((unit) => [unit.id, new Set<string>()]));
  for (const edge of graph.edges) {
    const from = owners.get(edge.from); const to = owners.get(edge.to);
    if (from && to && from !== to && !feedback.has(edge.id) && edge.type !== 'arrow_open') adjacency.get(from)!.add(to);
  }
  // Collapsing a functional group may introduce cycles; rank those units once.
  const seen = new Set<string>(); const stack = new Set<string>();
  function prune(id: string): void {
    seen.add(id); stack.add(id);
    for (const to of adjacency.get(id)!) {
      if (stack.has(to)) adjacency.get(id)!.delete(to);
      else if (!seen.has(to)) prune(to);
    }
    stack.delete(id);
  }
  units.forEach((unit) => { if (!seen.has(unit.id)) prune(unit.id); });
  const rank = new Map(units.map((unit) => [unit.id, 0]));
  for (let pass = 0; pass < units.length; pass++) {
    let changed = false;
    for (const [from, targets] of adjacency) for (const to of targets) {
      const next = rank.get(from)! + 1;
      if (next > rank.get(to)!) { rank.set(to, next); changed = true; }
    }
    if (!changed) break;
  }
  let rows = [...new Set(rank.values())].sort((a, b) => a - b)
    .map((level) => units.filter((unit) => rank.get(unit.id) === level));
  const edges = graph.edges.filter((edge) => !feedback.has(edge.id) && edge.type !== 'arrow_open');
  const linear = !graph.groups.length && graph.direction !== 'BT' && rows.every((row) => row.length === 1)
    && graph.nodes.every((node) => new Set(edges.filter((edge) => edge.from === node.id).map((edge) => edge.to)).size <= 1
      && new Set(edges.filter((edge) => edge.to === node.id).map((edge) => edge.from)).size <= 1);
  let kind: StudyGraphLayout['kind'] = graph.groups.length ? 'groups'
    : graph.nodes.some((node) => node.shape === 'diamond') ? 'decision' : 'flow';
  if (linear) {
    kind = 'steps';
    const ordered = rows.flat(); rows = [];
    for (let index = 0; index < ordered.length; index += 3) rows.push(ordered.slice(index, index + 3));
  } else if (graph.groups.length && units.length === graph.groups.length) {
    // Functional lanes remain alongside each other, including grouped cycles.
    rows = [units];
  }
  if (graph.direction === 'BT' && !linear) rows.reverse();
  return { kind, rows, feedback };
}
