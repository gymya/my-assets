import { z } from 'zod'
import { getStockPrices } from '../../utils/market'
import { searchStocks } from '../../../shared/stock-search'
import type { Price } from '../../../shared/schemas'
export default defineEventHandler(async (event): Promise<Price[]> => {
  const result = z.string().trim().min(1).max(60).safeParse(getQuery(event).q)
  if (!result.success) throw createError({ statusCode: 400, statusMessage: 'Invalid search query' })
  try { return searchStocks(await getStockPrices(), result.data) }
  catch { throw createError({ statusCode: 502, statusMessage: 'TWSE unavailable' }) }
})
