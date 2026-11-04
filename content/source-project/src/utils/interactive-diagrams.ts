import type { DiagramController, DiagramState } from '@/core/interactive-diagram';
import { addArchifyViewControlBridge } from '@/utils/archify-viewer-bridge';
import { readSummaryPreferences } from '@/utils/unit-summary-preferences';

const channel = 'ipas-archify-view-v2';
const documents = new Map<string, string>();
const loadTimeoutMs = 20_000;

/** Lazy, bounded document loading with one isolated command channel per attempt. */
export function prepareInteractiveDiagram(frame: HTMLIFrameElement, source: string): DiagramController | null {
  if (frame.dataset.diagramSource) return null;
  const url = new URL(source, document.baseURI);
  const assetRoot = new URL(`${import.meta.env.BASE_URL}assets/interactive-diagrams/`, document.baseURI);
  if (url.origin !== location.origin || !url.pathname.startsWith(assetRoot.pathname)) return null;
  frame.dataset.diagramSource = url.href;
  frame.removeAttribute('src');
  frame.removeAttribute('loading');
  const route = location.hash;
  const figure = frame.closest('figure');
  let state: DiagramState = { status: 'idle', scale: 1, minFontPx: 0, mode: readSummaryPreferences().mode };
  let token = '';
  let timeout = 0;
  let attempt = 0;
  let destroyed = false;
  let request: AbortController | null = null;
  const theme = (): 'dark' | 'light' => document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const emit = (patch: Partial<DiagramState>): void => {
    state = { ...state, ...patch };
    frame.dataset.diagramState = state.status;
    figure?.setAttribute('aria-busy', String(state.status === 'loading' || state.status === 'idle'));
    frame.dispatchEvent(new CustomEvent<DiagramState>('diagram-state', { detail: state }));
  };
  const send = (action: string, extra: Record<string, unknown> = {}): void => {
    if (destroyed || state.status !== 'ready') return;
    frame.contentWindow?.postMessage({ channel, token, action, ...extra }, '*');
  };
  const fail = (message: string): void => {
    if (destroyed) return;
    clearTimeout(timeout);
    request?.abort();
    documents.delete(url.href);
    emit({ status: 'error', message });
    frame.srcdoc = '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><body><p role="status">互動圖載入失敗。請重新載入，或使用完整互動圖連結。</p></body></html>';
  };
  const load = async (): Promise<void> => {
    if (destroyed || !frame.isConnected || state.status === 'loading') return;
    observer.disconnect();
    request?.abort();
    request = new AbortController();
    const currentRequest = request;
    const currentAttempt = ++attempt;
    token = crypto.randomUUID();
    clearTimeout(timeout);
    emit({ status: 'loading', message: undefined });
    timeout = window.setTimeout(() => fail('互動圖載入逾時，請重試或開啟完整互動圖。'), loadTimeoutMs);
    try {
      let html = documents.get(url.href);
      if (!html) {
        const response = await fetch(url, { signal: currentRequest.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        html = await response.text();
        documents.set(url.href, html);
        if (documents.size > 4) documents.delete(documents.keys().next().value!);
      }
      if (destroyed || currentAttempt !== attempt || currentRequest.signal.aborted) return;
      if (!frame.isConnected) { destroy(); return; }
      frame.srcdoc = addArchifyViewControlBridge(html, {
        token, mode: readSummaryPreferences().mode, theme: theme(), enhanced: frame.classList.contains('unit-summary__frame'),
      });
    } catch (error) {
      if (destroyed || currentRequest.signal.aborted || currentAttempt !== attempt) return;
      documents.delete(url.href);
      fail('互動圖暫時無法載入，請檢查連線後重試。');
      console.warn('Interactive diagram could not load:', url.pathname, error);
    }
  };
  const onMessage = (event: MessageEvent): void => {
    const data = event.data;
    if (destroyed || event.source !== frame.contentWindow || data?.channel !== channel || data.token !== token) return;
    if (data.type === 'error') { fail('圖表控制器無法啟動，請重新載入。'); return; }
    if (data.type !== 'ready' && data.type !== 'state') return;
    if (data.type === 'state' && state.status !== 'ready') return;
    if (state.status === 'error' || !Number.isFinite(data.scale) || !Number.isFinite(data.minFontPx)) return;
    clearTimeout(timeout);
    emit({
      status: 'ready', scale: Math.max(.25, Math.min(3, data.scale)),
      minFontPx: Math.max(0, data.minFontPx),
      mode: ['readable', 'overview', 'manual'].includes(data.mode) ? data.mode : 'manual',
      nodeId: typeof data.nodeId === 'string' ? data.nodeId : undefined,
      message: undefined,
    });
  };
  const onTeardown = (): void => {
    // The router creates its next page before replacing the connected one.
    if (frame.isConnected || location.hash !== route) destroy();
  };
  const themeObserver = new MutationObserver(() => send('theme', { theme: theme() }));
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) void load();
  }, { rootMargin: '400px 0px' });
  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    ++attempt;
    clearTimeout(timeout);
    request?.abort();
    observer.disconnect();
    themeObserver.disconnect();
    window.removeEventListener('message', onMessage);
    window.removeEventListener('route-teardown', onTeardown);
  }
  window.addEventListener('message', onMessage);
  window.addEventListener('route-teardown', onTeardown);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  observer.observe(frame);
  emit({ status: 'idle' });
  return { command: (action, nodeId) => send(action, { nodeId }), retry: () => { void load(); }, destroy };
}

/** Upgrade local Archify documents authored directly in study Markdown. */
export function prepareStudyDiagrams(container: HTMLElement): void {
  for (const frame of container.querySelectorAll<HTMLIFrameElement>('iframe[src]')) {
    const source = frame.getAttribute('src');
    if (source) prepareInteractiveDiagram(frame, source);
  }
}
