export interface GraphPoint { x: number; y: number }
export interface GraphBox { left: number; top: number; right: number; bottom: number }
interface QueueItem { key: number; score: number }

class MinQueue {
  private items: QueueItem[] = [];
  push(item: QueueItem): void {
    let index = this.items.push(item) - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.items[parent].score <= item.score) break;
      this.items[index] = this.items[parent]; index = parent;
    }
    this.items[index] = item;
  }
  pop(): QueueItem | undefined {
    const first = this.items[0]; const last = this.items.pop();
    if (!this.items.length || !last) return first;
    let index = 0;
    while (index * 2 + 1 < this.items.length) {
      let child = index * 2 + 1;
      if (child + 1 < this.items.length && this.items[child + 1].score < this.items[child].score) child++;
      if (last.score <= this.items[child].score) break;
      this.items[index] = this.items[child]; index = child;
    }
    this.items[index] = last;
    return first;
  }
}

/** Exact orthogonal segment/rectangle collision check, also used by regression checks. */
export function crossesBox(a: GraphPoint, b: GraphPoint, box: GraphBox): boolean {
  if (a.x === b.x) return a.x > box.left && a.x < box.right
    && Math.max(a.y, b.y) > box.top && Math.min(a.y, b.y) < box.bottom;
  if (a.y === b.y) return a.y > box.top && a.y < box.bottom
    && Math.max(a.x, b.x) > box.left && Math.min(a.x, b.x) < box.right;
  return true;
}

function simplify(points: GraphPoint[]): GraphPoint[] {
  return points.filter((point, index) => {
    const before = points[index - 1]; const after = points[index + 1];
    return !before || !after || !((before.x === point.x && point.x === after.x)
      || (before.y === point.y && point.y === after.y));
  });
}

/** Route through measured card gutters; a node is never treated as empty canvas. */
export function routeGraphEdge(start: GraphPoint, end: GraphPoint, obstacles: GraphBox[], width: number, height: number): GraphPoint[] | null {
  const xs = [...new Set([start.x, end.x, 5, width - 5,
    ...obstacles.flatMap((box) => [box.left - 9, box.right + 9])].filter((x) => x >= 0 && x <= width))].sort((a, b) => a - b);
  const ys = [...new Set([start.y, end.y, 5, height - 5,
    ...obstacles.flatMap((box) => [box.top - 9, box.bottom + 9])].filter((y) => y >= 0 && y <= height))].sort((a, b) => a - b);
  const cols = xs.length; const count = cols * ys.length;
  const point = (key: number): GraphPoint => ({ x: xs[key % cols], y: ys[Math.floor(key / cols)] });
  const origin = ys.indexOf(start.y) * cols + xs.indexOf(start.x);
  const goal = ys.indexOf(end.y) * cols + xs.indexOf(end.x);
  const distance = new Float64Array(count * 3).fill(Infinity);
  const previous = new Int32Array(count * 3).fill(-1);
  const queue = new MinQueue(); distance[origin * 3] = 0;
  queue.push({ key: origin * 3, score: 0 });
  let found = -1;
  const blocked = new Uint8Array(count);
  for (let index = 0; index < count; index++) {
    const p = point(index);
    blocked[index] = Number(obstacles.some((box) => p.x > box.left && p.x < box.right && p.y > box.top && p.y < box.bottom));
  }
  while (true) {
    const item = queue.pop(); if (!item) break;
    const cell = Math.floor(item.key / 3); const direction = item.key % 3;
    const a = point(cell);
    if (cell === goal) { found = item.key; break; }
    const neighbors = [cell % cols ? cell - 1 : -1, cell % cols < cols - 1 ? cell + 1 : -1,
      cell >= cols ? cell - cols : -1, cell + cols < count ? cell + cols : -1];
    for (const next of neighbors) {
      if (next < 0 || blocked[next]) continue;
      const b = point(next);
      if (obstacles.some((box) => crossesBox(a, b, box))) continue;
      const nextDirection = a.x === b.x ? 2 : 1;
      const key = next * 3 + nextDirection;
      const cost = distance[item.key] + Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
        + (direction && direction !== nextDirection ? 22 : 0);
      if (cost >= distance[key]) continue;
      distance[key] = cost; previous[key] = item.key;
      queue.push({ key, score: cost + Math.abs(b.x - end.x) + Math.abs(b.y - end.y) });
    }
  }
  if (found < 0) return null;
  const result: GraphPoint[] = [];
  for (let key = found; key >= 0; key = previous[key]) result.push(point(Math.floor(key / 3)));
  return simplify(result.reverse());
}

/** Ports stay on the facing card edges; outer ports leave room for arrowheads. */
export function graphPorts(a: GraphBox, b: GraphBox): { start: GraphPoint; end: GraphPoint; outerStart: GraphPoint; outerEnd: GraphPoint } {
  const ax = (a.left + a.right) / 2; const ay = (a.top + a.bottom) / 2;
  const bx = (b.left + b.right) / 2; const by = (b.top + b.bottom) / 2;
  if (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 12) {
    const right = bx >= ax;
    return { start: { x: right ? a.right : a.left, y: ay }, end: { x: right ? b.left : b.right, y: by },
      outerStart: { x: right ? a.right + 12 : a.left - 12, y: ay }, outerEnd: { x: right ? b.left - 12 : b.right + 12, y: by } };
  }
  const below = by >= ay;
  return { start: { x: ax, y: below ? a.bottom : a.top }, end: { x: bx, y: below ? b.top : b.bottom },
    outerStart: { x: ax, y: below ? a.bottom + 12 : a.top - 12 }, outerEnd: { x: bx, y: below ? b.top - 12 : b.bottom + 12 } };
}
