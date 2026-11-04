import mermaid from 'mermaid';
import type { StudyGraph } from '@/core/study-diagram';
import { plainDiagramText } from '@/utils/study-diagram-label';

interface FlowDatabase {
  getDirection(): string;
  getVertices(): Map<string, { id: string; text?: string; type?: string; styles: string[]; classes: string[]; link?: string }>;
  getEdges(): { start: string; end: string; text: string; type?: string; stroke?: string; id?: string }[];
  getSubGraphs(): { id: string; title: string; nodes: string[] }[];
}

/** Mermaid remains the parser and authority for edges, shapes, and subgraphs. */
export async function readStudyGraph(source: string): Promise<StudyGraph | null> {
  if (!/^\s*(?:flowchart|graph)\b/.test(source)) return null;
  const diagram = await mermaid.mermaidAPI.getDiagramFromText(source);
  const db = diagram.db as unknown as FlowDatabase;
  if (!db.getVertices || !db.getEdges || !db.getSubGraphs) return null;
  const vertices = [...db.getVertices().values()];
  // Rich/custom shapes and authored interactions continue through Mermaid itself.
  if (vertices.some((node) => node.styles.length || node.classes.length || node.link
    || !['square', 'rect', 'diamond', 'stadium', 'round', undefined].includes(node.type))) return null;
  const rawEdges = db.getEdges();
  const groups = db.getSubGraphs();
  const memberships = groups.flatMap((group) => group.nodes);
  if (new Set(memberships).size !== memberships.length
    || groups.some((group) => groups.some((other) => other.id !== group.id && group.nodes.includes(other.id)))
    || rawEdges.some((edge) => edge.start === edge.end)) return null;
  if (rawEdges.some((edge) => !['arrow_point', 'double_arrow_point', 'arrow_open'].includes(edge.type ?? 'arrow_point'))) return null;
  return {
    direction: db.getDirection() ?? 'TD',
    nodes: vertices.map((node) => ({ id: node.id, label: node.text ?? node.id, shape: node.type ?? 'square' })),
    edges: rawEdges.map((edge, index) => ({
      id: edge.id ?? `edge-${index}`, from: edge.start, to: edge.end, label: plainDiagramText(edge.text),
      type: edge.type ?? 'arrow_point', dashed: edge.stroke === 'dotted', bidirectional: edge.type === 'double_arrow_point',
    })),
    groups: groups.map((group) => ({ id: group.id, title: plainDiagramText(group.title), nodes: [...group.nodes] })),
  };
}
