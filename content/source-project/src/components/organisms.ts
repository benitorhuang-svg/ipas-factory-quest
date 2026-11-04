/**
 * organisms.ts — Organism UI Components for iPAS 智慧生產工程師 PWA
 */

import { h, div } from '@/utils/render';
import { navigateTo, goBack } from '@/services/router';
import { getTheme, toggleTheme } from '@/utils/theme';
import { showToast } from '@/components/atoms';
import { expandTerminology } from '@/utils/terminology';
import { BottomNav } from '@/components/BottomNav';

export { BottomNav } from '@/components/BottomNav';

/* ── App Header ── */

export function Header(
  title: string,
  subtitle?: string,
  onBack?: (() => void) | boolean,
  onBrandClick?: () => void,
  readingMode = false,
): HTMLElement {
  const header = div('header');
  if (readingMode) header.classList.add('header--reader');

  // Left Area: Brand
  const brand = div('header__brand');
  brand.style.cursor = 'pointer';
  brand.addEventListener('click', () => {
    if (onBrandClick) onBrandClick();
    else navigateTo('/');
  });

  const logo = document.createElement('img');
  logo.src = `./favicon.svg`;
  logo.alt = 'SmartProd';
  logo.className = 'header__logo';
  brand.appendChild(logo);

  const titleEl = div('header__title', title);
  brand.appendChild(titleEl);

  if (subtitle) {
    const subEl = div('header__subtitle', subtitle);
    subEl.title = subtitle;
    subEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!readingMode) navigateTo('/resources');
    });
    brand.appendChild(subEl);
  }

  header.appendChild(brand);

  // Right Area: Actions
  const actions = div('header__actions');

  if (onBack) {
    const backBtn = h('button', { className: 'header__home-btn', title: '回到上一頁' });
    backBtn.innerHTML = '← 返回';
    backBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof onBack === 'function') onBack();
      else goBack();
    });
    actions.appendChild(backBtn);
  }

  // Theme Toggle Button
  const themeBtn = h('button', {
    className: 'header__icon-btn theme-toggle-btn',
    title: '切換深色/淺色模式',
  });

  const updateThemeBtn = () => {
    const isDark = getTheme() === 'dark';
    themeBtn.innerHTML = isDark ? '☀️' : '🌙';
    themeBtn.title = isDark ? '切換為淺色模式' : '切換為深色模式';
  };
  updateThemeBtn();

  themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const next = toggleTheme();
    updateThemeBtn();
    showToast(`已切換至 ${next === 'dark' ? '🌙 深色' : '☀️ 淺色'} 模式`, 'info');
  });

  window.addEventListener('theme-changed', updateThemeBtn);
  actions.appendChild(themeBtn);

  // Settings Gear
  const settingsBtn = h('button', { className: 'header__icon-btn', title: '系統外觀設定' });
  settingsBtn.innerHTML = '⚙️';
  settingsBtn.addEventListener('click', () => navigateTo('/settings'));
  actions.appendChild(settingsBtn);

  header.appendChild(actions);

  return header;
}

/* ── Page Shell ── */

export interface PageShellOptions {
  hideBottomNav?: boolean;
  compactHeader?: boolean;
  onBack?: (() => void) | boolean;
  onBrandClick?: () => void;
  title?: string;
  subtitle?: string;
  readingMode?: boolean;
}

export function PageShell(
  activePath: string,
  ...args: (HTMLElement | PageShellOptions)[]
): HTMLElement {
  let options: PageShellOptions = {};
  let children: HTMLElement[] = [];

  if (args.length > 0) {
    const lastArg = args[args.length - 1];
    if (
      lastArg &&
      typeof lastArg === 'object' &&
      !('nodeType' in lastArg) &&
      ('hideBottomNav' in lastArg || 'compactHeader' in lastArg || 'onBack' in lastArg || 'title' in lastArg || 'subtitle' in lastArg || 'readingMode' in lastArg)
    ) {
      options = lastArg as PageShellOptions;
      children = args.slice(0, -1) as HTMLElement[];
    } else {
      children = args as HTMLElement[];
    }
  }

  const shell = div('page-content');
  if (options.readingMode) shell.classList.add('page-content--reader');
  if (options.hideBottomNav) {
    shell.classList.add('page-content--no-nav');
  }

  const header = Header(
    options.title ?? '智慧生產工程師（初級）',
    options.subtitle ?? '備考特訓與筆記系統',
    options.onBack,
    options.onBrandClick || (() => navigateTo('/')),
    options.readingMode,
  );
  if (options.compactHeader) {
    header.classList.add('header--compact');
  }
  shell.appendChild(header);

  const content = div('page-content__main');
  for (const child of children) {
    content.appendChild(child);
  }
  shell.appendChild(content);

  if (!options.hideBottomNav) {
    shell.appendChild(BottomNav(activePath));
  }

  expandTerminology(shell);

  return shell;
}
