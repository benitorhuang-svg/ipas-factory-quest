export type DiagramMode = 'overview' | 'readable' | 'manual';
export type DiagramAction = 'zoom-in' | 'zoom-out' | 'overview' | 'readable' | 'focus-node' | 'sync';

export interface DiagramState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  scale: number;
  minFontPx: number;
  mode: DiagramMode;
  nodeId?: string;
  message?: string;
}

export interface DiagramController {
  command(action: DiagramAction, nodeId?: string): void;
  retry(): void;
  destroy(): void;
}

export interface SummaryReaderData {
  schemaVersion: 1;
  code: string;
  title: string;
  candidateSha256: string;
  nodes: Array<{ id: string; label: string; detail: string; kind: string }>;
  relations: Array<{ from: string; to: string; label: string }>;
  notes: Array<{ title: string; items: string[] }>;
}
