import { h } from '@/utils/render';

export interface DiagramLabel { title: string; english: string; abbreviation: string; notes: string[] }

/** Decode Mermaid's sanitized labels as text, without creating active HTML. */
export function plainDiagramText(value: string): string {
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, key: string) => {
      if (!key.startsWith('#')) return entities[key.toLowerCase()] ?? entity;
      const code = key[1].toLowerCase() === 'x' ? Number.parseInt(key.slice(2), 16) : Number(key.slice(1));
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    }).trim();
}

/** Separate visual levels while retaining every authored word. */
export function splitDiagramLabel(value: string): DiagramLabel {
  const lines = plainDiagramText(value).split('\n').map((line) => line.trim()).filter(Boolean);
  let title = lines.shift() ?? '';
  let english = '';
  let abbreviation = '';
  const bilingual = title.match(/^(.+?)\s*[（(]([A-Za-z][^（）()]*?)[）)]$/);
  if (bilingual) {
    title = bilingual[1].trim();
    const parts = bilingual[2].split(/,\s*(?=[A-Z][A-Z\d&/-]*$)/);
    if (parts.length > 1) [english, abbreviation] = parts;
    else if (/^[A-Z][A-Z\d&/+-]{1,14}$/.test(parts[0])) abbreviation = parts[0];
    else english = parts[0];
  }
  const prefix = title.match(/^([A-Z][A-Z\d&/-]{1,12})[：:\s]+([\u3400-\u9fff].+)$/);
  if (prefix && !abbreviation) { abbreviation = prefix[1]; title = prefix[2]; }
  const suffix = title.match(/^([\u3400-\u9fff].+?)\s+([A-Za-z][A-Za-z\s-]+)$/);
  if (suffix && !english) { title = suffix[1]; english = suffix[2]; }
  if (/^[A-Z][A-Z\d&/-]{1,12}$/.test(title) && lines.length && !abbreviation) {
    abbreviation = title; title = lines.shift()!;
  }
  return { title, english, abbreviation, notes: lines };
}

export function appendDiagramLabel(target: HTMLElement, value: string): void {
  const label = splitDiagramLabel(value);
  target.appendChild(h('span', { className: 'sd-label__title' }, label.title));
  if (label.english) target.appendChild(h('span', { className: 'sd-label__english', lang: 'en' }, label.english));
  for (const note of label.notes) target.appendChild(h('span', { className: 'sd-label__note' }, note));
  if (label.abbreviation) target.appendChild(h('span', { className: 'sd-label__abbreviation' }, label.abbreviation));
}

