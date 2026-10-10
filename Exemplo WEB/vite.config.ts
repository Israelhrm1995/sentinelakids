import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/sentinela-kids/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sentinela Kids',
        short_name: 'Sentinela',
        description: 'PWA para identificação e segurança de alunos - Busca Segura de Criança',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1976d2',
        orientation: 'portrait',
        icons: [
          {
            src: '/sentinela-kids/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/sentinela-kids/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
