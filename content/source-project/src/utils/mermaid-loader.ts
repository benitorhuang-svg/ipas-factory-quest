import mermaid from 'mermaid';
import { upgradeProductionPlanningDiagram } from '@/components/ProductionPlanningDiagram';
import { createStudyGraph } from '@/components/StudyGraph';
import { createStudyDiagramFrame } from '@/components/StudyDiagramFrame';
import { readStudyGraph } from '@/utils/study-graph-model';
import { initializeStudyMermaid } from '@/utils/mermaid-theme';
import { h } from '@/utils/render';

let renderQueue: Promise<void> = Promise.resolve();
let renderSequence = 0;

function diagramTitle(container: HTMLElement, node: HTMLElement): string {
  const headings = [...container.querySelectorAll<HTMLElement>('h2, h3, h4')]
    .filter((heading) => !!(heading.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING));
  return headings.at(-1)?.textContent?.trim().replace(/^\d+[.、]\s*/, '') ?? '重點圖解';
}

function diagramSource(node: HTMLElement): string {
  if (node.dataset.studySource) return node.dataset.studySource;
  // Markdown emits real <br> nodes inside the source; textContent alone loses them.
  const decoder = document.createElement('textarea');
  decoder.innerHTML = node.innerHTML.trim();
  return decoder.value;
}

async function renderContainer(container: HTMLElement): Promise<void> {
  await document.fonts?.ready;
  initializeStudyMermaid();
  upgradeProductionPlanningDiagram(container);
  const sources = [...container.querySelectorAll<HTMLElement>('.mermaid, .language-mermaid, .planning-map')]
    .filter((node) => !node.closest('.study-diagram'));
  for (const source of sources) {
    source.dataset.noTerminology = 'true';
    const code = diagramSource(source).trim();
    if (!code) continue;
    const title = diagramTitle(container, source);
    try {
      const graph = await readStudyGraph(code);
      if (source.classList.contains('planning-map')) {
        const position = document.createComment('planning-diagram-position'); source.before(position);
        const frame = createStudyDiagramFrame(source, title, 'planning', graph);
        position.replaceWith(frame);
      } else if (graph) {
        const diagram = createStudyGraph(graph);
        const frame = createStudyDiagramFrame(diagram.element, title, diagram.kind, graph);
        (source.closest('.mermaid-block') ?? source.closest('pre') ?? source).replaceWith(frame);
        diagram.connect();
      } else {
        const { svg } = await mermaid.render(`study-mermaid-${++renderSequence}`, code);
        const content = h('div', { className: 'study-mermaid' }); content.innerHTML = svg;
        const graphic = content.querySelector('svg');
        if (graphic) {
          const dimensions = graphic.viewBox.baseVal;
          graphic.style.width = `${Math.max(dimensions.width, 400)}px`;
          graphic.removeAttribute('height');
        }
        const kind = code.match(/^\s*([\w-]+)/)?.[1] ?? 'flow';
        const frame = createStudyDiagramFrame(content, title, kind, null);
        (source.closest('.mermaid-block') ?? source.closest('pre') ?? source).replaceWith(frame);
      }
    } catch (error) {
      console.warn('Study diagram could not be rendered:', error);
      const message = h('div', { className: 'study-diagram__error', role: 'status' }, '圖解暫時無法載入，請重新整理頁面。');
      source.before(message);
    }
  }
}

/** Serialize Mermaid's global parser/config state across asynchronously loaded sections. */
export function renderMermaidDiagrams(container: HTMLElement): Promise<void> {
  const route = location.hash;
  const job = renderQueue.then(() => location.hash === route ? renderContainer(container) : undefined);
  renderQueue = job.catch(() => {});
  return job;
}
