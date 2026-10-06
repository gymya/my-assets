<script setup lang="ts">
import { zh_tw } from '@nuxt/ui/locale'
useModalViewport()
const store = usePortfolioStore()
const colorMode = useColorMode()
watch(() => store.data.settings.theme, theme => { colorMode.preference = theme }, { immediate: true })
useHead(() => ({ meta: [{ name: 'theme-color', content: store.data.settings.theme === 'dark' ? '#111311' : '#f6f5f2' }] }))
const online = ref(true)
const updateOnline = () => { online.value = navigator.onLine }
onMounted(async () => {
  updateOnline()
  window.addEventListener('online', updateOnline)
  window.addEventListener('offline', updateOnline)
  await store.hydrate()
  if (online.value) void store.refreshMarket()
})
onUnmounted(() => { window.removeEventListener('online', updateOnline); window.removeEventListener('offline', updateOnline) })
const nav = [
  { to: '/', label: '總覽', icon: 'dashboard' as const },
  { to: '/assets', label: '我的資產', icon: 'wallet' as const },
  { to: '/liabilities', label: '負債管理', icon: 'credit' as const },
  { to: '/history', label: '資產趨勢', icon: 'trend' as const },
  { to: '/settings', label: '設定與備份', icon: 'settings' as const }
]
</script>
<template>
  <UApp :locale="zh_tw" :toaster="null">
    <NuxtPwaManifest />
    <div class="app-shell">
      <aside class="sidebar">
        <NuxtLink to="/" class="brand"><span class="brand-mark"><i/><i/><i/></span><span>我的資產</span></NuxtLink>
        <div class="nav-caption">個人財務空間</div>
        <nav aria-label="主要導覽"><NuxtLink v-for="item in nav" :key="item.to" :to="item.to" class="nav-link" :class="{ active: $route.path === item.to }"><AppIcon :name="item.icon"/><span>{{ item.label }}</span><span v-if="$route.path === item.to" class="nav-dot"/></NuxtLink></nav>
        <div class="sidebar-bottom"><span class="local-icon"><AppIcon name="shield" :size="22"/></span><strong>本機儲存</strong><p>財務資料儲存在這台裝置<br>無需登入</p><NuxtLink to="/settings">管理資料備份 <AppIcon name="arrow" :size="15"/></NuxtLink></div>
        <div class="sidebar-footer"><span class="status-dot"/> 本機儲存模式 <span>v1.0</span></div>
      </aside>
      <div class="main-shell">
        <header class="topbar"><div class="mobile-brand"><span class="brand-mark small"><i/><i/><i/></span>我的資產</div><div class="desktop-breadcrumb">個人財務 <span>/</span> {{ nav.find(item => item.to === $route.path)?.label }}</div><div class="topbar-right"><span class="storage-status"><span class="status-dot"/>{{ online ? '資料儲存於本機' : '離線模式' }}</span><span class="topbar-divider"/><span class="currency-tag">TWD <span>基準幣別</span></span></div></header>
        <main id="main-content">
          <div v-if="!online" class="notice"><AppIcon name="offline"/><span>目前為離線模式，仍可管理資產；行情使用上次更新資料。</span></div>
          <div v-if="store.storageError" role="alert" class="notice error">{{ store.storageError }}</div>
          <div v-for="error in store.marketErrors" :key="error" role="status" class="notice"><AppIcon name="info" :size="18"/>{{ error }}</div>
          <NuxtPage v-show="store.ready"/>
          <div v-if="!store.ready && !store.storageError" class="loading-state" role="status">正在讀取你的資產…</div>
        </main>
        <footer class="page-footer"><span><AppIcon name="shield" :size="14"/>個人資料僅儲存於此瀏覽器</span></footer>
      </div>
      <nav class="mobile-nav" aria-label="行動導覽"><NuxtLink v-for="item in nav" :key="item.to" :to="item.to" :class="{ active: $route.path === item.to }"><AppIcon :name="item.icon"/><span>{{ item.label === '負債管理' ? '負債' : item.label === '設定與備份' ? '設定' : item.label === '資產趨勢' ? '趨勢' : item.label }}</span></NuxtLink></nav>
      <AssetEditor v-if="store.editor" :key="`${store.editor.kind}-${store.editor.id}`"/>
    </div>
  </UApp>
</template>
