/**
 * render.ts — DOM rendering utilities
 * Tiny helpers for creating elements without a framework.
 * Clean Code: composable, no side effects per function.
 */

/** Create an element with class, attributes, and children */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Array<string | HTMLElement>
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else {
      el.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  }

  return el;
}

/** Shortcut: create a div */
export function div(className: string = '', ...children: Array<string | HTMLElement>): HTMLDivElement {
  return h('div', { className }, ...children);
}

/** Shortcut: create a button */
export function btn(
  arg1: string,
  arg2: string | (() => void),
  arg3?: () => void,
): HTMLButtonElement {
  if (typeof arg2 === 'function') {
    // Overload: btn(text, onClick)
    const button = h('button', {}, arg1);
    button.addEventListener('click', arg2);
    return button;
  } else {
    // Overload: btn(className, text, onClick)
    const button = h('button', { className: arg1 }, arg2);
    if (arg3) button.addEventListener('click', arg3);
    return button;
  }
}

/** Render trusted HTML and return the element. Do not pass user-generated input. */
export function html(tag: string, className: string, htmlContent: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = className;
  el.innerHTML = htmlContent;
  return el;
}

/** Escape text before interpolating it into trusted HTML templates. */
export function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
