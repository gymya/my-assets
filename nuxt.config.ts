export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  ssr: false,
  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxt/eslint', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css', '~/assets/css/refinement.css'],
  devtools: { enabled: false },
  typescript: { strict: true },
  colorMode: { preference: 'dark', fallback: 'dark' },
  runtimeConfig: {
    taifexApiBase: 'https://openapi.taifex.com.tw/v1/'
  },
  app: {
    head: {
      title: '我的資產',
      htmlAttrs: { lang: 'zh-Hant-TW' },
      meta: [
        { name: 'description', content: '個人淨資產追蹤：銀行帳戶、台股持股、負債與每月紀錄。' },
        { name: 'theme-color', content: '#111211' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }, { rel: 'apple-touch-icon', href: '/icon-192.png' }]
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '我的資產', short_name: '我的資產', lang: 'zh-Hant-TW',
      description: '個人淨資產追蹤', theme_color: '#111211', background_color: '#111211',
      display: 'standalone', start_url: '/', scope: '/',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api\//],
      globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'],
      additionalManifestEntries: [{ url: '/', revision: new Date().toISOString() }]
    }
  }
})
