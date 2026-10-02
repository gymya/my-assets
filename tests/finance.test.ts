import { describe, expect, it } from 'vitest'
import { appendSnapshot, calculatePortfolio, convertToTwd, createSnapshot, monthlyChange, monthlyHistory, previousMonth, stockValue, yearMonth } from '../shared/finance'
import { emptyData } from '../shared/schemas'
const now = '2026-10-01T00:00:00.000Z'
function sample() {
  const data = emptyData()
  data.accounts = [
    { id: crypto.randomUUID(), name: 'TWD', currency: 'TWD', type: 'bank', balance: 120000, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: 'USD', currency: 'USD', type: 'bank', balance: 3000, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: 'JPY', currency: 'JPY', type: 'cash', balance: 50000, createdAt: now, updatedAt: now }
  ]
  data.stocks = [{ id: crypto.randomUUID(), symbol: '2330', shares: 1000, updatedAt: now }]
  data.prices = [{ symbol: '2330', name: '台積電', price: 1000, date: '2026-09-30', fetchedAt: now }]
  data.exchangeRates = { id: 'latest', date: '2026-09-30', fetchedAt: now, rates: { TWD: 1, USD: 32, JPY: 0.22 } }
  data.liabilities = [{ id: crypto.randomUUID(), name: 'USD card', currency: 'USD', amount: 500, createdAt: now, updatedAt: now }]
  return data
}
describe('valuation', () => {
  it('values whole shares, zero shares, and missing quotes', () => {
    expect(stockValue(1000, 102.5)).toBe(102500)
    expect(stockValue(0)).toBe(0)
    expect(stockValue(100)).toBeNull()
  })
  it('converts currencies to TWD without duplicating foreign accounts', () => {
    expect(convertToTwd(3000, 'USD', { TWD: 1, USD: 32 })).toBe(96000)
    expect(convertToTwd(50000, 'JPY', { TWD: 1, JPY: .22 })).toBe(11000)
    expect(convertToTwd(10, 'USD', { TWD: 1 })).toBeNull()
    expect(convertToTwd(0, 'USD', { TWD: 1 })).toBe(0)
  })
  it('totals assets, converts liabilities, and subtracts debt', () => {
    expect(calculatePortfolio(sample())).toEqual({ stock: 1000000, local: 120000, foreign: 107000, assets: 1227000, liabilities: 16000, netWorth: 1211000, missing: [], complete: true })
  })
  it('withholds complete valuation and snapshots for missing market data', () => {
    const data = sample(); data.prices = []
    expect(calculatePortfolio(data).complete).toBe(false)
    expect(createSnapshot(data)).toBeNull()
    data.prices = sample().prices; data.exchangeRates = null
    expect(calculatePortfolio(data).missing).toHaveLength(3)
    expect(createSnapshot(data)).toBeNull()
  })
})
describe('monthly history', () => {
  it('handles first month, positive, negative, zero and negative denominators', () => {
    expect(monthlyChange(100)).toBeNull()
    expect(monthlyChange(1850000, 1790000)?.amount).toBe(60000)
    expect(monthlyChange(1850000, 1790000)?.percent).toBeCloseTo(3.351955)
    expect(monthlyChange(175, 200)).toEqual({ amount: -25, percent: -12.5 })
    expect(monthlyChange(100, 0)).toEqual({ amount: 100, percent: null })
    expect(monthlyChange(-50, -100)).toEqual({ amount: 50, percent: -50 })
  })
  it('uses Taiwan calendar boundaries and previous calendar month', () => {
    expect(yearMonth(new Date('2026-09-30T16:01:00Z'))).toBe('2026-10')
    expect(previousMonth('2026-01')).toBe('2025-12')
  })
  it('freezes historical values and selects latest snapshot for each month', () => {
    const data = sample()
    const first = createSnapshot(data, new Date('2026-09-10T00:00:00Z'))!
    data.accounts[0]!.balance = 200000
    const second = createSnapshot(data, new Date('2026-09-30T00:00:00Z'))!
    data.exchangeRates!.rates.USD = 40
    const third = createSnapshot(data, new Date(now))!
    expect(first.netWorthTwd).toBe(1211000)
    expect(second.exchangeRates.USD).toBe(32)
    expect(monthlyHistory([third, first, second])).toEqual([second, third])
  })
  it('records changes, rolls month forward, and avoids identical duplicates', () => {
    const data = sample()
    appendSnapshot(data, new Date(now)); appendSnapshot(data, new Date(now))
    expect(data.snapshots).toHaveLength(1)
    data.accounts[0]!.balance += 1
    appendSnapshot(data, new Date('2026-10-02T00:00:00Z'))
    appendSnapshot(data, new Date('2026-11-01T00:00:00Z'))
    expect(data.snapshots).toHaveLength(3)
    expect(monthlyHistory(data.snapshots)).toHaveLength(2)
  })
})
