import { symbolSchema } from '../../../shared/schemas'
import { getStockPrices } from '../../utils/market'
export default defineEventHandler(async event => {
  const result = symbolSchema.safeParse(getRouterParam(event, 'symbol'))
  if (!result.success) throw createError({ statusCode: 400, statusMessage: 'Invalid stock symbol' })
  let prices
  try { prices = await getStockPrices() }
  catch { throw createError({ statusCode: 502, statusMessage: 'TWSE unavailable' }) }
  const price = prices.find(item => item.symbol === result.data)
  if (!price) throw createError({ statusCode: 404, statusMessage: 'No available TWSE closing price' })
  return price
})
