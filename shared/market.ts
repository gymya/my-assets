import { z } from 'zod'
import { dateSchema, fxSchema, priceSchema } from './schemas'

const numericText = z.string().transform(value => Number(value.replaceAll(',', ''))).pipe(z.number().finite().positive())
export const twseRowSchema = z.object({ Date: z.string().regex(/^\d{7,8}$/), Code: z.string(), Name: z.string(), ClosingPrice: z.string() })
export const twseResponseSchema = z.array(twseRowSchema).min(1)
export const taifexResponseSchema = z.array(z.object({ Date: z.string().regex(/^\d{8}$/), 'USD/NTD': numericText, 'USD/JPY': numericText })).min(1)
export function apiDate(value: string): string {
  const offset = value.length === 7 ? 1911 : 0
  const yearLength = value.length - 4
  return dateSchema.parse(`${Number(value.slice(0, yearLength)) + offset}-${value.slice(yearLength, yearLength + 2)}-${value.slice(-2)}`)
}
export function parseTwseResponse(raw: unknown, now = new Date()) {
  const rows = twseResponseSchema.parse(raw)
  return rows.flatMap(row => {
    // Suspended/untraded securities may have '--'; do not fabricate a zero price.
    if (!/^[\d,]+(?:\.\d+)?$/.test(row.ClosingPrice.trim())) return []
    const result = priceSchema.safeParse({ symbol: row.Code, name: row.Name, price: Number(row.ClosingPrice.replaceAll(',', '')), date: apiDate(row.Date), fetchedAt: now.toISOString() })
    return result.success ? [result.data] : []
  })
}
export function parseTaifexResponse(raw: unknown, now = new Date()) {
  const rows = taifexResponseSchema.parse(raw).sort((a, b) => b.Date.localeCompare(a.Date))
  const row = rows[0]!
  return fxSchema.parse({ id: 'latest', date: apiDate(row.Date), fetchedAt: now.toISOString(), rates: { TWD: 1, USD: row['USD/NTD'], JPY: row['USD/NTD'] / row['USD/JPY'] } })
}
