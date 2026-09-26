import type { BakeryBespokeRequest, BakeryOrder } from './bakery.types'
import { projectBakeryOrder } from './production.projection'

export type FounderAttentionKind = 'PRODUCTION_RISK' | 'ORDER_ACCEPTANCE' | 'PRODUCTION_EXCEPTION' | 'CAPACITY_CONFLICT' | 'BESPOKE_REQUEST'

export interface FounderAttentionItem {
  id: string
  kind: FounderAttentionKind
  priority: number
  eyebrow: string
  title: string
  detail: string
  deadline: string
  actionLabel: string
  orderId?: string
  requestId?: string
}

function promiseLabel(value: string) {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(value))
}

export function buildFounderAttention(orders: BakeryOrder[], requests: BakeryBespokeRequest[], capacity: number, now = Date.now()) {
  const items: FounderAttentionItem[] = []

  orders.forEach((order) => {
    const projection = projectBakeryOrder(order, now)
    if (projection?.risk === 'CRITICAL' && projection.lane !== 'READY') {
      items.push({
        id: `risk:${order.id}`,
        kind: 'PRODUCTION_RISK',
        priority: 100,
        eyebrow: 'PROMISE AT RISK',
        title: `${order.publicNumber} needs intervention`,
        detail: `${projection.riskReason}. ${order.items[0]?.product?.name ?? 'Bakery order'} is due ${promiseLabel(order.promisedAt)}.`,
        deadline: projection.minutesToPromise <= 0 ? 'Overdue now' : `Decision needed in ${projection.minutesToPromise} min`,
        actionLabel: 'OPEN ORDER',
        orderId: order.id,
      })
      return
    }
    if (order.productionStatus === 'AWAITING_ACCEPTANCE') {
      const minutes = Math.max(0, Math.ceil((new Date(order.promisedAt).getTime() - now) / 60_000))
      items.push({
        id: `accept:${order.id}`,
        kind: 'ORDER_ACCEPTANCE',
        priority: 90,
        eyebrow: 'PAID ORDER',
        title: `${order.publicNumber} is waiting for acceptance`,
        detail: `${order.items[0]?.product?.name ?? 'Bakery order'} · ${order.fulfillment.toLowerCase()} · ₹${order.quote.total.toLocaleString('en-IN')}.`,
        deadline: minutes < 60 ? `${minutes} min to promise` : `${Math.floor(minutes / 60)}h to promise`,
        actionLabel: 'REVIEW CAPACITY',
        orderId: order.id,
      })
      return
    }
    if (order.note && !['REJECTED', 'COMPLETED'].includes(order.productionStatus)) {
      items.push({
        id: `exception:${order.id}`,
        kind: 'PRODUCTION_EXCEPTION',
        priority: 80,
        eyebrow: 'KITCHEN EXCEPTION',
        title: `${order.publicNumber} was flagged by production`,
        detail: order.note,
        deadline: `Promise ${promiseLabel(order.promisedAt)}`,
        actionLabel: 'RESOLVE EXCEPTION',
        orderId: order.id,
      })
    }
  })

  const scheduledBySlot = new Map<string, BakeryOrder[]>()
  orders.filter((order) => !['REJECTED', 'COMPLETED'].includes(order.productionStatus)).forEach((order) => {
    const key = `${order.eventDate}:${order.slot}`
    scheduledBySlot.set(key, [...(scheduledBySlot.get(key) ?? []), order])
  })
  scheduledBySlot.forEach((slotOrders, key) => {
    const conflictThreshold = Math.max(2, Math.ceil(capacity * .75))
    if (slotOrders.length < conflictThreshold) return
    const [date, time] = key.split(':')
    items.push({
      id: `capacity:${key}`,
      kind: 'CAPACITY_CONFLICT',
      priority: 70,
      eyebrow: 'CAPACITY CHECK',
      title: `${slotOrders.length} promises share ${time}`,
      detail: `${date} has overlapping promise work. Review the production sequence before accepting more complex cakes.`,
      deadline: 'Before the next acceptance',
      actionLabel: 'OPEN CALENDAR',
    })
  })

  requests.filter((request) => request.status === 'NEW').forEach((request) => {
    const ageHours = Math.max(0, Math.floor((now - new Date(request.createdAt).getTime()) / 3_600_000))
    const referencePending = Boolean(request.referenceImage) && request.referenceApprovalStatus === 'PENDING_REVIEW'
    items.push({
      id: `bespoke:${request.id}`,
      kind: 'BESPOKE_REQUEST',
      priority: 50 + Math.min(ageHours, 20),
      eyebrow: referencePending ? 'REFERENCE APPROVAL' : 'BESPOKE REQUEST',
      title: referencePending ? 'Customer image needs replication review' : `${request.event.replaceAll('_', ' ').toLowerCase()} request needs review`,
      detail: `${request.servings} guests · ${request.budget} · event ${request.eventDate}${referencePending ? ` · ${request.referenceImage?.name}` : ''}.`,
      deadline: ageHours < 1 ? 'New request' : `Waiting ${ageHours}h`,
      actionLabel: referencePending ? 'REVIEW IMAGE' : 'REVIEW REQUEST',
      requestId: request.id,
    })
  })

  return items.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
}
