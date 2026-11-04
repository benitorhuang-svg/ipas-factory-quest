/**
 * SettingsPage.ts — Appearance & System Settings
 */

import { div, btn, h } from '@/utils/render';
import { PageShell } from '@/components/organisms';
import { showToast } from '@/components/atoms';
import { getTheme, setTheme, type ThemeMode } from '@/utils/theme';

export function SettingsPage(): HTMLElement {
  const container = div('detail-page-container anim-stagger');

  // Title
  const title = div('settings-section-title');
  title.innerHTML = '🎨 介面與外觀設定';
  container.appendChild(title);

  // ── Theme Card ──
  const themeCard = div('settings-card anim-slide-up');
  themeCard.style.padding = '1.25rem';
  themeCard.style.background = 'var(--color-bg-elevated)';
  themeCard.style.borderRadius = 'var(--radius-xl)';
  themeCard.style.border = '1px solid var(--color-border)';
  themeCard.style.marginBottom = '1rem';

  const currentTheme = getTheme();

  themeCard.innerHTML = `
    <div style="font-weight: 800; font-size: 0.9375rem; color: var(--color-text-primary); margin-bottom: 0.25rem;">🌓 佈景主題切換</div>
    <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.75rem;">自由切換白天清晰淺色模式或夜間沉浸深色模式</div>
    <div style="display: flex; gap: 0.5rem;" id="theme-btn-group">
      <button class="btn ${currentTheme === 'light' ? 'btn--primary' : 'btn--secondary'}" data-theme="light" style="flex: 1;">☀️ 淺色模式</button>
      <button class="btn ${currentTheme === 'dark' ? 'btn--primary' : 'btn--secondary'}" data-theme="dark" style="flex: 1;">🌙 深色模式</button>
    </div>
  `;

  themeCard.querySelectorAll('#theme-btn-group button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const selected = (target.getAttribute('data-theme') || 'light') as ThemeMode;
      setTheme(selected);
      showToast(`已切換為 ${selected === 'dark' ? '🌙 深色' : '☀️ 淺色'} 模式`, 'success');

      // Update buttons
      themeCard.querySelectorAll('#theme-btn-group button').forEach((b) => {
        if (b.getAttribute('data-theme') === selected) {
          b.className = 'btn btn--primary';
        } else {
          b.className = 'btn btn--secondary';
        }
      });
    });
  });

  container.appendChild(themeCard);

  // ── Font Size Card ──
  const fontCard = div('settings-card anim-slide-up');
  fontCard.style.padding = '1.25rem';
  fontCard.style.background = 'var(--color-bg-elevated)';
  fontCard.style.borderRadius = 'var(--radius-xl)';
  fontCard.style.border = '1px solid var(--color-border)';
  fontCard.style.marginBottom = '1rem';

  const currentSize = localStorage.getItem('smartprod_font_size') || '16';

  fontCard.innerHTML = `
    <div style="font-weight: 800; font-size: 0.9375rem; color: var(--color-text-primary); margin-bottom: 0.25rem;">🔍 閱讀文字大小</div>
    <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.75rem;">調整適合您閱讀的內文字型尺寸</div>
    <div style="display: flex; gap: 0.5rem;" id="font-btn-group">
      <button class="btn ${currentSize === '14' ? 'btn--primary' : 'btn--secondary'}" data-size="14" style="flex: 1;">標準 (14px)</button>
      <button class="btn ${currentSize === '16' ? 'btn--primary' : 'btn--secondary'}" data-size="16" style="flex: 1;">舒適 (16px)</button>
      <button class="btn ${currentSize === '18' ? 'btn--primary' : 'btn--secondary'}" data-size="18" style="flex: 1;">放大 (18px)</button>
      <button class="btn ${currentSize === '20' ? 'btn--primary' : 'btn--secondary'}" data-size="20" style="flex: 1;">特大 (20px)</button>
    </div>
  `;

  fontCard.querySelectorAll('#font-btn-group button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const size = target.getAttribute('data-size') || '16';
      localStorage.setItem('smartprod_font_size', size);
      document.documentElement.style.setProperty('--app-font-size', `${size}px`);
      showToast(`字體尺寸已調整為 ${size}px`, 'success');

      fontCard.querySelectorAll('#font-btn-group button').forEach((b) => {
        if (b.getAttribute('data-size') === size) {
          b.className = 'btn btn--primary';
        } else {
          b.className = 'btn btn--secondary';
        }
      });
    });
  });

  container.appendChild(fontCard);

  // ── PWA Info & Cache ──
  const pwaCard = div('settings-card anim-slide-up');
  pwaCard.style.padding = '1.25rem';
  pwaCard.style.background = 'var(--color-bg-elevated)';
  pwaCard.style.borderRadius = 'var(--radius-xl)';
  pwaCard.style.border = '1px solid var(--color-border)';

  pwaCard.innerHTML = `
    <div style="font-weight: 800; font-size: 0.9375rem; color: var(--color-text-primary); margin-bottom: 0.25rem;">📱 PWA 離線支援與快取管理</div>
    <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.75rem;">
      本系統支援 Progressive Web App (PWA)，可在 Chrome / Edge 或手機 Safari 點選「加到主畫面 / 安裝應用程式」，支援離線免連網閱讀。
    </div>
  `;

  const clearBtn = btn('btn btn--secondary', '🔄 清除本機暫存並重新整理', () => {
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) caches.delete(name);
      });
    }
    showToast('已清除快取，正在重新加載...', 'info');
    setTimeout(() => window.location.reload(), 800);
  });
  pwaCard.appendChild(clearBtn);

  container.appendChild(pwaCard);

  return PageShell('/settings', container);
}
