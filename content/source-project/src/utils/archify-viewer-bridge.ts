interface BridgeOptions { token: string; mode: 'overview' | 'readable'; theme: 'dark' | 'light'; enhanced: boolean }

/** Serialized into the sandbox: every runtime dependency lives inside this function. */
function embeddedViewer(options: BridgeOptions): void {
  type Viewer = {
    view: {
      state(): { scale: number }; reset(): void; zoomIn(): void; zoomOut(): void;
      centerAt(x: number, y: number, options: { scale: number; minimumScale: number; instant: boolean }): void;
    };
    presentation?: { enter(): void };
    focus?: {
      clear(options: { preserveView: boolean; restoreFocus: boolean }): void;
      set(id: string, options: { toggle: boolean; updateUrl: boolean; hideChip: boolean }): void;
    };
  };
  const channel = 'ipas-archify-view-v2';
  const api = (window as Window & { Archify?: Viewer }).Archify;
  const root = document.documentElement;
  const svg = document.querySelector<SVGSVGElement>('.diagram-container > svg');
  let mode: 'overview' | 'readable' | 'manual' = options.enhanced ? options.mode : 'overview';
  let selected = '';
  let pending = 0;
  let adjusting = false;
  let lastState = '';
  const post = (type: string, extra: Record<string, unknown> = {}): void => {
    window.parent.postMessage({ channel, token: options.token, type, ...extra }, '*');
  };
  if (!api?.view || !svg) { post('error', { message: '圖表控制器無法啟動，請重新載入。' }); return; }
  const view = api.view;
  const style = document.createElement('style');
  style.textContent = `
    html[data-study-viewer] body { padding: .5rem !important; overflow: hidden !important; }
    html[data-study-viewer] .container { height: calc(100dvh - 1rem) !important; gap: 0 !important; }
    html[data-study-viewer] .header, html[data-study-viewer] .toolbar,
    html[data-study-viewer] .cards, html[data-study-viewer] .reader-rail { display: none !important; }
    html[data-study-viewer] .diagram-container { border: 0; border-radius: 0; padding: .5rem .5rem 4rem !important; overflow: auto !important; justify-content: flex-start !important; align-items: flex-start !important; }
    html[data-study-viewer] .diagram-container > svg { transition: none !important; flex: 0 0 auto !important; width: max(100%, var(--study-canvas-min)) !important; min-width: var(--study-canvas-min) !important; height: auto !important; }
    html[data-study-viewer][data-study-mode="overview"] .diagram-container > svg { flex: 1 1 auto !important; width: 100% !important; min-width: 0 !important; height: 100% !important; }
    html[data-study-viewer] .diagram-nav [data-view] { display: none !important; }
    html[data-study-viewer] .diagram-nav button { min-height: 40px; font-size: 14px; }
    html[data-study-viewer] .diagram-nav { position: fixed !important; inset: auto .5rem .5rem auto !important; transform: none !important; max-width: calc(100vw - 1rem); }
    html[data-study-viewer][data-study-pannable="true"] .diagram-container { touch-action: none !important; }
  `;
  if (options.enhanced) document.head.appendChild(style);
  if (options.enhanced) root.dataset.studyViewer = 'true';
  root.dataset.studyMode = mode;
  const sourceFonts = [...svg.querySelectorAll<SVGTextElement>('text[data-node-label]')]
    .map((text) => parseFloat(getComputedStyle(text).fontSize)).filter((size) => size > 0);
  const smallest = Math.min(...sourceFonts);
  root.style.setProperty('--study-canvas-min', `${Math.max(720, Math.ceil(svg.viewBox.baseVal.width * 14 / (smallest * 3)))}px`);
  if (options.enhanced) api.presentation?.enter();

  function fontSize(): number {
    const sizes = [...svg!.querySelectorAll<SVGTextElement>('text[data-node-label]')]
      .filter((text) => text.textContent?.trim())
      .map((text) => {
        const matrix = text.getScreenCTM();
        return matrix ? parseFloat(getComputedStyle(text).fontSize) * Math.hypot(matrix.a, matrix.b) : 0;
      }).filter((size) => size > 0);
    return sizes.length ? Math.min(...sizes) : 0;
  }
  function report(type = 'state'): void {
    const state = { scale: view.state().scale, minFontPx: Math.round(fontSize() * 10) / 10, mode, nodeId: selected };
    root.dataset.studyPannable = String(state.scale > 1);
    const serialized = JSON.stringify(state);
    if (type === 'state' && serialized === lastState) return;
    lastState = serialized;
    post(type, state);
  }
  function setScale(target: number): void {
    target = Math.max(.25, Math.min(3, Math.ceil(target * 4) / 4));
    for (let attempt = 0; attempt < 60; attempt++) {
      const before = view.state().scale;
      if (Math.abs(before - target) < .01) break;
      if (before < target) view.zoomIn(); else view.zoomOut();
      if (view.state().scale === before) break;
    }
  }
  function readable(): void {
    if (window.innerWidth < 1 || window.innerHeight < 1) return;
    const size = fontSize();
    if (size > 0) setScale(view.state().scale * 14 / size);
  }
  function centerSelected(): void {
    const nodes = [...document.querySelectorAll<SVGGElement>('[data-node-id]')];
    const node = nodes.find((item) => item.dataset.nodeId === selected) ?? nodes[0];
    const canvas = svg!.parentElement!;
    if (!node) return;
    const box = node.getBBox();
    const wide = canvas.hasAttribute('data-wide-diagram');
    // Our fixed mobile canvas retains its size while bypassing the native scroll-only camera.
    canvas.removeAttribute('data-wide-diagram');
    const scale = view.state().scale;
    const matrix = svg!.getScreenCTM();
    const unit = matrix ? Math.hypot(matrix.a, matrix.b) / scale : 1;
    const padding = getComputedStyle(canvas);
    const offsetX = (svg!.clientWidth - canvas.clientWidth) / 2 + parseFloat(padding.paddingLeft);
    const offsetY = (svg!.clientHeight - canvas.clientHeight) / 2 + parseFloat(padding.paddingTop);
    canvas.scrollTo({ left: 0, top: 0, behavior: 'instant' });
    view.centerAt(box.x + box.width / 2 + offsetX / (unit * scale),
      box.y + box.height / 2 + offsetY / (unit * scale), { scale, minimumScale: scale, instant: true });
    if (wide) canvas.setAttribute('data-wide-diagram', 'true');
    const target = node.getBoundingClientRect();
    const viewport = canvas.getBoundingClientRect();
    canvas.scrollTo({
      left: canvas.scrollLeft + target.left + target.width / 2 - viewport.left - viewport.width / 2,
      top: canvas.scrollTop + target.top + target.height / 2 - viewport.top - viewport.height / 2,
      behavior: 'instant',
    });
  }
  function schedule(resize = false): void {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      if (adjusting) return;
      adjusting = true;
      if (resize && mode === 'readable') { readable(); centerSelected(); }
      report();
      adjusting = false;
    });
  }
  function theme(value: unknown): void {
    if ((value === 'dark' || value === 'light') && root.dataset.theme !== value) {
      document.querySelector<HTMLButtonElement>('#btn-theme')?.click();
    }
  }
  window.addEventListener('message', (event: MessageEvent) => {
    const command = event.data;
    if (event.source !== window.parent || command?.channel !== channel || command.token !== options.token) return;
    if (command.action === 'theme') { theme(command.theme); return; }
    if (command.action === 'overview') {
      mode = 'overview'; root.dataset.studyMode = mode; selected = '';
      api.focus?.clear({ preserveView: true, restoreFocus: false }); view.reset();
    }
    else if (command.action === 'readable') { mode = 'readable'; root.dataset.studyMode = mode; readable(); centerSelected(); }
    else if (command.action === 'zoom-in') { mode = 'manual'; root.dataset.studyMode = mode; view.zoomIn(); }
    else if (command.action === 'zoom-out') { mode = 'manual'; root.dataset.studyMode = mode; view.zoomOut(); }
    else if (command.action === 'focus-node' && typeof command.nodeId === 'string') {
      const node = [...document.querySelectorAll<SVGGElement>('[data-node-id]')]
        .find((candidate) => candidate.dataset.nodeId === command.nodeId);
      if (node) {
        selected = command.nodeId;
        api.focus?.set(selected, { toggle: false, updateUrl: false, hideChip: true });
        if (mode === 'readable') readable();
        centerSelected();
        report();
      }
    }
    else if (command.action !== 'sync') return;
    schedule(command.action === 'sync');
  });
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest<SVGGElement>('[data-node-id]') : null;
    if (target?.dataset.nodeId) { selected = target.dataset.nodeId; schedule(); }
  });
  document.addEventListener('keydown', () => schedule());
  new MutationObserver(() => schedule()).observe(svg, { attributes: true, attributeFilter: ['style', 'viewBox'] });
  window.addEventListener('resize', () => schedule(true));
  theme(options.theme);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (mode === 'readable') { readable(); centerSelected(); }
    report('ready');
  }));
}

export function addArchifyViewControlBridge(html: string, options: BridgeOptions): string {
  // Adapt the embedded viewer's native zoom step and rounding to 5 percentage points.
  html = html.replaceAll('zoom(state.scale + 0.25)', 'zoom(state.scale + 0.05)')
    .replaceAll('zoom(state.scale - 0.25)', 'zoom(state.scale - 0.05)')
    .replaceAll('Math.round(next * 4) / 4', 'Math.round(next * 20) / 20');
  const script = `<script>(${embeddedViewer.toString()})(${JSON.stringify(options)});</script>`;
  if (!/<\/body\s*>/i.test(html)) throw new Error('Diagram document has no body.');
  return html.replace(/<\/body\s*>/i, `${script}</body>`);
}
