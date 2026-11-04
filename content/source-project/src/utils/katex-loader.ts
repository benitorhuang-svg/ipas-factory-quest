/**
 * katex-loader.ts — Utility for dynamically loading KaTeX JS and CSS
 */

let katexInstance: any = null;

/**
 * Dynamically loads KaTeX JS and CSS.
 * Returns the KaTeX instance once loaded.
 */
export async function loadKaTeX(): Promise<any> {
  if (katexInstance) {
    return katexInstance;
  }

  try {
    // Dynamically load KaTeX module and CSS in parallel
    const [katexModule] = await Promise.all([
      import('katex'),
      import('katex/dist/katex.min.css')
    ]);

    // Cache the instance (Vite uses default export or namespace export)
    katexInstance = katexModule.default || katexModule;
    return katexInstance;
  } catch (error) {
    console.error('Failed to load KaTeX dynamically:', error);
    throw error;
  }
}
