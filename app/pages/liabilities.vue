<script setup lang="ts">
  import { convertToTwd, formatMoney } from '../../shared/finance';
  const store = usePortfolioStore();
  const rows = computed(() =>
    store.data.liabilities.map((item) => ({
      ...item,
      value: convertToTwd(item.amount, item.currency, store.data.exchangeRates?.rates ?? { TWD: 1 }),
    })),
  );
  const complete = computed(() => rows.value.every((item) => item.value !== null));
</script>
<template>
  <div class="page-content">
    <div class="page-heading">
      <div>
        <h1>負債管理</h1>
        
      </div>
      <button class="button primary" @click="store.openEditor('liability')">
        <AppIcon name="plus" :size="18" />新增負債
      </button>
    </div>
    <section class="compact-total liability-total">
      <span>總負債</span><strong>{{ complete ? store.money(store.totals.liabilities) : '待完成估值' }}</strong
      ><small>{{ rows.length }} 筆負債 · 以新臺幣估算</small>
    </section>
    <section class="panel">
      <div class="section-heading">
        <h2>負債明細</h2>
        <span class="small-label">目前未償還金額</span>
      </div>
      <div v-if="rows.length" class="asset-list">
        <button v-for="row in rows" :key="row.id" class="asset-row" @click="store.openEditor('liability', row.id)">
          <span class="asset-icon liability"><AppIcon name="credit" /></span
          ><span class="asset-description"
            ><strong>{{ row.name }}</strong
            ><small>{{ row.currency }} · 負債</small></span
          ><span class="asset-value"
            ><strong>{{ row.value === null ? '待估值' : store.money(row.value) }}</strong
            ><small>{{
              store.data.settings.hideBalances ? '••••••' : formatMoney(row.amount, row.currency)
            }}</small></span
          ><AppIcon name="chevron" :size="16" class="row-chevron" />
        </button>
      </div>
      <div v-else class="list-empty">
        <div class="empty-symbol"><AppIcon name="credit" :size="24" /></div>
        <strong>目前沒有負債紀錄</strong>
        <p>信用卡未繳款、車貸或房貸，都可以在這裡記錄。</p>
        <button class="text-button" @click="store.openEditor('liability')">
          <AppIcon name="plus" :size="16" />新增第一筆負債
        </button>
      </div>
    </section>
  </div>
</template>
