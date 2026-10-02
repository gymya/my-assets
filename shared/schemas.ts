import { z } from 'zod'

export const currencySchema = z.enum(['TWD', 'USD', 'JPY'])
export const moneySchema = z.number().finite().min(0).max(1e12)
export const symbolSchema = z.string().regex(/^\d{4,5}[A-Z]?$/, '請輸入有效的台股代號，例如 2330、0050')
const timestamp = z.iso.datetime()
const id = z.uuid()
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}, 'Invalid calendar date')
const name = z.string().trim().min(1, '請輸入名稱').max(60, '名稱最多 60 個字')
export const accountInputSchema = z.object({ name, type: z.enum(['bank', 'cash']), currency: currencySchema, balance: moneySchema })
export const stockInputSchema = z.object({ symbol: symbolSchema, shares: z.number().int().min(0).max(1e9) })
export const liabilityInputSchema = z.object({ name, currency: currencySchema, amount: moneySchema })
export const accountSchema = accountInputSchema.extend({ id, createdAt: timestamp, updatedAt: timestamp })
export const stockSchema = stockInputSchema.extend({ id, updatedAt: timestamp })
export const liabilitySchema = liabilityInputSchema.extend({ id, createdAt: timestamp, updatedAt: timestamp })
export const priceSchema = z.object({ symbol: symbolSchema, name: z.string().min(1).max(100), price: moneySchema, date: dateSchema, fetchedAt: timestamp })
export const ratesSchema = z.object({
  TWD: z.literal(1), USD: z.number().finite().positive().max(1e6).optional(), JPY: z.number().finite().positive().max(1e6).optional()
})
export const fxSchema = z.object({ id: z.literal('latest'), date: dateSchema, fetchedAt: timestamp, rates: ratesSchema.required() })
export const settingsSchema = z.object({ id: z.literal('preferences'), hideBalances: z.boolean(), theme: z.enum(['dark', 'light']).default('dark'), lastExportAt: timestamp.nullable() })
export const snapshotSchema = z.object({
  id, yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  stockValueTwd: moneySchema, localCurrencyValueTwd: moneySchema, foreignCurrencyValueTwd: moneySchema,
  totalAssetsTwd: moneySchema, totalLiabilitiesTwd: moneySchema,
  netWorthTwd: z.number().finite().min(-1e12).max(1e12),
  exchangeRates: ratesSchema, createdAt: timestamp
}).superRefine((s, ctx) => {
  if (Math.abs(s.totalAssetsTwd - s.stockValueTwd - s.localCurrencyValueTwd - s.foreignCurrencyValueTwd) > 0.03 || Math.abs(s.netWorthTwd - s.totalAssetsTwd + s.totalLiabilitiesTwd) > 0.03) {
    ctx.addIssue({ code: 'custom', message: 'Inconsistent snapshot totals' })
  }
  const month = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit' }).format(new Date(s.createdAt))
  if (month !== s.yearMonth) ctx.addIssue({ code: 'custom', message: 'Snapshot month does not match timestamp' })
})
export const dataSchema = z.object({
  accounts: z.array(accountSchema).max(10000), stocks: z.array(stockSchema).max(10000),
  liabilities: z.array(liabilitySchema).max(10000), prices: z.array(priceSchema).max(20000),
  exchangeRates: fxSchema.nullable(), snapshots: z.array(snapshotSchema).max(100000), settings: settingsSchema
}).superRefine((data, ctx) => {
  for (const key of ['accounts', 'stocks', 'liabilities', 'snapshots'] as const) {
    if (new Set(data[key].map(item => item.id)).size !== data[key].length) ctx.addIssue({ code: 'custom', path: [key], message: 'Duplicate identifiers' })
  }
  if (new Set(data.prices.map(item => item.symbol)).size !== data.prices.length) ctx.addIssue({ code: 'custom', path: ['prices'], message: 'Duplicate price symbols' })
})
export const backupSchema = z.object({ version: z.literal(1), app: z.literal('my-assets'), exportedAt: timestamp, data: dataSchema })
export type Currency = z.infer<typeof currencySchema>
export type Account = z.infer<typeof accountSchema>
export type StockHolding = z.infer<typeof stockSchema>
export type Liability = z.infer<typeof liabilitySchema>
export type Price = z.infer<typeof priceSchema>
export type FxQuote = z.infer<typeof fxSchema>
export type Rates = z.infer<typeof ratesSchema>
export type MonthlySnapshot = z.infer<typeof snapshotSchema>
export type PortfolioData = z.infer<typeof dataSchema>
export type AccountInput = z.infer<typeof accountInputSchema>
export type StockInput = z.infer<typeof stockInputSchema>
export type LiabilityInput = z.infer<typeof liabilityInputSchema>
export type Backup = z.infer<typeof backupSchema>
export const emptyData = (): PortfolioData => ({ accounts: [], stocks: [], liabilities: [], prices: [], exchangeRates: null, snapshots: [], settings: { id: 'preferences', hideBalances: false, theme: 'dark', lastExportAt: null } })
