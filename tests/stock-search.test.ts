import { describe, expect, it } from 'vitest'
import { searchStocks } from '../shared/stock-search'
import { settingsSchema } from '../shared/schemas'
const prices = [
  { symbol: '2330', name: '台積電', price: 1000, date: '2026-10-01', fetchedAt: '2026-10-01T08:00:00Z' },
  { symbol: '0050', name: '元大台灣50', price: 100, date: '2026-10-01', fetchedAt: '2026-10-01T08:00:00Z' }
]
describe('stock search', () => {
  it('accepts stock codes, partial names, and Taiwan spelling variants', () => {
    expect(searchStocks(prices, '2330')[0]?.name).toBe('台積電')
    expect(searchStocks(prices, '臺積')[0]?.symbol).toBe('2330')
    expect(searchStocks(prices, '元大')[0]?.symbol).toBe('0050')
    expect(searchStocks(prices, '')).toEqual([])
    expect(searchStocks(prices, '不存在')).toEqual([])
  })
  it('defaults legacy settings to dark without invalidating old backups', () => {
    expect(settingsSchema.parse({ id: 'preferences', hideBalances: false, lastExportAt: null }).theme).toBe('dark')
    expect(settingsSchema.parse({ id: 'preferences', hideBalances: false, lastExportAt: null, theme: 'light' }).theme).toBe('light')
  })
})
