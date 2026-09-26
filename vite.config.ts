import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/services/pwa',
      filename: 'sw.ts',
      injectRegister: null,
      manifest: false,
      injectManifest: { rollupFormat: 'iife' },
      devOptions: { enabled: false },
    }),
  ],
  server: { host: '127.0.0.1', port: 4173 },
  preview: { host: '127.0.0.1', port: 4174 },
})
