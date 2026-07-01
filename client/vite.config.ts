import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'robots.txt'],
      manifest: {
        name: 'Anahata',
        short_name: 'Anahata',
        description: 'Personal breath, music, journaling, and body-signal guidance.',
        theme_color: '#F7F4EE',
        background_color: '#F7F4EE',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/library/,
            handler: 'NetworkFirst',
            options: { cacheName: 'library-api', expiration: { maxAgeSeconds: 86400 } }
          },
          {
            // Raga/track audio hosted on R2 — cache-first so replays are
            // instant and recently-played tracks stay available offline.
            urlPattern: /^https:\/\/pub-[a-z0-9]+\.r2\.dev\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'track-audio',
              cacheableResponse: { statuses: [0, 200, 206] },
              matchOptions: { ignoreVary: true },
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              rangeRequests: true
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/ws':  { target: 'ws://localhost:3001',  ws: true }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }
        }
      }
    }
  }
});
