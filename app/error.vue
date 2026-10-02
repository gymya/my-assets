<script setup lang="ts">
import type { NuxtError } from '#app'
defineProps<{ error: NuxtError }>()
</script>
<template><div class="error-page"><h1>{{ error.statusCode === 404 ? '找不到這個頁面' : '頁面暫時無法開啟' }}</h1><p>請返回總覽再試一次，本機資料仍會保留。</p><button class="button primary" @click="clearError({ redirect: '/' })">返回資產總覽</button></div></template>
<style scoped>.error-page { min-height: 100vh; display: flex; justify-content: center; align-items: center; flex-direction: column; gap: 25px; padding: 25px; text-align: center; background: #111311; color: #f0f1eb; }.error-page p { color: #a4ae99; }</style>
