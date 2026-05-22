import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const forNative = mode === 'capacitor'

  return {
    base: forNative ? './' : '/',
    plugins: [
      vue(),
      VitePWA({
        disable: forNative,
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: '零售日志',
          short_name: '零售日志',
          description: '轻量离线零售商品与销售管理',
          theme_color: '#2b5e3b',
          background_color: '#f5f7fb',
          display: 'standalone',
          orientation: 'portrait',
          start_url: './',
          icons: [
            {
              src: 'favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,jsonl}'],
          maximumFileSizeToCacheInBytes: 32 * 1024 * 1024,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true,
      port: 5173,
    },
  }
})
