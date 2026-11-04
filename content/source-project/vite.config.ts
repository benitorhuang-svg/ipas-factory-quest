import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('src/data/study-materials/')) {
            return 'study-materials';
          }
          if (id.includes('node_modules')) {
            if (id.includes('mermaid') || id.includes('cytoscape') || id.includes('d3') || id.includes('dagre')) return 'vendor-mermaid';
            if (id.includes('katex')) return 'vendor-katex';
            return 'vendor-core';
          }
        },
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'iPAS 智慧生產工程師 — 備考特訓 PWA',
        short_name: 'SmartProd',
        description: 'iPAS 智慧生產工程師 (初級) 能力鑑定備考指南與重點複習特訓系統',
        theme_color: '#0a0e1a',
        background_color: '#0a0e1a',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        categories: ['education', 'productivity'],
        lang: 'zh-TW',
        dir: 'ltr',
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        // Only Vite's hashed chunks are immutable; public chapter documents need content revisions.
        dontCacheBustURLsMatching: /^assets\/[^/]+-[A-Za-z0-9_-]{8}\.(?:js|css)$/,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff2}', 'assets/interactive-diagrams/unit-summaries/*.reader.json'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname.includes('cdn.jsdelivr.net'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cdn-assets',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
