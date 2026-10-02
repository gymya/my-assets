<script setup lang="ts">
  const store = usePortfolioStore();
  const filter = ref('all');
  const filters = [
    { key: 'all', label: '全部資產' },
    { key: 'local', label: '台幣存款' },
    { key: 'foreign', label: '外幣' },
    { key: 'stock', label: '台股' },
  ];
  const menu = [
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
        <h1>我的資產</h1>
        
      </div>
      <UDropdownMenu :items="menu"
        ><button class="button primary"><AppIcon name="plus" :size="18" />新增資產</button></UDropdownMenu
      >
    </div>
    <section class="compact-total">
      <span>總資產</span><strong>{{ store.totals.complete ? store.money(store.totals.assets) : '待完成估值' }}</strong
      ><small>{{ store.count }} 筆資產 · 以新臺幣估算</small>
    </section>
    <div v-if="!store.totals.complete" class="notice">{{ store.totals.missing.join('；') }}</div>
    <section class="panel">
      <div class="filter-tabs" aria-label="資產分類">
        <button
          v-for="item in filters"
          :key="item.key"
          :class="{ selected: filter === item.key }"
          :aria-pressed="filter === item.key"
          @click="filter = item.key"
        >
          {{ item.label }}
        </button>
      </div>
      <AssetList :filter="filter" />
    </section>
    <div class="market-note">
      <AppIcon name="info" :size="16" />點選資產即可編輯。外幣依每日參考匯率估算，不代表銀行實際換匯金額。
    </div>
  </div>
</template>
