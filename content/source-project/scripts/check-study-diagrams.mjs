import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const compile = (relative) => ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
}).outputText;
const moduleUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const renderUrl = moduleUrl(compile('src/utils/render.ts'));
const labels = await import(moduleUrl(compile('src/utils/study-diagram-label.ts').replace('@/utils/render', renderUrl)));
const { planStudyGraph } = await import(moduleUrl(compile('src/utils/study-graph-layout.ts')));
const { routeGraphEdge, graphPorts, crossesBox } = await import(moduleUrl(compile('src/utils/study-graph-router.ts')));
const node = (id, shape = 'square') => ({ id, label: id, shape });
const edge = (from, to) => ({ id: `${from}-${to}`, from, to, label: '', type: 'arrow_point', dashed: false, bidirectional: false });

assert.deepEqual(labels.splitDiagramLabel('主生產排程 (Master Production Schedule, MPS)'), {
  title: '主生產排程', english: 'Master Production Schedule', abbreviation: 'MPS', notes: [],
});
assert.deepEqual(labels.splitDiagramLabel('ATO: 採購<br/>➜ 預製標準模組'), {
  title: '採購', english: '', abbreviation: 'ATO', notes: ['➜ 預製標準模組'],
});
assert.equal(labels.plainDiagramText('S&amp;OP<br>品質 &lt; 3&#37;'), 'S&OP\n品質 < 3%');
assert.equal(labels.splitDiagramLabel('長文字保持完整，依卡片可用空間自然折行').title, '長文字保持完整，依卡片可用空間自然折行');

const flow = { direction: 'TD', groups: [], nodes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((id) => node(id)),
  edges: ['AB', 'BC', 'CD', 'DE', 'EF', 'FG'].map(([from, to]) => edge(from, to)) };
assert.deepEqual(planStudyGraph(flow).rows.map((row) => row.map((unit) => unit.id)), [['A', 'B', 'C'], ['D', 'E', 'F'], ['G']]);
const decision = { ...flow, nodes: [node('Q', 'diamond'), node('A'), node('B'), node('C')],
  edges: [edge('Q', 'A'), edge('Q', 'B'), edge('Q', 'C')] };
assert.equal(planStudyGraph(decision).kind, 'decision');
assert.deepEqual(planStudyGraph(decision).rows.map((row) => row.length), [1, 3]);
const cycle = { ...flow, nodes: [node('A'), node('B'), node('C')], edges: [edge('A', 'B'), edge('B', 'C'), edge('C', 'A')] };
const before = JSON.stringify(cycle);
const cycleLayout = planStudyGraph(cycle);
assert.deepEqual([...cycleLayout.feedback], ['C-A']);
assert.equal(cycleLayout.rows.flatMap((unit) => unit.flatMap((item) => item.nodes)).length, 3);
assert.equal(JSON.stringify(cycle), before, 'Routing feedback must not remove or mutate a source relationship.');
const bottomUp = planStudyGraph({ ...cycle, direction: 'BT', edges: cycle.edges.slice(0, 2) });
assert.deepEqual(bottomUp.rows.map((row) => row[0].id), ['C', 'B', 'A']);
const grouped = { ...cycle, groups: [{ id: 'left', title: '前製程', nodes: ['A', 'B'] }, { id: 'right', title: '後製程', nodes: ['C'] }] };
assert.deepEqual(planStudyGraph(grouped).rows.map((row) => row.map((unit) => unit.id)), [['left', 'right']]);

const boxes = Array.from({ length: 12 }, (_, index) => {
  const left = 32 + index % 3 * 228; const top = 32 + Math.floor(index / 3) * 144;
  return { left, right: left + 180, top, bottom: top + 100 };
});
let checked = 0;
for (let from = 0; from < boxes.length; from++) for (let to = 0; to < boxes.length; to++) {
  if (from === to) continue;
  const ports = graphPorts(boxes[from], boxes[to]);
  const route = routeGraphEdge(ports.outerStart, ports.outerEnd, boxes, 700, 596);
  assert.ok(route, `No route from ${from} to ${to}`);
  const points = [ports.start, ...route, ports.end];
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1]; const b = points[index];
    assert.ok(a.x === b.x || a.y === b.y, 'Connections must remain orthogonal.');
    boxes.forEach((box, boxIndex) => {
      if (boxIndex !== from && boxIndex !== to) assert.equal(crossesBox(a, b, box), false, 'An arrow crossed an unrelated card.');
    });
  }
  checked++;
}
assert.equal(routeGraphEdge({ x: 20, y: 20 }, { x: 180, y: 20 }, [{ left: 80, top: -1, right: 100, bottom: 201 }], 200, 200), null);
console.log(`Study diagrams: typography, branches, groups, feedback, bottom-up layout and ${checked} obstacle routes passed.`);
