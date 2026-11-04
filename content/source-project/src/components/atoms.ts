/**
 * atoms.ts — Atomic UI Components
 */

import { h, div } from '@/utils/render';

/** Colored badge with optional dot */
export function Badge(
  text: string,
  variant: 'safe' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral',
  dot = false
): HTMLElement {
  const badge = div(`badge badge--${variant}`);
  if (dot) {
    badge.appendChild(h('span', { className: 'badge__dot' }));
  }
  badge.appendChild(document.createTextNode(text));
  return badge;
}

/** Progress bar with animated fill */
export function ProgressBar(percent: number, size: 'sm' | 'md' | 'lg' = 'md'): HTMLElement {
  const clamped = Math.max(0, Math.min(100, percent));
  const sizeClass = size !== 'md' ? ` progress--${size}` : '';
  const wrapper = div(`progress${sizeClass}`);
  const fill = div('progress__fill');
  fill.style.width = `${clamped}%`;
  wrapper.appendChild(fill);
  return wrapper;
}

/** Toast Notification popup */
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const containerId = 'toast-container';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.cssText = `
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: var(--z-toast, 9999);
      width: 90%;
      max-width: 380px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  const iconEl = document.createElement('span');
  iconEl.textContent = icon;

  const textEl = document.createElement('span');
  textEl.textContent = message;

  toast.appendChild(iconEl);
  toast.appendChild(textEl);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
