/**
 * main.ts — Application Entry Point for iPAS 智慧生產工程師 PWA
 */

import { addRoute, initRouter, setNotFound, navigateTo } from '@/services/router';
import { div, h } from '@/utils/render';
import { registerSW } from 'virtual:pwa-register';

// Setup PWA update prompt
registerSW({
  onNeedRefresh() {
    const existingToast = document.querySelector('.pwa-toast');
    if (existingToast) return;

    const toast = document.createElement('div');
    toast.className = 'pwa-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: var(--color-bg-elevated, #1e293b);
      color: var(--color-text-primary, #f8fafc);
      padding: 12px 18px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 9999;
      border: 1px solid var(--color-border, #334155);
    `;

    const message = div('message', '✨ 有新版本筆記可用！');
    message.style.fontSize = '14px';
    message.style.fontWeight = '600';
    toast.appendChild(message);

    const refreshBtn = h('button', { className: 'btn btn--primary', type: 'button' }, '立即更新');
    refreshBtn.style.padding = '6px 14px';
    refreshBtn.style.fontSize = '13px';
    refreshBtn.style.borderRadius = '8px';
    refreshBtn.addEventListener('click', () => {
      window.location.reload();
    });
    toast.appendChild(refreshBtn);
    document.body.appendChild(toast);
  },
  onOfflineReady() {
    console.log('✅ PWA 離線快取就緒，隨時可離線閱讀');
  },
});

// Register routes
addRoute('/', () => import('@/pages/DashboardPage').then((m) => m.DashboardPage()));
addRoute('/topics', () => import('@/pages/TopicsPage').then((m) => m.TopicsPage()));
addRoute('/topic/:topicCode', (params) =>
  import('@/pages/TopicDetailPage').then((m) => m.TopicDetailPage(params))
);
addRoute('/exam', () => import('@/pages/ExamSelectPage').then((m) => m.ExamSelectPage()));
addRoute('/exam/:subjectCode', (params) => import('@/pages/ExamPage').then((m) => m.ExamPage(params)));
addRoute('/exam-history', () => import('@/pages/ExamHistoryPage').then((m) => m.ExamHistoryPage()));
addRoute('/wrong-book', () => import('@/pages/WrongBookPage').then((m) => m.WrongBookPage()));
addRoute('/resources', () => import('@/pages/ResourcesPage').then((m) => m.ResourcesPage()));
addRoute('/game', () => import('@/pages/GameLobbyPage').then((m) => m.GameLobbyPage()));
addRoute('/game/:levelId', (params) =>
  import('@/pages/GamePlayPage').then((m) => m.GamePlayPage(params))
);
addRoute('/settings', () => import('@/pages/SettingsPage').then((m) => m.SettingsPage()));

// 404 Fallback
setNotFound(() => {
  const emptyState = div('empty-state');
  emptyState.style.padding = '3rem 1rem';
  emptyState.style.textAlign = 'center';
  emptyState.append(
    div('empty-state__icon', '🧭'),
    div('empty-state__title', '404 頁面不存在'),
    div('empty-state__desc', '您所尋找的章節或頁面路徑無效。')
  );
  const homeBtn = h('button', { className: 'btn btn--primary mt-4' }, '返回首頁');
  homeBtn.style.padding = '0.75rem 1.5rem';
  homeBtn.style.borderRadius = '9999px';
  homeBtn.addEventListener('click', () => navigateTo('/'));
  emptyState.appendChild(homeBtn);
  return emptyState;
});

// Boot the application
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
});

// If already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initRouter();
}
