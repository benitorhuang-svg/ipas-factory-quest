/**
 * ResourcesPage.ts — Official learning materials and external references
 */

import { div, h } from '@/utils/render';
import { PageShell } from '@/components/organisms';
import { navigateTo } from '@/services/router';

export function ResourcesPage(): HTMLElement {
  const container = div('detail-page-container anim-stagger');

  const titleSection = div('page-header');
  titleSection.appendChild(div('page-header__title', '📚 官方學習資源：iPAS 智慧生產工程師 (初級)'));
  titleSection.appendChild(
    div(
      'page-header__desc',
      '依據經濟部產業發展署能力鑑定標準（職能基準代碼：MPM3117-001v3）建置。'
    )
  );
  container.appendChild(titleSection);

  const linksContainer = div('resource-grid');
  linksContainer.style.display = 'grid';
  linksContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
  linksContainer.style.gap = '0.875rem';

  const resourceLinks = [
    {
      title: '官方參考書目導引',
      desc: '六大指定參考書目與歷屆試題題型對應重點整理',
      action: () => navigateTo('/topic/APPX03'),
      icon: '📖',
      isInternal: true,
    },
    {
      title: '核心公式與計算題彙整',
      desc: 'ST、EOQ、EPQ、ROP、線平衡、OEE、Cpk 完整推導與試題',
      action: () => navigateTo('/topic/APPX01'),
      icon: '🧮',
      isInternal: true,
    },
    {
      title: '考古題盲點與常見陷阱',
      desc: '易混淆概念辨析與官方考題干擾選項解析',
      action: () => navigateTo('/topic/APPX02'),
      icon: '⚠️',
      isInternal: true,
    },
    {
      title: 'iPAS 官方網站',
      desc: '經濟部產業人才能力鑑定官方最新簡章與考試公告',
      url: 'https://www.ipas.org.tw/',
      icon: '🌐',
    },
    {
      title: 'ICAP 職能基準平台',
      desc: '智慧生產工程師職能基準 (MPM3117-001v3) 官方規範',
      url: 'https://icap.wda.gov.tw/',
      icon: '📄',
    },
  ];

  for (const link of resourceLinks) {
    const item = h('div', {
      className: 'topic-item anim-slide-up',
      style:
        'padding: 1.25rem 1rem; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-bg-elevated); display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; cursor: pointer; height: 100%; box-shadow: var(--shadow-sm);',
    });

    item.addEventListener('click', () => {
      if (link.action) {
        link.action();
      } else if (link.url) {
        window.open(link.url, '_blank', 'noopener,noreferrer');
      }
    });

    item.innerHTML = `
      <div style="font-size: 1.75rem; background: var(--color-bg-secondary); width: 3rem; height: 3rem; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; margin-bottom: 0.25rem;">${link.icon}</div>
      <div style="font-weight: 800; font-size: 0.9375rem; color: var(--color-text-primary);">${link.title}</div>
      <div style="font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.4;">${link.desc}</div>
    `;
    linksContainer.appendChild(item);
  }

  container.appendChild(linksContainer);

  return PageShell('/resources', container);
}
