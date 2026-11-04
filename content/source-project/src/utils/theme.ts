/**
 * theme.ts — Global Theme & Appearance Controller
 */

export type ThemeMode = 'light' | 'dark';

/** Get current active theme mode */
export function getTheme(): ThemeMode {
  // index.html applies the saved/system preference before rendering. Read the
  // displayed theme so preference changes cannot make the first toggle a no-op.
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/** Set theme mode and apply to DOM */
export function setTheme(mode: ThemeMode): void {
  localStorage.setItem('smartprod_theme', mode);
  
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
    document.body?.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body?.classList.remove('dark');
  }

  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: mode } }));
}

/** Toggle between light and dark modes */
export function toggleTheme(): ThemeMode {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
