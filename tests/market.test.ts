import { describe, expect, it } from 'vitest'
import { apiDate, parseTaifexResponse, parseTwseResponse } from '../shared/market'
describe('official response boundaries', () => {
  it('converts ROC TWSE dates and parses comma-formatted prices', () => {
    const result = parseTwseResponse([{ Date: '1150930', Code: '2330', Name: '台積電', ClosingPrice: '2,480.00' }, { Date: '1150930', Code: '0050', Name: 'ETF', ClosingPrice: '--' }])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ symbol: '2330', date: '2026-09-30', price: 2480 })
    expect(() => apiDate('20260230')).toThrow()
  })
  it('selects the latest TAIFEX date and derives JPY/TWD through USD', () => {
    const result = parseTaifexResponse([{ Date: '20260930', 'USD/NTD': '32', 'USD/JPY': '160' }, { Date: '20260901', 'USD/NTD': '30', 'USD/JPY': '150' }])
    expect(result.rates).toEqual({ TWD: 1, USD: 32, JPY: .2 })
    expect(result.date).toBe('2026-09-30')
  })
  it('rejects malformed or zero rates and malformed schemas', () => {
    expect(() => parseTaifexResponse([{ Date: '20260930', 'USD/NTD': '32', 'USD/JPY': '0' }])).toThrow()
    expect(() => parseTaifexResponse([])).toThrow()
    expect(() => parseTwseResponse([{ code: '2330' }])).toThrow()
  })
})
