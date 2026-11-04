/**
 * EventQueue.ts — Min-Heap Priority Queue for Discrete Event Simulation (DES)
 * Events are ordered strictly by logical timestamp, breaking ties by insertion sequence.
 */

export interface SimulationEvent {
  id: string;
  time: number;
  sequence: number;
  type: string;
  handler: () => void;
  metadata?: Record<string, unknown>;
}

export class EventQueue {
  private heap: SimulationEvent[] = [];
  private sequenceCounter = 0;

  public get size(): number {
    return this.heap.length;
  }

  public get isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /** Peek at the earliest event without removing it */
  public peek(): SimulationEvent | undefined {
    return this.heap[0];
  }

  /** Enqueue a new event */
  public push(time: number, type: string, handler: () => void, metadata?: Record<string, unknown>): SimulationEvent {
    const event: SimulationEvent = {
      id: `evt-${++this.sequenceCounter}`,
      time,
      sequence: this.sequenceCounter,
      type,
      handler,
      metadata,
    };

    this.heap.push(event);
    this.siftUp(this.heap.length - 1);
    return event;
  }

  /** Dequeue the earliest event */
  public pop(): SimulationEvent | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.siftDown(0);
    }
    return top;
  }

  /** Clear all scheduled events */
  public clear(): void {
    this.heap = [];
    this.sequenceCounter = 0;
  }

  private compare(a: SimulationEvent, b: SimulationEvent): number {
    if (a.time !== b.time) {
      return a.time - b.time;
    }
    return a.sequence - b.sequence;
  }

  private siftUp(index: number): void {
    let current = index;
    while (current > 0) {
      const parent = (current - 1) >>> 1;
      if (this.compare(this.heap[current], this.heap[parent]) < 0) {
        const temp = this.heap[current];
        this.heap[current] = this.heap[parent];
        this.heap[parent] = temp;
        current = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(index: number): void {
    let current = index;
    const length = this.heap.length;
    while ((current << 1) + 1 < length) {
      let left = (current << 1) + 1;
      let right = left + 1;
      let smallest = current;

      if (left < length && this.compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest !== current) {
        const temp = this.heap[current];
        this.heap[current] = this.heap[smallest];
        this.heap[smallest] = temp;
        current = smallest;
      } else {
        break;
      }
    }
  }
}
