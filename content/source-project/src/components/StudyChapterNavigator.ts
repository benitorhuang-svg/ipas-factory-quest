import { h } from '@/utils/render';
import { bindFloatingPanel } from '@/utils/floating-panel';

/** Reading progress lives in the header; the chapter list opens over the page. */
export function createStudyChapterNavigator(content: HTMLElement): HTMLElement | null {
  const headings = Array.from(content.querySelectorAll<HTMLElement>('.study-h2, .study-h3'))
    .filter((heading) => heading.textContent?.trim());
  const root = content.closest<HTMLElement>('.page-content__main');
  if (!root || headings.length < 2) return null;

  const toc = h('div', { className: 'study-toc', 'aria-label': '本章重點與閱讀位置' });
  const counter = h('span', { className: 'study-toc__counter' }, `1 / ${headings.length}`);
  const progressValue = h('span', { className: 'study-toc__progress-value' });
  const progress = h('span', {
    className: 'study-toc__progress', role: 'progressbar', 'aria-label': '本章閱讀進度',
    'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0',
  }, progressValue);
  const toggle = h('button', {
    className: 'study-toc__toggle', type: 'button',
    'aria-label': '展開或收合本章重點', 'aria-controls': 'study-chapter-panel',
  }, h('span', { className: 'study-toc__toggle-label' }, '本章重點'), counter,
  h('span', { className: 'study-toc__chevron', 'aria-hidden': 'true' }, '⌄'), progress);
  const current = h('p', { className: 'study-toc__current' }, headings[0].textContent?.trim() ?? '準備閱讀');
  const panel = h('div', { id: 'study-chapter-panel', className: 'study-toc__body' },
    h('div', { className: 'study-toc__position' },
      h('strong', { className: 'study-toc__title' }, '本章重點'), current));
  const list = h('nav', { className: 'study-toc__list', 'aria-label': '章節重點' });
  const items = h('ol');
  const buttons: HTMLButtonElement[] = [];

  headings.forEach((heading, index) => {
    if (!heading.id) heading.id = `study-chapter-section-${index}`;
    heading.classList.add('study-toc-target');
    const button = h('button', {
      type: 'button', className: 'study-toc__item', 'data-target-id': heading.id,
    }, heading.textContent?.trim() ?? '章節重點');
    button.addEventListener('click', () => {
      floating.close();
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      root.scrollTo({
        top: Math.max(0, root.scrollTop + heading.getBoundingClientRect().top - root.getBoundingClientRect().top - 24),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    });
    buttons.push(button);
    items.appendChild(h('li', { className: heading.matches('.study-h3') ? 'study-toc__subitem' : '' }, button));
  });
  list.appendChild(items);
  panel.appendChild(list);
  toc.append(toggle, panel);

  let scheduled = 0;
  let activeIndex = -1;
  const update = (): void => {
    scheduled = 0;
    if (!root.isConnected) return;
    const marker = root.getBoundingClientRect().top + Math.min(150, root.clientHeight * .2);
    let nextIndex = 0;
    headings.forEach((heading, index) => {
      if (heading.getBoundingClientRect().top <= marker) nextIndex = index;
    });
    if (nextIndex !== activeIndex) {
      activeIndex = nextIndex;
      buttons.forEach((button, index) => {
        if (index === activeIndex) button.setAttribute('aria-current', 'location');
        else button.removeAttribute('aria-current');
      });
      current.textContent = headings[activeIndex].textContent?.trim() ?? '';
      counter.textContent = `${activeIndex + 1} / ${headings.length}`;
      toggle.title = `${current.textContent} · ${counter.textContent}`;
    }
    const distance = root.scrollHeight - root.clientHeight;
    const percent = distance > 0 ? Math.round(root.scrollTop / distance * 100) : 0;
    const bounded = Math.max(0, Math.min(100, percent));
    progressValue.style.width = `${bounded}%`;
    progress.setAttribute('aria-valuenow', String(bounded));
  };
  const schedule = (): void => {
    if (!scheduled) scheduled = requestAnimationFrame(update);
  };
  const resize = new ResizeObserver(schedule);
  resize.observe(content);
  resize.observe(root);
  root.addEventListener('scroll', schedule, { passive: true });
  const floating = bindFloatingPanel(toc, toggle, panel, () => {
    cancelAnimationFrame(scheduled);
    root.removeEventListener('scroll', schedule);
    resize.disconnect();
  });
  toggle.addEventListener('pointerenter', () => {
    const active = buttons[activeIndex];
    if (!active) return;
    list.scrollTop = Math.max(0, active.offsetTop - list.offsetTop - list.clientHeight / 2);
  });
  schedule();
  return toc;
}
