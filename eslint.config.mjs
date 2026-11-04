export default [
  { ignores: ['content/**', 'docs/**', 'node_modules/**', 'test-results/**', 'playwright-report/**', 'dist/assets/**', 'dist/materials-local.js', 'dist/data.js', 'dist/preview-data.js', 'dist/offline-data.js', 'dist/precache.js', 'dist/styles.css', 'scripts/*.cjs', '!scripts/build-materials.cjs'] },
  {
    files: ['scripts/*.mjs', 'tests/**/*.mjs', 'dist/*.js', 'eslint.config.mjs', 'playwright.config.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-unreachable': 'error', 'no-duplicate-case': 'error',
      'eqeqeq': 'error', 'prefer-const': 'error',
    },
  },
  {
    files: ['scripts/build-materials.cjs', 'tests/*.cjs', 'dist/engine.js'],
    languageOptions: { sourceType: 'commonjs', globals: { globalThis: 'readonly', __dirname: 'readonly', console: 'readonly' } },
    rules: { 'no-unused-vars': 'error', 'no-unreachable': 'error', 'no-undef': 'error' },
  },
  {
    files: ['dist/*.js'],
    languageOptions: { globals: Object.fromEntries(['window', 'document', 'location', 'localStorage', 'crypto', 'URL', 'Blob', 'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'].map(name => [name, 'readonly'])) },
    rules: { 'no-undef': 'error' },
  },
  {
    files: ['dist/sw.js'],
    languageOptions: { globals: Object.fromEntries(['self', 'caches', 'fetch', 'importScripts', 'Response'].map(name => [name, 'readonly'])) },
  },
];
