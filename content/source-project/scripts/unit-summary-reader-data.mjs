import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/** Derive readable content from the same reviewed candidate used by Archify. */
export function makeSummaryReader(entry, root) {
  const bytes = fs.readFileSync(path.resolve(root, entry.candidate));
  const candidate = JSON.parse(bytes.toString('utf8'));
  const nodes = candidate.components.map((node) => ({
    id: node.id, label: node.label,
    detail: [node.sublabel, node.tag].filter(Boolean).join('；'),
    kind: candidate.meta?.legend?.entries?.[node.type]?.label ?? '關鍵概念',
  }));
  const ids = new Set(nodes.map(({ id }) => id));
  if (ids.size !== nodes.length || nodes.some(({ id, label }) => !id || !label)) {
    throw new Error(`${entry.code}: invalid or duplicate node labels.`);
  }
  const relations = candidate.connections.map(({ from, to, label }) => ({ from, to, label: label ?? '相關' }));
  if (relations.some(({ from, to }) => !ids.has(from) || !ids.has(to))) {
    throw new Error(`${entry.code}: unresolved relation.`);
  }
  return {
    schemaVersion: 1, code: entry.code, title: entry.title,
    candidateSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    nodes, relations,
    notes: (candidate.cards ?? []).map(({ title, items }) => ({
      title, items: items.filter((item) => !/^教材來源[:：]\s*docs\//.test(item)),
    })).filter(({ items }) => items.length),
  };
}
