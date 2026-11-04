/**
 * router.ts — Lightweight Hash-based SPA Router
 * Clean Code: Single Responsibility — only route matching & transitions.
 */

import type { RouteHandler, RouteParams } from '@/core/types';

const routes = new Map<string, RouteHandler>();
let notFoundHandler: RouteHandler | null = null;
let currentPath = '';

/** Register a route */
export function addRoute(path: string, handler: RouteHandler): void {
  routes.set(path, handler);
}

/** Register 404 fallback */
export function setNotFound(handler: RouteHandler): void {
  notFoundHandler = handler;
}

/** Navigate programmatically */
export function navigateTo(path: string): void {
  window.location.hash = `#${path}`;
}

/** Go back to the previous page */
export function goBack(): void {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    navigateTo('/');
  }
}

function getHashPath(): string {
  const hash = window.location.hash.slice(1) || '/';
  return hash.startsWith('/') ? hash : `/${hash}`;
}

function matchRoute(pattern: string, path: string): { match: boolean; params: RouteParams } {
  // Strip query string from path
  const purePath = path.split('?')[0];
  
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = purePath.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return { match: false, params: {} };

  const params: RouteParams = {};
  const isMatch = patternParts.every((seg, i) => {
    if (seg.startsWith(':')) {
      params[seg.slice(1)] = decodeURIComponent(pathParts[i]);
      return true;
    }
    return seg === pathParts[i];
  });

  return { match: isMatch, params };
}

async function renderPage(container: HTMLElement, handler: RouteHandler, params: RouteParams): Promise<void> {
  container.style.opacity = '0';
  container.style.transform = 'translateY(8px)';
  
  // Show a skeleton if loading takes more than 150ms
  let isLoaded = false;
  const skeletonTimer = setTimeout(() => {
    if (!isLoaded) {
      container.replaceChildren(createRouteSkeleton());
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }
  }, 150);

  const result = await handler(params);
  isLoaded = true;
  clearTimeout(skeletonTimer);

  container.style.opacity = '0'; // reset opacity to fade in new content
  await new Promise(r => setTimeout(r, 50)); // small delay for DOM flush

  window.dispatchEvent(new CustomEvent('route-teardown'));
  container.replaceChildren(result);

  requestAnimationFrame(() => {
    container.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    container.style.opacity = '1';
    container.style.transform = 'translateY(0)';
  });

  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

function createRouteSkeleton(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'p-6 max-w-2xl mx-auto w-full anim-fade-in';
  wrapper.style.marginTop = '2rem';

  const title = document.createElement('div');
  title.className = 'h-8 bg-slate-200 rounded-md mb-6 w-1/3 animate-pulse';

  const body = document.createElement('div');
  body.className = 'h-32 bg-slate-200 rounded-xl mb-4 w-full animate-pulse';

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-2 gap-4';

  const firstCard = document.createElement('div');
  firstCard.className = 'h-24 bg-slate-200 rounded-xl animate-pulse';

  const secondCard = document.createElement('div');
  secondCard.className = 'h-24 bg-slate-200 rounded-xl animate-pulse';

  grid.append(firstCard, secondCard);
  wrapper.append(title, body, grid);
  return wrapper;
}

async function resolveRoute(): Promise<void> {
  const path = getHashPath();
  if (path === currentPath) return;
  currentPath = path;

  const container = document.getElementById('app');
  if (!container) return;

  for (const [pattern, handler] of routes) {
    const { match, params } = matchRoute(pattern, path);
    if (match) {
      await renderPage(container, handler, params);
      return;
    }
  }

  if (notFoundHandler) await renderPage(container, notFoundHandler, {});
}

/** Initialize router */
export function initRouter(): void {
  window.addEventListener('hashchange', () => void resolveRoute());
  void resolveRoute();
}
