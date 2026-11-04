/**
 * Accuracy rate severity helper
 */
export function getAccuracySeverity(accuracy: number): 'safe' | 'warning' | 'danger' {
  if (accuracy < 40) return 'danger';
  if (accuracy < 70) return 'warning';
  return 'safe';
}
