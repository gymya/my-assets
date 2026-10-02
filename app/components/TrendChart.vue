<script setup lang="ts">
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js'
import type { ChartOptions, ScriptableContext } from 'chart.js'
import type { MonthlySnapshot } from '../../shared/schemas'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)
const props = defineProps<{ snapshots: MonthlySnapshot[], tall?: boolean }>()
const store = usePortfolioStore()
const axisColor = computed(() => store.data.settings.theme === 'light' ? '#637851' : '#858B85')
const gridColor = computed(() => store.data.settings.theme === 'light' ? '#e3e8db' : '#2A2D29')
const range = ref(6)
const visible = computed(() => props.snapshots.slice(-range.value))
const chartData = computed(() => ({ labels: visible.value.map(s => `${s.yearMonth.slice(2, 4)}/${s.yearMonth.slice(5)}`), datasets: [{ label: '淨資產', data: visible.value.map(s => s.netWorthTwd), borderColor: '#F05E1C', borderWidth: 2.5, tension: 0.28, fill: true, pointRadius: visible.value.length === 1 ? 5 : 3, pointHoverRadius: 6, pointBackgroundColor: '#F05E1C', pointBorderWidth: 3, pointBorderColor: '#1A1C1A', backgroundColor: (context: ScriptableContext<'line'>) => { const area = context.chart.chartArea; if (!area) return 'rgba(240,94,28,0.08)'; const gradient = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom); gradient.addColorStop(0, 'rgba(240,94,28,0.20)'); gradient.addColorStop(1, 'rgba(240,94,28,0)'); return gradient } }] }))
const options = computed<ChartOptions<'line'>>(() => ({ responsive: true, maintainAspectRatio: false, layout: { padding: { top: 12, right: 10 } }, interaction: { intersect: false, mode: 'index' }, plugins: { legend: { display: false }, tooltip: { enabled: !store.data.settings.hideBalances, backgroundColor: '#30332F', titleColor: '#ddd', bodyColor: '#fff', padding: 12, displayColors: false, callbacks: { label: context => store.money(context.parsed.y ?? 0) } } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: axisColor.value, font: { size: 12 }, maxRotation: 0 } }, y: { border: { display: false }, grid: { color: gridColor.value }, ticks: { color: axisColor.value, font: { size: 12 }, maxTicksLimit: 5, callback: value => store.data.settings.hideBalances ? '•••' : Math.abs(Number(value)) >= 10000 ? `${Number(value) / 10000} 萬` : `${value}` } } } }))
</script>
<template><section class="panel trend-panel"><div class="section-heading"><div><h2>淨資產趨勢</h2></div><div class="segmented" aria-label="趨勢期間"><button v-for="months in [6, 12]" :key="months" :class="{ selected: range === months }" :aria-pressed="range === months" @click="range = months">{{ months }} 個月</button></div></div>
  <div v-if="!visible.length" class="trend-empty" :class="{ tall }"><div class="empty-grid"><svg viewBox="0 0 400 100" aria-hidden="true"><path d="M0 90 Q 60 80 90 65 T 175 62 T 255 36 T 330 24 T400 5" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 5"/></svg></div><div class="empty-chart-copy"><AppIcon name="trend" :size="26"/><strong>尚無歷史紀錄</strong><p>新增資產後，系統會記錄每月淨資產。</p></div></div>
  <div v-else class="line-chart" :class="{ tall }"><Line :data="chartData" :options="options" aria-label="每月淨資產折線圖" role="img"/></div>
  <div class="chart-bottom"><span><i class="legend-dot"/>淨資產<span class="muted">（新臺幣）</span></span><span class="small-label">{{ visible.length === 1 ? '目前僅有一個月紀錄' : '各月最後一筆有效紀錄' }}</span></div>
</section></template>
