import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      reportCompressedSize: false,
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'favicon.svg', 'logo.png', 'logo.svg', 'og-preview.png'],
        manifest: {
          name: 'AgriResolve AI',
          short_name: 'AgriResolve',
          description:
            'Multilingual crop health support with explainable multi-agent analysis. Designed for low-connectivity field use.',
          theme_color: '#166534',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/favicon.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/logo.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/logo.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000,
          // Cache common static assets aggressively for field use.
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,glsl}'],
          navigateFallback: '/',
          navigateFallbackDenylist: [/^\/api/], // Don't intercept API requests
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],
        },
      }),
    ],
    define: {
      // Expose generic env vars to the client (Vite specific)
      'process.env.GEMINI_SERVICE_TOKEN': JSON.stringify(env.GEMINI_SERVICE_TOKEN || process.env.GEMINI_SERVICE_TOKEN || ""),
      'process.env.VITE_GEMINI_SERVICE_TOKEN': JSON.stringify(env.VITE_GEMINI_SERVICE_TOKEN || process.env.VITE_GEMINI_SERVICE_TOKEN || "")
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
