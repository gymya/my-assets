import { snapshotSchema } from './schemas'
import type { Currency, MonthlySnapshot, PortfolioData, Rates } from './schemas'

export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
export function convertToTwd(amount: number, currency: Currency, rates: Rates): number | null {
  if (amount === 0) return 0
  const rate = rates[currency]
  return rate === undefined ? null : roundMoney(amount * rate)
}
export function stockValue(shares: number, price?: number): number | null {
  return shares === 0 ? 0 : price === undefined ? null : roundMoney(shares * price)
}
export function yearMonth(date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit' }).format(date)
}
export function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number]
  return `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, '0')}`
}
export function calculatePortfolio(data: PortfolioData) {
  const rates = data.exchangeRates?.rates ?? { TWD: 1 as const }
  const missing: string[] = []
  let stock = 0, local = 0, foreign = 0, liabilities = 0
  for (const account of data.accounts) {
    const value = convertToTwd(account.balance, account.currency, rates)
    if (value === null) missing.push(`${account.name}：缺少 ${account.currency} 匯率`)
    else if (account.currency === 'TWD') local += value
    else foreign += value
  }
  for (const holding of data.stocks) {
    const price = data.prices.find(p => p.symbol === holding.symbol)
    const value = stockValue(holding.shares, price?.price)
    if (value === null) missing.push(`${holding.symbol}：尚無股價`)
    else stock += value
  }
  for (const liability of data.liabilities) {
    const value = convertToTwd(liability.amount, liability.currency, rates)
    if (value === null) missing.push(`${liability.name}：缺少 ${liability.currency} 匯率`)
    else liabilities += value
  }
  const assets = roundMoney(stock + local + foreign)
  return { stock: roundMoney(stock), local: roundMoney(local), foreign: roundMoney(foreign), assets, liabilities: roundMoney(liabilities), netWorth: roundMoney(assets - liabilities), missing, complete: missing.length === 0 }
}
export function monthlyHistory(snapshots: MonthlySnapshot[]): MonthlySnapshot[] {
  const months = new Map<string, MonthlySnapshot>()
  for (const snapshot of snapshots) {
    const existing = months.get(snapshot.yearMonth)
    if (!existing || snapshot.createdAt >= existing.createdAt) months.set(snapshot.yearMonth, snapshot)
  }
  return [...months.values()].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth))
}
export function monthlyChange(current: number, previous?: number) {
  if (previous === undefined) return null
  const amount = roundMoney(current - previous)
  return { amount, percent: previous === 0 ? null : amount / previous * 100 }
}
export function createSnapshot(data: PortfolioData, now = new Date()): MonthlySnapshot | null {
  const value = calculatePortfolio(data)
  if (!value.complete) return null
  return snapshotSchema.parse({
    id: crypto.randomUUID(), yearMonth: yearMonth(now), createdAt: now.toISOString(),
    stockValueTwd: value.stock, localCurrencyValueTwd: value.local, foreignCurrencyValueTwd: value.foreign,
    totalAssetsTwd: value.assets, totalLiabilitiesTwd: value.liabilities, netWorthTwd: value.netWorth,
    exchangeRates: { ...data.exchangeRates?.rates, TWD: 1 }
  })
}
export function appendSnapshot(data: PortfolioData, now = new Date()): void {
  if (!data.accounts.length && !data.stocks.length && !data.liabilities.length && !data.snapshots.length) return
  const snapshot = createSnapshot(data, now)
  if (!snapshot) return
  const last = data.snapshots.at(-1)
  if (last && last.yearMonth === snapshot.yearMonth && last.netWorthTwd === snapshot.netWorthTwd && last.totalLiabilitiesTwd === snapshot.totalLiabilitiesTwd && last.stockValueTwd === snapshot.stockValueTwd && last.localCurrencyValueTwd === snapshot.localCurrencyValueTwd && last.foreignCurrencyValueTwd === snapshot.foreignCurrencyValueTwd && JSON.stringify(last.exchangeRates) === JSON.stringify(snapshot.exchangeRates)) return
  data.snapshots.push(snapshot)
}
export function formatMoney(amount: number, currency: Currency = 'TWD', signed = false): string {
  const prefix = currency === 'TWD' ? 'NT$' : currency === 'USD' ? 'US$' : '¥'
  const sign = amount < 0 ? '−' : signed && amount > 0 ? '+' : ''
  return `${sign}${prefix}${new Intl.NumberFormat('zh-TW', { maximumFractionDigits: currency === 'USD' ? 2 : 0 }).format(Math.abs(amount))}`
}
export const formatDate = (value: string) => new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
