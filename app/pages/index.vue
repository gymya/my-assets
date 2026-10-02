<script setup lang="ts">
  import { formatDate } from '../../shared/finance';
  const store = usePortfolioStore();
  const today = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());
  const addMenu = ref(false);
  const assetMenu = [
    [
      { label: '銀行帳戶', onSelect: () => store.openEditor('account') },
      { label: '台股持股', onSelect: () => store.openEditor('stock') },
    ],
  ];
</script>
<template>
  <div class="page-content">
    <div class="page-heading">
      <div>
        <div class="eyebrow">{{ today }}</div>
        <h1>資產總覽</h1>
        
      </div>
      <div class="heading-actions">
        <button class="button secondary refresh-button" :disabled="store.refreshing" @click="store.refreshMarket">
          <AppIcon name="refresh" :class="{ spinning: store.refreshing }" :size="17" /><span>{{
            store.refreshing ? '更新中' : '更新行情'
          }}</span></button
        ><UDropdownMenu v-model:open="addMenu" :items="assetMenu"
          ><button class="button primary"><AppIcon name="plus" :size="18" />新增資產</button></UDropdownMenu
        >
      </div>
    </div>
    <div v-if="!store.totals.complete" class="notice valuation-notice">
      <AppIcon name="info" />
      <div>
        <strong>部分資產尚待估值</strong>
        <p>{{ store.totals.missing.join('；') }}。取得完整行情後才會記錄本月淨資產。</p>
      </div>
    </div>
    <section class="wealth-card">
      <div class="wealth-top">
        <span
          ><span class="subtle-square"><AppIcon name="wallet" :size="18" /></span>淨資產</span
        ><button
          class="icon-button"
          :aria-label="store.data.settings.hideBalances ? '顯示金額' : '隱藏金額'"
          @click="store.togglePrivacy().catch(() => undefined)"
        >
          <AppIcon :name="store.data.settings.hideBalances ? 'eyeOff' : 'eye'" :size="19" />
        </button>
      </div>
      <div class="net-worth" :class="{ pending: !store.totals.complete }">
        {{ store.totals.complete ? store.money(store.totals.netWorth) : '待完成估值' }}
      </div>
      <div class="wealth-change">
        <template v-if="store.change"
          ><span class="change-pill" :class="{ negative: store.change.amount < 0 }"
            ><AppIcon :name="store.change.amount < 0 ? 'down' : 'up'" :size="16" />{{
              store.money(store.change.amount, true)
            }}<span v-if="store.change.percent !== null && !store.data.settings.hideBalances"
              >({{ store.change.percent > 0 ? '+' : '' }}{{ store.change.percent.toFixed(2) }}%)</span
            ></span
          ><span>本月變化</span></template
        ><template v-else
          ><span class="first-month-dot" /><span>{{
            store.hasData ? '本月起開始記錄，待有上月紀錄後顯示變化' : '尚無資產紀錄'
          }}</span></template
        >
      </div>
      <div class="wealth-illustration" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      <div class="wealth-footer">
        <span>總資產 − 總負債</span><span>以新臺幣估算 <AppIcon name="arrow" :size="14" /></span>
      </div>
    </section>
    <div class="summary-grid">
      <section class="summary-card">
        <span class="summary-icon"><AppIcon name="wallet" /></span>
        <div>
          <span class="small-label">總資產</span
          ><strong>{{ store.totals.complete ? store.money(store.totals.assets) : '待完成估值' }}</strong>
        </div>
        <NuxtLink to="/assets" aria-label="查看所有資產" class="icon-button"><AppIcon name="up" /></NuxtLink>
      </section>
      <section class="summary-card">
        <span class="summary-icon muted-icon"><AppIcon name="credit" /></span>
        <div>
          <span class="small-label">總負債</span
          ><strong>{{ store.totals.complete ? store.money(store.totals.liabilities) : '待完成估值' }}</strong>
        </div>
        <NuxtLink to="/liabilities" aria-label="查看所有負債" class="icon-button"><AppIcon name="up" /></NuxtLink>
      </section>
    </div>
    <div class="charts-grid"><TrendChart :snapshots="store.history" /><AllocationChart /></div>
    <section class="panel accounts-panel">
      <div class="section-heading">
        <div class="inline-heading">
          <h2>我的資產</h2>
          <span class="count-tag">{{ store.count }}</span>
        </div>
        <NuxtLink to="/assets" class="text-link">查看全部<AppIcon name="arrow" :size="16" /></NuxtLink>
      </div>
      <AssetList :limit="4" />
    </section>
    <div class="market-note">
      <AppIcon name="info" :size="15" /><span
        >行情為每日收盤價與參考匯率，非即時報價。{{
          store.data.exchangeRates ? `匯率日期：${formatDate(store.data.exchangeRates.date)}` : '匯率尚未取得'
        }}</span
      >
    </div>
  </div>
</template>
