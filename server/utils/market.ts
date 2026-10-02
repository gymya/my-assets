import type { FxQuote, Price } from '../../shared/schemas'
import { parseTwseResponse, parseTaifexResponse } from '../../shared/market'

export const getStockPrices = defineCachedFunction(async (): Promise<Price[]> => {
  const raw = await $fetch<unknown>('https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL', { timeout: 15000, retry: 1, responseType: 'json' })
  const prices = parseTwseResponse(raw)
  if (!prices.length) throw new Error('No valid TWSE prices')
  return prices
}, { maxAge: 900, name: 'twse-prices', getKey: () => 'latest' })
export const getExchangeRates = defineCachedFunction(async (): Promise<FxQuote> => {
  const { taifexApiBase } = useRuntimeConfig()
  const raw = await $fetch<unknown>('DailyForeignExchangeRates', { baseURL: taifexApiBase, timeout: 15000, retry: 1, responseType: 'json' })
  return parseTaifexResponse(raw)
}, { maxAge: 3600, name: 'taifex-rates', getKey: () => useRuntimeConfig().taifexApiBase })
