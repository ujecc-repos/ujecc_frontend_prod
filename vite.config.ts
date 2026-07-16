import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['Ecclesys1.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Ecclesys - Gestion d\'église',
        short_name: 'Ecclesys',
        description: 'Plateforme de gestion d\'église',
        theme_color: '#0f766e',
        background_color: '#f8fafc',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        lang: 'fr',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        // The current application bundle is large because routes are eagerly loaded.
        // Precache it so the complete interface remains available offline.
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
      },
      devOptions: {
        // Custom Workbox workers should be tested through `vite preview`.
        // Registering one during HMR can leave a stale dev-sw controlling Vite.
        enabled: false,
      },
    }),
  ],
})
