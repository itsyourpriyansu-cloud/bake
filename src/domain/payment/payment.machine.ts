import type { PaymentAttempt, PaymentStatus } from './payment.types'

const transitions: Record<PaymentStatus, PaymentStatus[]> = {
  NOT_STARTED: ['PENDING'],
  PENDING: ['CONFIRMED', 'FAILED', 'RECONCILING'],
  RECONCILING: ['CONFIRMED', 'FAILED'],
  CONFIRMED: [],
  FAILED: ['PENDING'],
}

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return transitions[from].includes(to)
}

export class InvalidPaymentTransitionError extends Error {
  constructor(from: PaymentStatus, to: PaymentStatus) { super(`Cannot move payment from ${from} to ${to}`) }
}

/**
 * Idempotent confirmation: confirming an already-CONFIRMED attempt is a no-op that returns
 * the same attempt unchanged rather than throwing or re-emitting PAYMENT_CONFIRMED.
 */
export function confirmPayment(attempt: PaymentAttempt, providerTransactionId: string, now: Date): { attempt: PaymentAttempt; alreadyConfirmed: boolean } {
  if (attempt.status === 'CONFIRMED') return { attempt, alreadyConfirmed: true }
  if (!canTransitionPayment(attempt.status, 'CONFIRMED')) throw new InvalidPaymentTransitionError(attempt.status, 'CONFIRMED')
  return { attempt: { ...attempt, status: 'CONFIRMED', providerTransactionId, confirmedAt: now.toISOString() }, alreadyConfirmed: false }
}

export function failPayment(attempt: PaymentAttempt, reason: string): PaymentAttempt {
  if (!canTransitionPayment(attempt.status, 'FAILED')) throw new InvalidPaymentTransitionError(attempt.status, 'FAILED')
  return { ...attempt, status: 'FAILED', failureReason: reason }
}

export function reconcilePayment(attempt: PaymentAttempt): PaymentAttempt {
  if (attempt.status === 'RECONCILING') return attempt
  if (!canTransitionPayment(attempt.status, 'RECONCILING')) throw new InvalidPaymentTransitionError(attempt.status, 'RECONCILING')
  return { ...attempt, status: 'RECONCILING' }
}
