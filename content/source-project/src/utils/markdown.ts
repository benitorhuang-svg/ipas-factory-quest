/** Helper to convert basic markdown seeds to beautiful HTML */
export function parseSimpleMarkdown(md: string): string {
  return md
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      // Pass raw HTML through without wrapping
      if (trimmed.startsWith('<')) {
        return line;
      }
      if (trimmed.startsWith('####')) {
        return `<h4 style="font-size: 0.9375rem; font-weight: 800; color: var(--color-indigo-600); margin: 1.25rem 0 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
          <span style="width: 4px; height: 14px; background: var(--color-indigo-500); border-radius: 2px; display: inline-block;"></span>
          ${trimmed.replace('####', '').trim()}
        </h4>`;
      }
      if (trimmed.startsWith('*')) {
        // Detect bold subheadings in bullets like * **Bold**: text
        let content = trimmed.slice(1).trim();
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--color-text-primary); font-weight: 700;">$1</strong>');
        return `<li style="margin-left: 1.25rem; margin-bottom: 0.375rem; font-size: 0.8125rem; color: var(--color-text-secondary); list-style-type: disc;">${content}</li>`;
      }
      if (trimmed.startsWith('-')) {
        let content = trimmed.slice(1).trim();
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--color-text-primary); font-weight: 700;">$1</strong>');
        return `<li style="margin-left: 1.25rem; margin-bottom: 0.375rem; font-size: 0.8125rem; color: var(--color-text-secondary); list-style-type: circle;">${content}</li>`;
      }
      if (trimmed === '') {
        return '';
      }
      // General paragraph text, replace bold syntax
      const content = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--color-text-primary); font-weight: 700;">$1</strong>');
      return `<p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 0.75rem;">${content}</p>`;
    })
    .join('');
}
