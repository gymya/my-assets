import { getExchangeRates } from '../../utils/market'
export default defineEventHandler(async () => {
  try { return await getExchangeRates() }
  catch { throw createError({ statusCode: 502, statusMessage: 'TAIFEX unavailable' }) }
})
