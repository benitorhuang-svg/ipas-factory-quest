/**
 * TopicsPage.ts — Subject / Topic selector grouped by exam subject
 */

import { div, h } from '@/utils/render';
import { PageShell } from '@/components/organisms';
import { SUBJECTS, getTopicsByTheme } from '@/core/topics';
import { navigateTo } from '@/services/router';

// Level → subject mapping
const LEVELS = [
  {
    code: 'beginner',
    label: '初級',
    sublabel: 'Elementary',
    emoji: '🎓',
    color: 'var(--color-indigo-600)',
    subjects: [
      { code: 'M11', shortLabel: '考科一', desc: '生產與作業管理' },
      { code: 'M12', shortLabel: '考科二', desc: '智慧製造生產線' },
      { code: 'M13', shortLabel: '考科三', desc: '術科實作準備' },
      { code: 'APPX', shortLabel: '特訓', desc: '公式與考古題' },
    ],
  },
  {
    code: 'intermediate',
    label: '中級',
    sublabel: 'Intermediate',
    emoji: '📗',
    color: 'var(--color-emerald-600)',
    subjects: [
      { code: 'M21', shortLabel: '考科一', desc: '生產管理實務應用' },
      { code: 'M22', shortLabel: '考科二', desc: '設備與製程管理' },
    ],
  },
] as const;

let activeLevel = 'beginner';
let activeSubjectCode = 'M11';

// Returns the header title and subtitle for the active level
function getLevelHeader(): { title: string; subtitle: string } {
  if (activeLevel === 'intermediate') {
    return { title: '智慧生產工程師（中級）', subtitle: '中級備考特訓與筆記系統' };
  }
  return { title: '智慧生產工程師（初級）', subtitle: '備考特訓與筆記系統' };
}

export function TopicsPage(): HTMLElement {
  const container = div('detail-page-container topics-page anim-stagger');

  // Mutable ref updated after PageShell construction
  let headerTitleEl: Element | null = null;
  let headerSubtitleEl: Element | null = null;

  function syncHeaderText() {
    const { title, subtitle } = getLevelHeader();
    if (headerTitleEl) headerTitleEl.textContent = title;
    if (headerSubtitleEl) headerSubtitleEl.textContent = subtitle;
  }

  // ── Tier 1: Level switcher ──────────────────────────────
  const levelSwitcher = div('level-switcher');
  const levelBtns: HTMLButtonElement[] = [];

  for (const lv of LEVELS) {
    const btn = h('button', { className: `level-btn${activeLevel === lv.code ? ' level-btn--active' : ''}` }, '');
    btn.innerHTML = `
      <span class="level-btn__emoji">${lv.emoji}</span>
      <span class="level-btn__text">
        <strong>${lv.label}</strong>
        <small>${lv.sublabel}</small>
      </span>
    `;
    btn.addEventListener('click', () => {
      if (activeLevel === lv.code) return;
      activeLevel = lv.code;
      activeSubjectCode = lv.subjects[0].code;
      levelBtns.forEach((b, i) => {
        b.className = `level-btn${LEVELS[i].code === activeLevel ? ' level-btn--active' : ''}`;
        b.style.setProperty('--level-accent', LEVELS[i].color);
      });
      syncHeaderText();
      renderSubjectNav();
      renderList();
    });
    btn.style.setProperty('--level-accent', lv.color);
    levelBtns.push(btn);
    levelSwitcher.appendChild(btn);
  }
  container.appendChild(levelSwitcher);

  // ── Tier 2: Subject selector ────────────────────────────
  const subjectNav = div('subject-nav');
  container.appendChild(subjectNav);

  const subjectBtns: HTMLButtonElement[] = [];

  function renderSubjectNav() {
    subjectNav.innerHTML = '';
    subjectBtns.length = 0;
    const lv = LEVELS.find(l => l.code === activeLevel)!;
    for (const sub of lv.subjects) {
      const btn = h('button', {
        className: `subject-card${activeSubjectCode === sub.code ? ' subject-card--active' : ''}`,
      }, '');
      btn.innerHTML = `
        <span class="subject-card__label">${sub.shortLabel}</span>
        <span class="subject-card__desc">${sub.desc}</span>
      `;
      btn.style.setProperty('--level-accent', lv.color);
      btn.addEventListener('click', () => {
        if (activeSubjectCode === sub.code) return;
        activeSubjectCode = sub.code;
        subjectBtns.forEach((b, i) => {
          b.className = `subject-card${lv.subjects[i].code === activeSubjectCode ? ' subject-card--active' : ''}`;
        });
        renderList();
      });
      subjectBtns.push(btn);
      subjectNav.appendChild(btn);
    }
  }

  // ── Tier 3: Topic list ──────────────────────────────────
  const listContainer = div('');
  container.appendChild(listContainer);

  function renderList() {
    listContainer.innerHTML = '';
    const subject = SUBJECTS.find((s) => s.code === activeSubjectCode);
    if (!subject) return;

    for (const theme of subject.themes) {
      const group = div('topic-group anim-slide-up');
      group.style.marginBottom = '1.5rem';

      const header = div('topic-group__header');
      header.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <span style="font-size:0.75rem;background:var(--color-indigo-100);color:var(--color-indigo-700);padding:0.125rem 0.5rem;border-radius:9999px;font-weight:700;">${theme.code}</span>
          <h3 style="font-size:0.9375rem;font-weight:800;color:var(--color-text-primary);margin:0;">${theme.name}</h3>
        </div>`;
      group.appendChild(header);

      const itemsGrid = div('topic-grid');
      itemsGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:0.75rem;margin-top:0.75rem;';

      const topics = getTopicsByTheme(theme.code);
      for (const topic of topics) {
        const item = div('topic-item anim-slide-up');
        item.style.cssText = 'padding:1rem;border:1px solid var(--color-border);border-radius:var(--radius-xl);background:var(--color-bg-elevated);cursor:pointer;display:flex;gap:0.875rem;align-items:flex-start;transition:transform 0.15s ease,box-shadow 0.15s ease;';
        item.addEventListener('mouseenter', () => { item.style.transform = 'translateY(-2px)'; item.style.boxShadow = 'var(--shadow-md)'; });
        item.addEventListener('mouseleave', () => { item.style.transform = ''; item.style.boxShadow = ''; });
        item.addEventListener('click', () => navigateTo(`/topic/${topic.code}`));
        item.innerHTML = `
          <div style="font-size:1.75rem;width:2.75rem;height:2.75rem;background:var(--color-bg-secondary);border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${topic.icon}</div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:0.375rem;margin-bottom:0.25rem;">
              <span class="badge badge--info" style="font-size:0.65rem;padding:0.0625rem 0.375rem;">${topic.code}</span>
            </div>
            <h4 style="font-size:0.9375rem;font-weight:700;color:var(--color-text-primary);margin-bottom:0.25rem;">${topic.name}</h4>
            <p data-no-terminology style="font-size:0.75rem;color:var(--color-text-muted);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:0;">${topic.keywords}</p>
          </div>`;
        itemsGrid.appendChild(item);
      }

      group.appendChild(itemsGrid);
      listContainer.appendChild(group);
    }
  }

  renderSubjectNav();
  renderList();

  const { title, subtitle } = getLevelHeader();
  const shell = PageShell('/topics', container, { title, subtitle });
  headerTitleEl = shell.querySelector('.header__title');
  headerSubtitleEl = shell.querySelector('.header__subtitle');
  return shell;
}
