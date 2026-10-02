import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import { backupSchema, dataSchema, emptyData } from '../shared/schemas'
import type { Account, Backup, FxQuote, Liability, MonthlySnapshot, PortfolioData, Price, StockHolding } from '../shared/schemas'

interface AssetDatabase extends DBSchema {
  accounts: { key: string, value: Account }
  stocks: { key: string, value: StockHolding }
  liabilities: { key: string, value: Liability }
  prices: { key: string, value: Price }
  exchangeRates: { key: string, value: FxQuote }
  snapshots: { key: string, value: MonthlySnapshot }
  settings: { key: string, value: PortfolioData['settings'] }
}
export interface PortfolioRepository {
  read(): Promise<PortfolioData>
  update(mutator: (data: PortfolioData) => void): Promise<PortfolioData>
  restore(backup: unknown): Promise<PortfolioData>
  export(): Promise<Backup>
}
const stores = ['accounts', 'stocks', 'liabilities', 'prices', 'exchangeRates', 'snapshots', 'settings'] as const
export function createPortfolioRepository(databaseName = 'my-assets'): PortfolioRepository {
  let database: Promise<IDBPDatabase<AssetDatabase>> | undefined
  let queue: Promise<unknown> = Promise.resolve()
  const db = () => database ??= openDB<AssetDatabase>(databaseName, 1, {
    upgrade(database) {
      for (const name of stores) database.createObjectStore(name, { keyPath: name === 'prices' ? 'symbol' : 'id' })
    },
    blocking() { void database?.then(connection => connection.close()); database = undefined }
  })
  async function read(): Promise<PortfolioData> {
    const database = await db()
    const tx = database.transaction([...stores], 'readonly')
    const [accounts, stocks, liabilities, prices, exchangeRates, snapshots, settings] = await Promise.all([
      tx.objectStore('accounts').getAll(), tx.objectStore('stocks').getAll(), tx.objectStore('liabilities').getAll(), tx.objectStore('prices').getAll(),
      tx.objectStore('exchangeRates').get('latest'), tx.objectStore('snapshots').getAll(), tx.objectStore('settings').get('preferences')
    ])
    await tx.done
    snapshots.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return dataSchema.parse({ accounts, stocks, liabilities, prices, exchangeRates: exchangeRates ?? null, snapshots, settings: settings ?? emptyData().settings })
  }
  async function write(raw: PortfolioData) {
    const data = dataSchema.parse(raw)
    const database = await db()
    const tx = database.transaction([...stores], 'readwrite')
    try {
      await Promise.all(stores.map(name => tx.objectStore(name).clear()))
      await Promise.all([
        ...data.accounts.map(value => tx.objectStore('accounts').put(value)),
        ...data.stocks.map(value => tx.objectStore('stocks').put(value)),
        ...data.liabilities.map(value => tx.objectStore('liabilities').put(value)),
        ...data.prices.map(value => tx.objectStore('prices').put(value)),
        ...data.snapshots.map(value => tx.objectStore('snapshots').put(value)),
        tx.objectStore('settings').put(data.settings),
        ...(data.exchangeRates ? [tx.objectStore('exchangeRates').put(data.exchangeRates)] : [])
      ])
      await tx.done
    } catch (error) {
      try { tx.abort() } catch { /* Transaction may have already aborted. */ }
      await tx.done.catch(() => undefined)
      throw error
    }
    return data
  }
  function serialized<T>(operation: () => Promise<T>): Promise<T> {
    const run = async (): Promise<T> => {
      if (typeof navigator !== 'undefined' && navigator.locks) return await navigator.locks.request(databaseName, operation)
      return await operation()
    }
    const result = queue.then(run, run)
    queue = result.catch(() => undefined)
    return result
  }
  return {
    read,
    update: mutator => serialized(async () => { const data = await read(); mutator(data); return write(data) }),
    restore: raw => {
      const backup = backupSchema.parse(raw)
      return serialized(() => write(backup.data))
    },
    export: async () => backupSchema.parse({ app: 'my-assets', version: 1, exportedAt: new Date().toISOString(), data: await read() })
  }
}
export const portfolioRepository = createPortfolioRepository()
