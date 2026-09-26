import { describe, expect, it } from 'vitest'
import { confirmPayment, failPayment, InvalidPaymentTransitionError, reconcilePayment } from './payment.machine'
import type { PaymentAttempt } from './payment.types'

const attempt: PaymentAttempt = { id: 'PAY1', orderIntentId: 'INTENT1', provider: 'PHONEPE', merchantOrderId: 'MO1', amount: 110, status: 'PENDING', createdAt: '2026-09-08T00:00:00.000Z' }

describe('payment.machine', () => {
  it('confirms a pending attempt', () => {
    const { attempt: confirmed, alreadyConfirmed } = confirmPayment(attempt, 'TXN1', new Date('2026-09-08T00:01:00.000Z'))
    expect(confirmed.status).toBe('CONFIRMED')
    expect(confirmed.providerTransactionId).toBe('TXN1')
    expect(alreadyConfirmed).toBe(false)
  })

  it('is idempotent: confirming an already-confirmed attempt is a no-op, not an error', () => {
    const confirmedOnce = confirmPayment(attempt, 'TXN1', new Date('2026-09-08T00:01:00.000Z')).attempt
    const { attempt: confirmedAgain, alreadyConfirmed } = confirmPayment(confirmedOnce, 'TXN2', new Date('2026-09-08T00:02:00.000Z'))
    expect(alreadyConfirmed).toBe(true)
    expect(confirmedAgain).toEqual(confirmedOnce)
    expect(confirmedAgain.providerTransactionId).toBe('TXN1')
  })

  it('cannot confirm a payment that already failed', () => {
    const failed = failPayment(attempt, 'card declined')
    expect(() => confirmPayment(failed, 'TXN1', new Date())).toThrow(InvalidPaymentTransitionError)
  })

  it('moves a pending payment into reconciliation without treating it as success', () => {
    const reconciling = reconcilePayment(attempt)
    expect(reconciling.status).toBe('RECONCILING')
    expect(reconciling.providerTransactionId).toBeUndefined()
    expect(reconcilePayment(reconciling)).toEqual(reconciling)
  })

  it('allows backend confirmation after reconciliation', () => {
    const reconciling = reconcilePayment(attempt)
    const { attempt: confirmed } = confirmPayment(reconciling, 'TXN2', new Date('2026-09-08T00:02:00.000Z'))
    expect(confirmed.status).toBe('CONFIRMED')
    expect(confirmed.providerTransactionId).toBe('TXN2')
  })
})
