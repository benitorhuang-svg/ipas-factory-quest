/**
 * TopicDetailPage.ts — Detailed study module reader with LaTeX math rendering
 */

import { div, h, btn } from '@/utils/render';
import { PageShell } from '@/components/organisms';
import { Badge } from '@/components/atoms';
import { getTopicByCode, SUBJECTS, TOPICS } from '@/core/topics';
import { SEED_STUDY_MATERIALS } from '@/data/seed-study-materials';
import { navigateTo } from '@/services/router';
import { loadKaTeX } from '@/utils/katex-loader';
import { renderMermaidDiagrams } from '@/utils/mermaid-loader';
import { createTrapStudyCards } from '@/components/TrapStudyCards';
import { expandTerminology } from '@/utils/terminology';
import { createOfficialStudyGuide } from '@/components/OfficialStudyGuide';
import type { RouteParams } from '@/core/types';
import { createAPPX01Lab } from '@/components/APPX01Lab';
import { createStudyChapterNavigator } from '@/components/StudyChapterNavigator';
import { createChapterExplainer } from '@/components/ChapterExplainer';
import { appendUnitSummary } from '@/components/UnitSummary';
import { prepareStudyDiagrams } from '@/utils/interactive-diagrams';

/** Render LaTeX math equations using KaTeX asynchronously */
async function renderMath(html: string): Promise<string> {
  if (!html.includes('$')) {
    return html;
  }

  try {
    const katex = await loadKaTeX();
    
    // 1. Render display math blocks: $$...$$
    let result = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      try {
        const formatted = formula.replace(/\\?%/g, '\\%');
        return katex.renderToString(formatted, {
          throwOnError: false,
          displayMode: true,
        });
      } catch (e) {
        console.error('KaTeX display render error:', e);
        return match;
      }
    });

    // 2. Render inline math: $...$
    result = result.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      try {
        const formatted = formula.replace(/\\?%/g, '\\%');
        return katex.renderToString(formatted, {
          throwOnError: false,
          displayMode: false,
        });
      } catch (e) {
        console.error('KaTeX inline render error:', e);
        return match;
      }
    });

    return result;
  } catch (e) {
    console.error('Failed to render math:', e);
    return html;
  }
}

