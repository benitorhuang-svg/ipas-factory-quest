import type { DiagramMode } from '@/core/interactive-diagram';

const key = 'smartprod-unit-summary-view-v1';
interface Preferences { mode: Exclude<DiagramMode, 'manual'>; largeText: boolean }

export function readSummaryPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
    return { mode: saved?.mode === 'overview' ? 'overview' : 'readable', largeText: saved?.largeText !== false };
  } catch {
    return { mode: 'readable', largeText: true };
  }
}

export function saveSummaryPreferences(patch: Partial<Preferences>): void {
  try { localStorage.setItem(key, JSON.stringify({ ...readSummaryPreferences(), ...patch })); }
  catch { /* Reading controls remain usable when browser storage is unavailable. */ }
}
