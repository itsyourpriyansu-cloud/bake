import { createId } from '../shared/ids'
import type { Refund, RefundReason, RefundStatus } from './refund.types'

const transitions: Record<RefundStatus, RefundStatus[]> = {
  REQUESTED: ['APPROVED', 'REVIEW_REQUIRED'],
  APPROVED: ['SUBMITTED'],
  SUBMITTED: ['PROCESSING'],
  PROCESSING: ['SUCCESS', 'FAILED'],
  SUCCESS: [],
  FAILED: ['REVIEW_REQUIRED', 'SUBMITTED'],
  REVIEW_REQUIRED: ['APPROVED', 'FAILED'],
}

export function canTransitionRefund(from: RefundStatus, to: RefundStatus): boolean {
  return transitions[from].includes(to)
}
export class InvalidRefundTransitionError extends Error {
  constructor(from: RefundStatus, to: RefundStatus) { super(`Cannot move refund from ${from} to ${to}`) }
}

export function createRefund(orderId: string, customerId: string, amount: number, pointsToReverse: number, reason: RefundReason, now: Date): Refund {
  return { id: createId('REFUND'), orderId, customerId, amount, pointsToReverse, reason, status: 'REQUESTED', createdAt: now.toISOString() }
}

function move(refund: Refund, to: RefundStatus, patch: Partial<Refund> = {}): Refund {
  if (!canTransitionRefund(refund.status, to)) throw new InvalidRefundTransitionError(refund.status, to)
  return { ...refund, status: to, ...patch }
}

export const approveRefund = (refund: Refund) => move(refund, 'APPROVED')
export const submitRefund = (refund: Refund) => move(refund, 'SUBMITTED')
export const processRefund = (refund: Refund) => move(refund, 'PROCESSING')
export const completeRefund = (refund: Refund, now: Date) => move(refund, 'SUCCESS', { resolvedAt: now.toISOString() })
export const failRefund = (refund: Refund, reason: string) => move(refund, 'FAILED', { failureReason: reason })
