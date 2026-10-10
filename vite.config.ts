import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/sentinela-kids-mobile/',
  server: {
    port: 3100,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sentinela Kids Mobile',
        short_name: 'SentinelaMobile',
        description: 'PWA mobile para leitura de QRCode e consulta de alunos e responsáveis',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1976d2',
        orientation: 'portrait',
        icons: [
          {
            src: '/sentinela-kids-mobile/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/sentinela-kids-mobile/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
