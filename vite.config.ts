import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', 
      // Hanya menyertakan aset yang benar-benar ada di folder public kamu
      includeAssets: ['apple-touch-icon.png', 'favicon-32x32.png', 'favicon-16x16.png'],
      manifest: {
        name: 'StreamHub Premium',
        short_name: 'StreamHub',
        description: 'Premium Video Directory & Talent Chat',
        theme_color: '#141414', 
        background_color: '#141414', 
        display: 'standalone', 
        orientation: 'portrait',
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any' // Standar ikon
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable' // Agar ikon penuh dan bagus di Android/iOS
          }
        ]
      }
    })
  ],
  // Optimasi dependensi agar ikon lucide-react tidak error
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
