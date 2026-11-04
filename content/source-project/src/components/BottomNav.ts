import { h, div } from '@/utils/render';
import { navigateTo } from '@/services/router';
import { bindFloatingPanel } from '@/utils/floating-panel';

/** An edge-triggered dock that leaves the reading viewport available. */
export function BottomNav(activePath: string): HTMLElement {
  const dock = div('bottom-nav-dock');
  const trigger = h('button', {
    type: 'button', className: 'bottom-nav__reveal',
    'aria-label': '顯示或收合導覽列', 'aria-controls': 'app-bottom-navigation',
    title: '移到頁面底部展開導覽',
  }, h('span', { className: 'sr-only' }, '導覽'));
  const nav = h('nav', {
    id: 'app-bottom-navigation', className: 'bottom-nav', 'aria-label': '主要導覽',
  });
  const items = [
    { icon: '🏠', label: '首頁', description: '備考進度總覽', path: '/' },
    { icon: '📚', label: '考科單元', description: '所有評鑑大綱單元', path: '/topics' },
    { icon: '📝', label: '電腦測驗', description: '電腦化測驗（Computer-Based Test, CBT）50 題計時模考', path: '/exam' },
    { icon: '🎮', label: '接單挑戰', description: '智慧工廠卡牌模擬挑戰', path: '/game' },
    { icon: '🧮', label: '公式計算', description: '核心公式速查', path: '/topic/APPX01' },
    { icon: '📕', label: '錯題本', description: '答錯與未作答題目複習', path: '/wrong-book' },
    { icon: '⚙️', label: '設定', description: '外觀與主題設定', path: '/settings' },
  ];
  for (const item of items) {
    const isActive = item.path === '/' ? activePath === '/'
      : activePath === item.path || activePath.startsWith(item.path);
    const navItem = h('button', {
      type: 'button', title: item.description, 'aria-label': item.description,
      className: `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`,
    }, h('span', { className: 'bottom-nav__icon', 'aria-hidden': 'true' }, item.icon),
    h('span', { className: 'bottom-nav__label' }, item.label));
    if (isActive) navItem.setAttribute('aria-current', 'page');
    navItem.addEventListener('click', () => navigateTo(item.path));
    nav.appendChild(navItem);
  }
  dock.append(trigger, nav);
  bindFloatingPanel(dock, trigger, nav);
  return dock;
}
