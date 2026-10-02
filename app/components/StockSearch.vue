<script setup lang="ts">
import { symbolSchema } from '../../shared/schemas'
import type { Price } from '../../shared/schemas'
const model = defineModel<string>({ required: true })
const store = usePortfolioStore()
const cachedPrice = store.data.prices.find(price => price.symbol === model.value)
const selectedLabel = ref(cachedPrice ? `${cachedPrice.symbol} ${cachedPrice.name}` : model.value)
const query = ref(selectedLabel.value)
const results = ref<Price[]>([])
const loading = ref(false)
const searched = ref(false)
const cached = ref(false)
const expanded = ref(false)
const active = ref(-1)
let timer: ReturnType<typeof setTimeout> | undefined
let request = 0
function select(price: Price) {
  request++
  clearTimeout(timer)
  selectedLabel.value = `${price.symbol} ${price.name}`
  query.value = selectedLabel.value
  model.value = price.symbol
  expanded.value = false
  loading.value = false
}
watch(query, value => {
  if (value === selectedLabel.value) return
  const current = ++request
  clearTimeout(timer)
  const term = value.trim()
  model.value = symbolSchema.safeParse(term.toUpperCase()).success ? term.toUpperCase() : ''
  results.value = []; active.value = -1; searched.value = false
  expanded.value = !!term
  loading.value = !!term
  if (!term) return
  timer = setTimeout(async () => {
    const response = await store.searchStocks(term)
    if (request !== current) return
    results.value = response.results
    cached.value = response.cached
    searched.value = true
    loading.value = false
    const exact = response.results.filter(price => price.name.replaceAll('臺', '台') === term.replaceAll('臺', '台') || price.symbol === term.toUpperCase())
    if (exact.length === 1) model.value = exact[0]!.symbol
  }, 250)
})
function move(direction: number) {
  if (!results.value.length) return
  expanded.value = true
  active.value = (active.value + direction + results.value.length) % results.value.length
}
function enter(event: KeyboardEvent) {
  if (expanded.value && results.value.length) {
    event.preventDefault()
    const price = results.value[active.value < 0 ? 0 : active.value]
    if (price) select(price)
  }
}
onBeforeUnmount(() => { request++; clearTimeout(timer) })
</script>
<template>
  <div class="stock-search">
    <label for="stock-query">股票名稱或代號</label>
    <input id="stock-query" v-model="query" name="stock-query" role="combobox" aria-autocomplete="list" aria-controls="stock-results" :aria-expanded="expanded && results.length > 0" :aria-activedescendant="active >= 0 ? `stock-result-${active}` : undefined" placeholder="例如 台積電、2330、0050" maxlength="60" autocomplete="off" required autofocus @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter="enter" @keydown.esc.prevent.stop="expanded = false" @focus="expanded = results.length > 0" @blur="expanded = false"/>
    <ul v-if="expanded && results.length" id="stock-results" role="listbox" aria-label="股票搜尋結果" class="stock-results">
      <li v-for="(price, index) in results" :id="`stock-result-${index}`" :key="price.symbol" role="option" :aria-selected="active === index" :class="{ active: active === index }" @mousedown.prevent @click="select(price)"><strong>{{ price.symbol }}</strong><span>{{ price.name }}</span></li>
    </ul>
    <p v-if="loading" role="status" class="field-note">搜尋中…</p>
    <p v-else-if="searched && !results.length" role="status" class="field-note">{{ cached ? '目前無法連線搜尋，可直接輸入股票代號。' : '找不到符合的上市股票，請確認名稱或代號。' }}</p>
    <p v-else-if="model" class="field-note">已選擇代號：{{ model }}{{ cached ? '（使用已儲存行情）' : '' }}</p>
  </div>
</template>
