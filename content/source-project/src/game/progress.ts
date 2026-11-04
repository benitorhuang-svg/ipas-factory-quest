/**
 * progress.ts — Local Persistence for Game Level Completion & Star Ratings
 * Uses localStorage with JSON serialization, resilient to schema migrations.
 */

export interface LevelRecord {
  completed: boolean;
  stars: number;
  score: number;
  completedAt?: number;
}

const STORAGE_KEY = 'ipas_game_progress_v1';

export function getAllProgress(): Record<string, LevelRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function isLevelCompleted(levelId: string): boolean {
  const all = getAllProgress();
  return Boolean(all[levelId]?.completed);
}

export function getLevelRecord(levelId: string): LevelRecord | undefined {
  const all = getAllProgress();
  return all[levelId];
}

export function setLevelCompleted(levelId: string, stars = 1, score = 100): void {
  const all = getAllProgress();
  const existing = all[levelId];
  const newStars = Math.max(existing?.stars || 0, stars);
  const newScore = Math.max(existing?.score || 0, score);

  all[levelId] = {
    completed: true,
    stars: newStars,
    score: newScore,
    completedAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('game-progress-updated', { detail: { levelId, stars: newStars } }));
  } catch (err) {
    console.error('Failed to save game progress:', err);
  }
}

export function getCompletedCount(): number {
  const all = getAllProgress();
  return Object.values(all).filter((r) => r.completed).length;
}

export function getTotalStars(): number {
  const all = getAllProgress();
  return Object.values(all).reduce((acc, r) => acc + (r.stars || 0), 0);
}
