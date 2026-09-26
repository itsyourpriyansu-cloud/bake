export type SessionRealm = 'CUSTOMER' | 'OWNER' | 'KDS' | 'TEAM'

export interface CustomerSession { realm: 'CUSTOMER'; customerId: string; issuedAt: string; expiresAt: string }
export interface OwnerSession { realm: 'OWNER'; email: string; issuedAt: string; expiresAt: string; idleLockAt: string }
export interface KdsSession { realm: 'KDS'; device: string; issuedAt: string; expiresAt: string }
export type AnySession = CustomerSession | OwnerSession | KdsSession

export const DEMO_CREDENTIALS = {
  customer: { phone: '9876543210', otp: '123456' },
  owner: { email: 'owner@pizzawave.demo', password: 'PizzaWave@123', twoFactorCode: '654321' },
  kds: { pin: '2580' },
} as const
