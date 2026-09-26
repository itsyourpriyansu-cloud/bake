import { describe, expect, it } from 'vitest'
import { approveRefund, canTransitionRefund, completeRefund, createRefund, failRefund, InvalidRefundTransitionError, processRefund, submitRefund } from './refund.machine'

describe('refund.machine', () => {
  it('walks the happy path REQUESTED -> APPROVED -> SUBMITTED -> PROCESSING -> SUCCESS', () => {
    let refund = createRefund('ORDER1', 'CUST001', 110, 4, 'ORDER_REJECTED', new Date('2026-09-08T00:00:00.000Z'))
    refund = approveRefund(refund)
    refund = submitRefund(refund)
    refund = processRefund(refund)
    refund = completeRefund(refund, new Date('2026-09-08T00:05:00.000Z'))
    expect(refund.status).toBe('SUCCESS')
    expect(refund.resolvedAt).toBe('2026-09-08T00:05:00.000Z')
  })

  it('rejects a skipped-state transition', () => {
    const refund = createRefund('ORDER1', 'CUST001', 110, 4, 'ORDER_REJECTED', new Date())
    expect(() => completeRefund(refund, new Date())).toThrow(InvalidRefundTransitionError)
    expect(canTransitionRefund('REQUESTED', 'SUCCESS')).toBe(false)
  })

  it('a failed refund can be retried via REVIEW_REQUIRED back to APPROVED', () => {
    let refund = createRefund('ORDER1', 'CUST001', 110, 4, 'ORDER_REJECTED', new Date())
    refund = approveRefund(refund); refund = submitRefund(refund); refund = processRefund(refund)
    refund = failRefund(refund, 'Provider timeout')
    expect(refund.status).toBe('FAILED')
    expect(canTransitionRefund('FAILED', 'REVIEW_REQUIRED')).toBe(true)
  })
})
