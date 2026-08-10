import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

const sha = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'dev'
  }
})()

export default defineConfig({
  base: '/npng/',
  define: {
    __BUILD_SHA__: JSON.stringify(sha),
    __BUILD_AT__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['ex/*.jpg'],
      manifest: {
        name: 'NPNG',
        short_name: 'NPNG',
        lang: 'pt-BR',
        description: 'Treino pessoal segundo a Escola dos Naturais',
        start_url: '/npng/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0b0c',
        theme_color: '#0b0b0c',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // diag.html precisa sempre vir da rede: é a saída quando o app cacheado quebra
        navigateFallbackDenylist: [/diag\.html$/],
        globPatterns: ['**/*.{js,css,html,jpg,png,yaml}'],
        globIgnores: ['diag.html'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