export function TopicDetailPage(params: RouteParams): HTMLElement {
  const topicCode = params.topicCode ?? '';
  const topic = getTopicByCode(topicCode);

  if (!topic) {
    const emptyState = div('empty-state');
    emptyState.append(
      div('empty-state__icon', '❓'),
      div('empty-state__title', '找不到單元'),
      div('empty-state__desc', `單元代碼 "${topicCode}" 不存在`),
    );
    const topicsBtn = h('button', { className: 'btn btn--primary mt-4' }, '返回考科清單');
    topicsBtn.addEventListener('click', () => navigateTo('/topics'));
    emptyState.appendChild(topicsBtn);
    return PageShell('/topics', emptyState);
  }

  const studyInfo = SEED_STUDY_MATERIALS[topicCode];
  const container = div('detail-page-container');
  const readerContent = div('detail-page-content');

  // ── Header Card ──
  const headerCard = div('topic-header-card weakness-card anim-slide-up');
  headerCard.setAttribute('data-no-terminology', 'true');

  const cardIcon = div('topic-header-card__icon', topic.icon);
  headerCard.appendChild(cardIcon);

  const cardMeta = div('topic-header-card__meta');
  const subjectLabel = SUBJECTS.find((subject) => subject.code === topic.subjectCode)?.label ?? '教材單元';
  cardMeta.innerHTML = `
    <div class="topic-header-card__badges">
      <span class="badge badge--info">${topic.code}</span>
      <span class="topic-header-card__subject">${subjectLabel}</span>
    </div>
    <h2 class="topic-header-card__title">${topic.name}</h2>
  `;
  headerCard.appendChild(cardMeta);
  readerContent.appendChild(headerCard);

  // Put each exam-unit relationship map at the top of the lesson, before the detailed notes.
  appendUnitSummary(readerContent, topic);

  // ── Core Concepts Card ──
  if (studyInfo && studyInfo.coreConcepts && studyInfo.coreConcepts.length > 0) {
    const conceptsCard = div('topic-concepts-card weakness-card anim-slide-up');
    conceptsCard.setAttribute('data-no-terminology', 'true');
    conceptsCard.style.padding = '1.25rem';

    const conceptsTitle = div('');
    conceptsTitle.innerHTML = `<h3 style="font-size: 0.875rem; font-weight: 800; color: var(--color-text-primary); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.375rem;">
      <span>💡</span> 核心學習重點與考點
    </h3>`;
    conceptsCard.appendChild(conceptsTitle);

    const tagsContainer = div('');
    tagsContainer.style.display = 'flex';
    tagsContainer.style.flexWrap = 'wrap';
    tagsContainer.style.gap = '0.5rem';

    const concepts = [...new Set(studyInfo.coreConcepts)];
    for (const concept of concepts) {
      const tag = Badge(concept, 'neutral');
      tag.style.padding = '0.35rem 0.75rem';
      tag.style.fontSize = '0.8125rem';
      tag.style.fontWeight = '600';
      tag.style.background = 'var(--color-bg-secondary)';
      tag.style.border = '1px solid var(--color-border)';
      tag.style.color = 'var(--color-text-secondary)';
      tag.style.borderRadius = 'var(--radius-md)';
      tagsContainer.appendChild(tag);
    }
    conceptsCard.appendChild(tagsContainer);
    readerContent.appendChild(conceptsCard);
  }

  // ── Special Labs (e.g. APPX01 Interactive Formula Lab) ──
  if (topicCode === 'APPX01') {
    readerContent.appendChild(createAPPX01Lab());
  }

  // ── Study Content Card ──
  const studyCard = div('weakness-card anim-slide-up');
  studyCard.style.padding = '1.5rem';

  const studyTitle = div('');
  studyTitle.innerHTML = `<h3 style="font-size: 0.875rem; font-weight: 800; color: var(--color-text-primary); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.375rem;">
    <span>📖</span> 重點知識解析與圖表
  </h3>`;
  studyCard.appendChild(studyTitle);

  const studyContent = div('');
  studyContent.style.marginTop = '0.75rem';

  if (topicCode === 'APPX03') {
    if (studyInfo) {
      renderMath(studyInfo.details).then((rendered) => {
        studyContent.replaceChildren(createOfficialStudyGuide(rendered));
        expandTerminology(studyContent);
      });
    }
  } else if (studyInfo) {
    renderMath(studyInfo.details).then(async (rendered) => {
      if (topicCode === 'APPX02') {
        studyContent.replaceChildren(createTrapStudyCards(rendered));
      } else if (topicCode === 'APPX01') {
        const details = h('details', { className: 'appx-reference' });
        details.innerHTML = `
          <summary>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span>📚</span>
              <span>8 大題型核心推導講義與歷屆題解（點擊展開詳閱）</span>
            </div>
            <span class="badge badge--info" style="font-size: 0.6875rem; font-weight: 750;">完整解析手冊</span>
          </summary>
          <div class="appx-reference__content">${rendered}</div>
        `;
        studyContent.replaceChildren(details);
      } else {
        studyContent.innerHTML = rendered;
        await renderMermaidDiagrams(studyContent);
        const explainer = createChapterExplainer(topicCode);
        if (explainer) {
          const overview = studyContent.querySelector('.unit-visual');
          if (overview) overview.after(explainer);
          else studyContent.prepend(explainer);
        }
      }
      prepareStudyDiagrams(studyContent);
      expandTerminology(studyContent);
      if (/^M\d{5}$/.test(topicCode)) {
        const navigator = createStudyChapterNavigator(readerContent);
        if (navigator) {
          readerContent.closest('.page-content')?.querySelector('.header__actions')?.prepend(navigator);
        }
      }
    });
  } else {
    studyContent.innerHTML = `<p style="color: var(--color-text-muted);">教材資料加載中...</p>`;
  }

  studyCard.appendChild(studyContent);
  readerContent.appendChild(studyCard);

  // ── Bottom Navigation Row ──
  const currentIdx = TOPICS.findIndex((t) => t.code === topicCode);
  const prevTopic = currentIdx > 0 ? TOPICS[currentIdx - 1] : null;
  const nextTopic = currentIdx < TOPICS.length - 1 ? TOPICS[currentIdx + 1] : null;

  const navRow = div('flex gap-3 mt-4');

  const prevBtn = h('button', { className: 'nav-btn nav-btn--prev', style: 'flex: 1;' });
  if (prevTopic) {
    prevBtn.innerHTML = `
      <span class="nav-btn__label" style="font-size: 0.7rem; color: var(--color-text-muted);">← 上一單元</span>
      <span class="nav-btn__value" style="font-weight: 700; font-size: 0.875rem;">${prevTopic.name}</span>
    `;
    prevBtn.addEventListener('click', () => navigateTo(`/topic/${prevTopic.code}`));
  } else {
    prevBtn.innerHTML = `
      <span class="nav-btn__label" style="font-size: 0.7rem; color: var(--color-text-muted);">上一單元</span>
      <span class="nav-btn__value" style="font-size: 0.875rem;">已是第一單元</span>
    `;
    prevBtn.disabled = true;
    prevBtn.style.opacity = '0.5';
  }

  const catalogBtn = btn('btn btn--primary', '📚 單元目錄', () => navigateTo('/topics'));
  catalogBtn.style.padding = '0.75rem 1.25rem';
  catalogBtn.style.borderRadius = 'var(--radius-lg)';

  const nextBtn = h('button', { className: 'nav-btn nav-btn--next', style: 'flex: 1;' });
  if (nextTopic) {
    nextBtn.innerHTML = `
      <span class="nav-btn__label" style="font-size: 0.7rem; color: var(--color-text-muted);">下一單元 →</span>
      <span class="nav-btn__value" style="font-weight: 700; font-size: 0.875rem;">${nextTopic.name}</span>
    `;
    nextBtn.addEventListener('click', () => navigateTo(`/topic/${nextTopic.code}`));
  } else {
    nextBtn.innerHTML = `
      <span class="nav-btn__label" style="font-size: 0.7rem; color: var(--color-text-muted);">下一單元</span>
      <span class="nav-btn__value" style="font-size: 0.875rem;">已是最後單元</span>
    `;
    nextBtn.disabled = true;
    nextBtn.style.opacity = '0.5';
  }

  navRow.appendChild(prevBtn);
  navRow.appendChild(catalogBtn);
  navRow.appendChild(nextBtn);
  readerContent.appendChild(navRow);
  container.appendChild(readerContent);

  return PageShell('/topics', container, {
    onBack: () => navigateTo('/topics'),
    subtitle: topic.name,
    readingMode: true,
  });
}
