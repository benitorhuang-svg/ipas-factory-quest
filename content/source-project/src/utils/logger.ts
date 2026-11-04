export function debugLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.debug(...args);
  }
}
