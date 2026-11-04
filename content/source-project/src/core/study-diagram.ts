export interface StudyGraphNode { id: string; label: string; shape: string }
export interface StudyGraphEdge {
  id: string; from: string; to: string; label: string;
  type: string; dashed: boolean; bidirectional: boolean;
}
export interface StudyGraphGroup { id: string; title: string; nodes: string[] }
export interface StudyGraph {
  direction: string; nodes: StudyGraphNode[]; edges: StudyGraphEdge[]; groups: StudyGraphGroup[];
}
export interface StudyGraphUnit { id: string; group?: StudyGraphGroup; nodes: StudyGraphNode[] }
export interface StudyGraphLayout {
  kind: 'steps' | 'decision' | 'groups' | 'flow'; rows: StudyGraphUnit[][]; feedback: Set<string>;
}
