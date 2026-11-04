/** Hover discovery with click, keyboard, touch, and route cleanup. */
export function bindFloatingPanel(
  root: HTMLElement,
  trigger: HTMLButtonElement,
  panel: HTMLElement,
  onDestroy?: () => void,
): { open(): void; close(): void; destroy(): void } {
  const route = location.hash;
  let opened = false;
  let clickedOpen = false;
  let closeTimer = 0;
  let destroyed = false;

  const setOpen = (value: boolean): void => {
    clearTimeout(closeTimer);
    if (destroyed) return;
    opened = value;
    root.classList.toggle('is-open', value);
    trigger.setAttribute('aria-expanded', String(value));
    panel.setAttribute('aria-hidden', String(!value));
    panel.inert = !value;
    if (!value) clickedOpen = false;
  };
  const close = (): void => setOpen(false);
  const onEnter = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse') setOpen(true);
  };
  const onLeave = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return;
    clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && root.contains(active) && active.matches(':focus-visible')) return;
      close();
    }, 180);
  };
  const onClick = (): void => {
    clickedOpen = !clickedOpen;
    setOpen(clickedOpen);
  };
  const onFocus = (event: FocusEvent): void => {
    if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) setOpen(true);
  };
  const onBlur = (event: FocusEvent): void => {
    if (!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) close();
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && opened) {
      event.preventDefault();
      event.stopPropagation();
      trigger.focus({ preventScroll: true });
      close();
    } else if (event.key === 'ArrowDown' && event.target === trigger) {
      event.preventDefault();
      setOpen(true);
      const list = panel.querySelector<HTMLElement>('nav') ?? panel;
      list.scrollTop = 0;
      panel.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
    }
  };
  const onOutside = (event: PointerEvent): void => {
    if (event.target instanceof Node && !root.contains(event.target)) close();
  };
  const onTeardown = (): void => {
    // The incoming page is constructed before the outgoing page is removed.
    if (root.isConnected || location.hash !== route) destroy();
  };
  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    clearTimeout(closeTimer);
    root.removeEventListener('pointerenter', onEnter);
    root.removeEventListener('pointerleave', onLeave);
    root.removeEventListener('focusin', onFocus);
    root.removeEventListener('focusout', onBlur);
    root.removeEventListener('keydown', onKey);
    trigger.removeEventListener('click', onClick);
    document.removeEventListener('pointerdown', onOutside);
    window.removeEventListener('route-teardown', onTeardown);
    onDestroy?.();
  }
  root.addEventListener('pointerenter', onEnter);
  root.addEventListener('pointerleave', onLeave);
  root.addEventListener('focusin', onFocus);
  root.addEventListener('focusout', onBlur);
  root.addEventListener('keydown', onKey);
  trigger.addEventListener('click', onClick);
  document.addEventListener('pointerdown', onOutside);
  window.addEventListener('route-teardown', onTeardown);
  setOpen(false);
  return { open: () => setOpen(true), close, destroy };
}
