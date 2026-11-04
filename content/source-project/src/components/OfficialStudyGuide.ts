import { div } from '@/utils/render';
import { createReferenceBooks } from '@/components/ReferenceBooks';

/** Keep the official exam guide visible around the interactive reference cards. */
export function createOfficialStudyGuide(rendered: string): HTMLElement {
  const source = new DOMParser().parseFromString(rendered, 'text/html');
  const guide = div('official-study-guide');
  const intro = div('reference-books__official-resources');
  const examGuide = div('reference-books__exam-guide');
  let inBookSection = false;
  let reachedBooks = false;

  for (const node of Array.from(source.body.childNodes)) {
    if (node instanceof HTMLElement && node.matches('h2')) {
      if (node.textContent?.includes('參考書目')) {
        inBookSection = true;
        reachedBooks = true;
        continue;
      }
      inBookSection = false;
    }
    if (inBookSection) continue;
    (reachedBooks ? examGuide : intro).appendChild(node.cloneNode(true));
  }

  guide.append(intro, createReferenceBooks(), examGuide);
  return guide;
}
