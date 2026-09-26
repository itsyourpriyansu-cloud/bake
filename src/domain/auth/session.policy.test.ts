import { describe, expect, it } from 'vitest'
import { createCustomerSession, createKdsSession, createOwnerSession, extendOwnerIdle, isOwnerIdleLocked, isSessionExpired } from './session.policy'

const now = new Date('2026-09-08T12:00:00.000Z')

describe('session realm isolation', () => {
  it('each realm produces a distinct, non-interchangeable session shape', () => {
    const customer = createCustomerSession('CUST001', now)
    const owner = createOwnerSession('owner@pizzawave.demo', now)
    const kds = createKdsSession('Kitchen Tablet #1', now)
    expect(customer.realm).toBe('CUSTOMER')
    expect(owner.realm).toBe('OWNER')
    expect(kds.realm).toBe('KDS')
    expect('idleLockAt' in customer).toBe(false)
    expect('idleLockAt' in kds).toBe(false)
    expect('idleLockAt' in owner).toBe(true)
  })

  it('applies each realm its own expiry policy', () => {
    const customer = createCustomerSession('CUST001', now)
    const owner = createOwnerSession('owner@pizzawave.demo', now)
    const kds = createKdsSession('Kitchen Tablet #1', now)
    expect(new Date(customer.expiresAt).getTime() - now.getTime()).toBe(30 * 24 * 60 * 60 * 1000)
    expect(new Date(owner.expiresAt).getTime() - now.getTime()).toBe(12 * 60 * 60 * 1000)
    expect(new Date(kds.expiresAt).getTime() - now.getTime()).toBe(12 * 60 * 60 * 1000)
  })

  it('owner idle lock is independent of session expiry and can be extended', () => {
    let owner = createOwnerSession('owner@pizzawave.demo', now)
    const idleCheckTime = new Date(now.getTime() + 31 * 60_000)
    expect(isOwnerIdleLocked(owner, idleCheckTime)).toBe(true)
    expect(isSessionExpired(owner, idleCheckTime)).toBe(false)
    owner = extendOwnerIdle(owner, idleCheckTime)
    expect(isOwnerIdleLocked(owner, idleCheckTime)).toBe(false)
  })
})
