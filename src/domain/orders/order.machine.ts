import type { AcceptanceStatus, FulfillmentStatus } from './order.types'

const acceptanceTransitions: Record<AcceptanceStatus, AcceptanceStatus[]> = {
  NOT_APPLICABLE: ['AWAITING_ACCEPTANCE'],
  AWAITING_ACCEPTANCE: ['ACCEPTED', 'REVIEW_REQUIRED', 'REJECTED'],
  REVIEW_REQUIRED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: [],
  REJECTED: [],
}

const fulfillmentTransitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  NOT_STARTED: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['PREP_DUE', 'CANCELLED'],
  PREP_DUE: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['DISPATCHED', 'PICKED_UP', 'STORE_COMPLETED'],
  DISPATCHED: ['DELIVERED'],
  PICKED_UP: [],
  DELIVERED: [],
  STORE_COMPLETED: [],
  CANCELLED: [],
}

export class InvalidOrderTransitionError extends Error {
  constructor(kind: string, from: string, to: string) { super(`Cannot move ${kind} from ${from} to ${to}`) }
}

export function canTransitionAcceptance(from: AcceptanceStatus, to: AcceptanceStatus): boolean {
  return acceptanceTransitions[from].includes(to)
}
export function assertAcceptanceTransition(from: AcceptanceStatus, to: AcceptanceStatus): void {
  if (!canTransitionAcceptance(from, to)) throw new InvalidOrderTransitionError('acceptanceStatus', from, to)
}

export function canTransitionFulfillment(from: FulfillmentStatus, to: FulfillmentStatus): boolean {
  return fulfillmentTransitions[from].includes(to)
}
export function assertFulfillmentTransition(from: FulfillmentStatus, to: FulfillmentStatus): void {
  if (!canTransitionFulfillment(from, to)) throw new InvalidOrderTransitionError('fulfillmentStatus', from, to)
}

/** KDS may only ever see orders that cleared both gates — never call this with a rejected or unaccepted order. */
export function isVisibleToKitchen(acceptanceStatus: AcceptanceStatus, paymentConfirmed: boolean): boolean {
  return paymentConfirmed && acceptanceStatus === 'ACCEPTED'
}
