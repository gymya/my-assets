import { z } from 'zod'
import { searchStocks as matchStocks } from '../../shared/stock-search'
import { defineStore } from 'pinia'
import { portfolioRepository } from '../../repositories/portfolioRepository'
import { accountInputSchema, stockInputSchema, liabilityInputSchema, priceSchema, fxSchema, backupSchema, emptyData } from '../../shared/schemas'
import type { AccountInput, StockInput, LiabilityInput, PortfolioData, Price, FxQuote, Backup } from '../../shared/schemas'
import { appendSnapshot, calculatePortfolio, formatMoney, monthlyChange, monthlyHistory, previousMonth, yearMonth } from '../../shared/finance'

export type EditorKind = 'account' | 'stock' | 'liability'
export const usePortfolioStore = defineStore('portfolio', () => {
  const data = ref<PortfolioData>(emptyData())
  const ready = ref(false)
  const saving = ref(false)
  const refreshing = ref(false)
  const storageError = ref('')
  const marketErrors = ref<string[]>([])
  const editor = ref<{ kind: EditorKind, id?: string } | null>(null)
  let channel: BroadcastChannel | undefined
  const totals = computed(() => calculatePortfolio(data.value))
  const history = computed(() => monthlyHistory(data.value.snapshots))
  const change = computed(() => totals.value.complete ? monthlyChange(totals.value.netWorth, history.value.find(s => s.yearMonth === previousMonth(yearMonth()))?.netWorthTwd) : null)
  const count = computed(() => data.value.accounts.length + data.value.stocks.length)
  const hasData = computed(() => count.value > 0 || data.value.liabilities.length > 0)
  const money = (value: number, signed = false) => data.value.settings.hideBalances ? '••••••' : formatMoney(value, 'TWD', signed)
  async function hydrate() {
    try {
      data.value = await portfolioRepository.update(value => appendSnapshot(value))
      storageError.value = ''
      ready.value = true
      if (!channel && typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('my-assets-updates')
        channel.onmessage = () => { void portfolioRepository.read().then(value => { data.value = value }).catch(() => { storageError.value = '無法讀取本機資料，請重新整理。' }) }
      }
    } catch { storageError.value = '無法開啟本機資料庫。請確認瀏覽器允許網站儲存資料，再重新整理。' }
  }
  async function mutate(mutator: (value: PortfolioData) => void, snapshot = true) {
    if (!ready.value) throw new Error('資料庫尚未就緒')
    saving.value = true
    try {
      data.value = await portfolioRepository.update(value => { mutator(value); if (snapshot) appendSnapshot(value) })
      channel?.postMessage('updated')
      storageError.value = ''
    } catch (error) {
      if (import.meta.dev) console.error('Portfolio save failed', error)
      storageError.value = '資料未能儲存，原有資料仍保留。請檢查裝置儲存空間後再試。'
      throw error
    } finally { saving.value = false }
  }
  async function saveAccount(raw: AccountInput, id?: string) {
    const input = accountInputSchema.parse(raw), now = new Date().toISOString()
    await mutate(value => {
      const existing = value.accounts.find(item => item.id === id)
      if (id && !existing) throw new Error('Record no longer exists')
      if (existing) Object.assign(existing, input, { updatedAt: now })
      else value.accounts.push({ ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now })
    })
  }
  async function saveStock(raw: StockInput, id?: string) {
    const input = stockInputSchema.parse(raw), now = new Date().toISOString()
    await mutate(value => {
      const existing = value.stocks.find(item => item.id === id)
      if (id && !existing) throw new Error('Record no longer exists')
      if (existing) Object.assign(existing, input, { updatedAt: now })
      else value.stocks.push({ ...input, id: crypto.randomUUID(), updatedAt: now })
    })
    void refreshMarket()
  }
  async function saveLiability(raw: LiabilityInput, id?: string) {
    const input = liabilityInputSchema.parse(raw), now = new Date().toISOString()
    await mutate(value => {
      const existing = value.liabilities.find(item => item.id === id)
      if (id && !existing) throw new Error('Record no longer exists')
      if (existing) Object.assign(existing, input, { updatedAt: now })
      else value.liabilities.push({ ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now })
    })
  }
  async function remove(kind: EditorKind, id: string) {
    await mutate(value => {
      if (kind === 'account') value.accounts = value.accounts.filter(item => item.id !== id)
      else if (kind === 'stock') value.stocks = value.stocks.filter(item => item.id !== id)
      else value.liabilities = value.liabilities.filter(item => item.id !== id)
    })
  }
  async function refreshMarket() {
    if (refreshing.value || !ready.value) return
    refreshing.value = true
    const errors: string[] = [], prices: Price[] = []
    let rates: FxQuote | undefined
    try {
      await Promise.all([
        (async () => {
          try { rates = fxSchema.parse(await $fetch<unknown>('/api/exchange-rates', { timeout: 20000, retry: 0 })) }
          catch { errors.push('無法更新匯率；已保留上次資料，尚無匯率的項目暫不估值。') }
        })(),
        ...[...new Set(data.value.stocks.map(item => item.symbol))].map(async symbol => {
          try { prices.push(priceSchema.parse(await $fetch<unknown>(`/api/stocks/${symbol}`, { timeout: 20000, retry: 0 }))) }
          catch { errors.push(`${symbol} 無法更新股價；已保留上次資料，尚無股價的項目暫不估值。`) }
        })
      ])
      if (prices.length || rates) await mutate(value => {
        for (const price of prices) {
          const existing = value.prices.find(item => item.symbol === price.symbol)
          if (existing && existing.date <= price.date) Object.assign(existing, price)
          else if (!existing) value.prices.push(price)
        }
        if (rates && (!value.exchangeRates || rates.date >= value.exchangeRates.date)) value.exchangeRates = rates
      })
    } catch { errors.push('更新資料未能儲存，請稍後再試。') }
    finally { marketErrors.value = errors; refreshing.value = false }
  }
  async function searchStocks(query: string): Promise<{ results: Price[], cached: boolean }> {
    try {
      const results = z.array(priceSchema).parse(await $fetch<unknown>('/api/stocks/search', { query: { q: query }, timeout: 15000, retry: 0 }))
      return { results, cached: false }
    } catch { return { results: matchStocks(data.value.prices, query), cached: true } }
  }
  const setTheme = (theme: 'dark' | 'light') => mutate(value => { value.settings.theme = theme }, false)
  const togglePrivacy = () => mutate(value => { value.settings.hideBalances = !value.settings.hideBalances }, false)
  async function exportBackup() {
    const backup = await portfolioRepository.export()
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url; link.download = `my-assets-${new Date().toISOString().slice(0, 10)}.json`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    await mutate(value => { value.settings.lastExportAt = backup.exportedAt }, false)
  }
  async function importBackup(backup: Backup) {
    backupSchema.parse(backup)
    data.value = await portfolioRepository.restore(backup)
    channel?.postMessage('updated')
  }
  function openEditor(kind: EditorKind, id?: string) { editor.value = { kind, id } }
  return { searchStocks, setTheme, data, ready, saving, refreshing, storageError, marketErrors, editor, totals, history, change, count, hasData, money, hydrate, refreshMarket, saveAccount, saveStock, saveLiability, remove, togglePrivacy, exportBackup, importBackup, openEditor }
})
