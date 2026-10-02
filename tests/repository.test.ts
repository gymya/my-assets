import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { createPortfolioRepository } from '../repositories/portfolioRepository'
import { backupSchema } from '../shared/schemas'
import { appendSnapshot } from '../shared/finance'
const account = () => ({ id: crypto.randomUUID(), name: 'Test bank', currency: 'TWD' as const, type: 'bank' as const, balance: 120000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
const repo = () => createPortfolioRepository(`test-${crypto.randomUUID()}`)
describe('IndexedDB repository and backup integrity', () => {
  it('persists entities and snapshots in a transaction and reloads them', async () => {
    const repository = repo()
    await repository.update(data => { data.accounts.push(account()); appendSnapshot(data) })
    const data = await repository.read()
    expect(data.accounts).toHaveLength(1)
    expect(data.snapshots[0]?.netWorthTwd).toBe(120000)
  })
  it('serializes simultaneous changes instead of losing one', async () => {
    const repository = repo()
    await Promise.all([repository.update(d => { d.accounts.push(account()) }), repository.update(d => { d.accounts.push(account()) })])
    expect((await repository.read()).accounts).toHaveLength(2)
  })
  it('round-trips all data through a validated backup', async () => {
    const repository = repo()
    await repository.update(data => { data.accounts.push(account()); appendSnapshot(data) })
    const backup = await repository.export(), destination = repo()
    await destination.restore(JSON.parse(JSON.stringify(backup)))
    expect(await destination.read()).toEqual(backup.data)
  })
  it('leaves existing data untouched after invalid import or write', async () => {
    const repository = repo()
    await repository.update(data => { data.accounts.push(account()); appendSnapshot(data) })
    const original = await repository.read(), backup = await repository.export()
    const corrupt = structuredClone(backup); corrupt.data.accounts[0]!.balance = -1
    expect(() => repository.restore(corrupt)).toThrow()
    await expect(repository.update(data => { data.accounts[0]!.balance = -2 })).rejects.toThrow()
    expect(await repository.read()).toEqual(original)
  })
  it('rejects duplicate IDs, invalid currencies, and inconsistent historical totals', async () => {
    const repository = repo()
    await repository.update(data => { data.accounts.push(account()); appendSnapshot(data) })
    const backup = await repository.export()
    const duplicate = structuredClone(backup); duplicate.data.accounts.push(duplicate.data.accounts[0]!)
    expect(backupSchema.safeParse(duplicate).success).toBe(false)
    const corrupt = structuredClone(backup); corrupt.data.snapshots[0]!.netWorthTwd = 1
    expect(backupSchema.safeParse(corrupt).success).toBe(false)
    expect(backupSchema.safeParse({ ...backup, version: 2 }).success).toBe(false)
  })
})
