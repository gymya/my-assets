<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import type { ChartOptions } from 'chart.js'
ChartJS.register(ArcElement, Tooltip)
const store = usePortfolioStore()
const rows = computed(() => [
  { label: '台股', value: store.totals.stock, color: '#F05E1C' },
  { label: '台幣存款', value: store.totals.local, color: '#E8BB83' },
  { label: '外幣', value: store.totals.foreign, color: '#7E9F94' }
])
const chartData = computed(() => ({ labels: rows.value.map(row => row.label), datasets: [{ data: store.totals.assets ? rows.value.map(row => row.value) : [1], backgroundColor: store.totals.assets ? rows.value.map(row => row.color) : [store.data.settings.theme === 'light' ? '#e2e6db' : '#303230'], borderWidth: 0, hoverOffset: 4, borderRadius: 0, spacing: 0, circumference: 360 }] }))
const options = computed<ChartOptions<'doughnut'>>(() => ({ responsive: true, maintainAspectRatio: false, animation: false, cutout: '76%', rotation: -90, circumference: 360, plugins: { legend: { display: false }, tooltip: { enabled: store.totals.assets > 0 && !store.data.settings.hideBalances, callbacks: { label: context => ` ${context.label}：${store.money(Number(context.raw))}` } } } }))
</script>
<template>
  <section class="panel allocation-panel"><div class="section-heading"><h2>資產配置</h2><span class="small-label">依資產市值</span></div>
    <div v-if="!store.totals.complete" class="chart-placeholder"><AppIcon name="pie" :size="32"/><p>待行情更新後顯示完整配置</p></div>
    <template v-else><div class="donut-wrap"><Doughnut :data="chartData" :options="options" aria-label="台股、台幣存款與外幣的資產配置" role="img"/><div class="donut-center"><span>資產項目</span><strong>{{ store.count }}<small>筆</small></strong></div></div>
      <div class="allocation-legend"><div v-for="row in rows" :key="row.label"><span class="legend-label"><i :style="{ background: row.color }"/>{{ row.label }}</span><strong>{{ store.totals.assets ? (row.value / store.totals.assets * 100).toFixed(1) : '0' }}<small>%</small></strong><span class="legend-amount">{{ store.money(row.value) }}</span></div></div>
    </template><p class="panel-footnote">以總資產為 100%，不含負債</p>
  </section>
</template>
