import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

/** VITE_USE_DEMO_DATA=true 时保留 demo-backup.json；否则从 dist 移除以减小体积 */
function excludeDemoBackupFromDist(skip: boolean) {
  return {
    name: 'exclude-demo-backup-from-dist',
    apply: 'build' as const,
    closeBundle() {
      if (skip) return
      const file = path.resolve('dist/demo-backup.json')
      try {
        fs.unlinkSync(file)
      } catch {
        /* 无演示文件时忽略 */
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const forNative = mode === 'capacitor' || mode === 'capacitor-debug'
  /** dev / capacitor-debug / production(PWA) / release 由 env 控制是否保留 demo-backup.json */
  const useDemoData =
    mode === 'capacitor-debug' ||
    env.VITE_USE_DEMO_DATA === 'true'

  return {
    base: forNative ? './' : '/',
    plugins: [
      vue(),
      excludeDemoBackupFromDist(useDemoData),
      VitePWA({
        disable: forNative,
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: '乡程掌柜',
          short_name: '乡程掌柜',
          description: '轻量离线乡村商铺商品与销售管理',
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
