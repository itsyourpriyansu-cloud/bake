import { describe, expect, it } from 'vitest'
import { endpoints, paymentConfirm, paymentFail, paymentPending, paymentStatus } from './endpoints'

describe('Stage 4 API contract paths', () => {
  it('uses the frozen production-shaped customer auth endpoints', () => {
    expect(endpoints.authCustomerOtpRequest).toBe('/auth/customer/request-otp')
    expect(endpoints.authCustomerOtpVerify).toBe('/auth/customer/verify-otp')
  })

  it('keeps checkout intent creation separate from PhonePe initiation', () => {
    expect(endpoints.checkoutSession).toBe('/checkout/session')
    expect(endpoints.checkoutIntent).toBe('/checkout/order-intent')
    expect(endpoints.paymentInitiate).toBe('/payments/phonepe/initiate')
  })

  it('keeps status authoritative and demo outcomes explicit', () => {
    expect(paymentStatus('PAY1')).toBe('/payments/PAY1')
    expect(paymentConfirm('PAY1')).toBe('/demo/payments/PAY1/succeed')
    expect(paymentFail('PAY1')).toBe('/demo/payments/PAY1/fail')
    expect(paymentPending('PAY1')).toBe('/demo/payments/PAY1/pending')
  })
})
