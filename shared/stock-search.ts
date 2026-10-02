import type { Price } from './schemas'
export function searchStocks(prices: Price[], query: string): Price[] {
  const normalize = (value: string) => value.trim().toUpperCase().replaceAll('臺', '台').replaceAll(/\s/g, '')
  const term = normalize(query)
  if (!term) return []
  return prices.filter(price => normalize(price.symbol).includes(term) || normalize(price.name).includes(term))
    .sort((a, b) => {
      const rank = (price: Price) => normalize(price.symbol) === term || normalize(price.name) === term ? 0 : normalize(price.symbol).startsWith(term) ? 1 : 2
      return rank(a) - rank(b) || a.symbol.localeCompare(b.symbol)
    }).slice(0, 10)
}
