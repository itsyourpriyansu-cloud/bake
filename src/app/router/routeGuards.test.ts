import { beforeEach, describe, expect, it } from 'vitest'
import { readKdsSession, readOwnerSession, sessionKeys } from './routeGuards'
describe('auth realm boundaries', () => {
  beforeEach(() => sessionStorage.clear())
  it('never treats an owner session as a KDS session', () => {
    sessionStorage.setItem(sessionKeys.owner, JSON.stringify({ realm: 'owner', email: 'owner@pizzawave.demo', expiresAt: '2099-01-01T00:00:00.000Z' }))
    expect(readOwnerSession()?.realm).toBe('owner'); expect(readKdsSession()).toBeNull()
  })
  it('rejects customer or owner payloads placed in the KDS key', () => {
    sessionStorage.setItem(sessionKeys.kds, JSON.stringify({ realm: 'customer', customerId: 'CUST001', expiresAt: '2099-01-01T00:00:00.000Z' }))
    expect(readKdsSession()).toBeNull()
    sessionStorage.setItem(sessionKeys.kds, JSON.stringify({ realm: 'owner', email: 'owner@pizzawave.demo', expiresAt: '2099-01-01T00:00:00.000Z' }))
    expect(readKdsSession()).toBeNull()
  })
})
