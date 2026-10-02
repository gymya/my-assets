<script setup lang="ts">
import { convertToTwd, stockValue, formatMoney } from '../../shared/finance'
const props = defineProps<{ filter?: string, limit?: number }>()
const store = usePortfolioStore()
const rows = computed(() => {
  const rates = store.data.exchangeRates?.rates ?? { TWD: 1 as const }
  const accounts = store.data.accounts.map(account => ({ id: account.id, kind: 'account' as const, name: account.name, icon: 'bank' as const, category: account.currency === 'TWD' ? 'local' : 'foreign', subtitle: `${account.currency} · 銀行帳戶`, original: store.data.settings.hideBalances ? '••••••' : formatMoney(account.balance, account.currency), value: convertToTwd(account.balance, account.currency, rates) }))
  const stocks = store.data.stocks.map(stock => { const price = store.data.prices.find(p => p.symbol === stock.symbol); return { id: stock.id, kind: 'stock' as const, name: price?.name ?? stock.symbol, icon: 'trend' as const, category: 'stock', subtitle: `${stock.symbol} · ${store.data.settings.hideBalances ? '•••' : stock.shares.toLocaleString('zh-TW')} 股`, original: price ? `股價 ${price.date.replaceAll('-', '/')}` : '尚無可用股價', value: stockValue(stock.shares, price?.price) } })
  const result = [...accounts, ...stocks].filter(row => !props.filter || props.filter === 'all' || row.category === props.filter)
  return props.limit ? result.slice(0, props.limit) : result
})
</script>
<template><div v-if="rows.length" class="asset-list"><button v-for="row in rows" :key="row.id" class="asset-row" @click="store.openEditor(row.kind, row.id)"><span class="asset-icon" :class="row.category"><AppIcon :name="row.icon" :size="21"/></span><span class="asset-description"><strong>{{ row.name }}</strong><small>{{ row.subtitle }}</small></span><span class="asset-value"><strong>{{ row.value === null ? '待估值' : store.money(row.value) }}</strong><small>{{ row.original }}</small></span><AppIcon name="chevron" :size="16" class="row-chevron"/></button></div><div v-else class="list-empty"><div class="empty-symbol"><AppIcon name="wallet" :size="24"/></div><strong>{{ filter && filter !== 'all' ? '還沒有這類資產' : '尚無資產紀錄' }}</strong><button class="text-button" @click="store.openEditor(filter === 'stock' ? 'stock' : 'account')"><AppIcon name="plus" :size="16"/>新增{{ filter === 'stock' ? '台股' : '帳戶' }}</button></div></template>
