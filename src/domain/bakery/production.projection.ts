import type { BakeryCartItem, BakeryOrder, BakeryProductionStatus } from './bakery.types'

export type BakeryQueueLane = 'START_NOW' | 'START_SOON' | 'IN_PROGRESS' | 'READY'
export type BakeryRiskLevel = 'CRITICAL' | 'DUE_SOON' | 'ON_TRACK' | 'READY'

export interface BakeryOrderProjection {
  order: BakeryOrder
  lane: BakeryQueueLane
  risk: BakeryRiskLevel
  riskReason: string
  estimatedPrepMinutes: number
  remainingMinutes: number
  minutesToPromise: number
  recommendedStartAt: string
  criticalTags: string[]
}

const activeStatuses: BakeryProductionStatus[] = ['MIXING', 'BAKING', 'COOLING', 'DECORATING', 'PACKING']

const remainingByStage: Partial<Record<BakeryProductionStatus, number>> = {
  MIXING: .88,
  BAKING: .68,
  COOLING: .48,
  DECORATING: .32,
  PACKING: .12,
}

function itemPrepMinutes(item: BakeryCartItem) {
  const category = item.product?.category
  const base = category === 'CAKES' ? 150 : category === 'BENTO' ? 100 : category === 'GIFTING' ? 55 : category === 'BREADS' ? 75 : category === 'PASTRIES' ? 65 : 45
  const options = new Set(item.selections.flatMap((selection) => selection.optionIds))
  const complexity = (options.has('two-kg') ? 45 : options.has('one-kg') ? 20 : 0)
    + (options.has('fondant') ? 50 : 0)
    + (options.has('photo') ? 25 : 0)
    + (options.has('floral') || options.has('vintage') ? 20 : 0)
    + (options.has('number') ? 20 : 0)
  return (base + complexity) * Math.max(1, item.quantity)
}

export function estimateOrderPrepMinutes(order: BakeryOrder) {
  return Math.max(30, order.items.reduce((longest, item) => Math.max(longest, itemPrepMinutes(item)), 0))
}

export function orderCriticalTags(order: BakeryOrder) {
  const priority = ['eggless', 'two-kg', 'one-kg', 'fondant', 'photo', 'heart', 'number', 'floral', 'vintage']
  const selected = new Set(order.items.flatMap((item) => item.selections.flatMap((selection) => selection.optionIds)))
  const tags = priority.filter((tag) => selected.has(tag)).map((tag) => tag.replaceAll('-', ' ').toUpperCase())
  if (order.items.some((item) => item.message)) tags.push('MESSAGE')
  return tags.slice(0, 5)
}

export function projectBakeryOrder(order: BakeryOrder, now = Date.now()): BakeryOrderProjection | null {
  if (['REJECTED', 'COMPLETED'].includes(order.productionStatus)) return null
  const estimatedPrepMinutes = estimateOrderPrepMinutes(order)
  const promisedAt = new Date(order.promisedAt).getTime()
  const minutesToPromise = Math.ceil((promisedAt - now) / 60_000)
  const recommendedStartAtMs = promisedAt - estimatedPrepMinutes * 60_000
  const remainingFactor = remainingByStage[order.productionStatus] ?? (order.productionStatus === 'READY' ? 0 : 1)
  const remainingMinutes = Math.ceil(estimatedPrepMinutes * remainingFactor)

  let lane: BakeryQueueLane
  if (order.productionStatus === 'READY') lane = 'READY'
  else if (activeStatuses.includes(order.productionStatus)) lane = 'IN_PROGRESS'
  else lane = recommendedStartAtMs <= now ? 'START_NOW' : 'START_SOON'

  let risk: BakeryRiskLevel = 'ON_TRACK'
  let riskReason = 'On track for the customer promise'
  if (lane === 'READY') {
    risk = 'READY'
    riskReason = minutesToPromise < 0 ? 'Customer promise has passed—handoff now' : 'Packed and waiting for handoff'
  } else if (minutesToPromise <= 0 || minutesToPromise <= remainingMinutes) {
    risk = 'CRITICAL'
    riskReason = minutesToPromise <= 0 ? 'Customer promise is overdue' : 'Remaining work exceeds the promise window'
  } else if (minutesToPromise <= Math.max(90, Math.ceil(remainingMinutes * 1.4))) {
    risk = 'DUE_SOON'
    riskReason = 'Promise window is tightening'
  }

  return {
    order,
    lane,
    risk,
    riskReason,
    estimatedPrepMinutes,
    remainingMinutes,
    minutesToPromise,
    recommendedStartAt: new Date(recommendedStartAtMs).toISOString(),
    criticalTags: orderCriticalTags(order),
  }
}

const riskWeight: Record<BakeryRiskLevel, number> = { CRITICAL: 0, DUE_SOON: 1, ON_TRACK: 2, READY: 3 }

export function buildBakeryProductionQueue(orders: BakeryOrder[], now = Date.now()) {
  return orders
    .filter((order) => order.productionStatus !== 'AWAITING_ACCEPTANCE')
    .map((order) => projectBakeryOrder(order, now))
    .filter((value): value is BakeryOrderProjection => Boolean(value))
    .sort((a, b) => {
      const laneOrder: Record<BakeryQueueLane, number> = { START_NOW: 0, START_SOON: 1, IN_PROGRESS: 2, READY: 3 }
      return laneOrder[a.lane] - laneOrder[b.lane]
        || riskWeight[a.risk] - riskWeight[b.risk]
        || new Date(a.order.promisedAt).getTime() - new Date(b.order.promisedAt).getTime()
    })
}

export function formatPromiseDistance(minutes: number) {
  if (minutes < 0) return `${Math.abs(minutes)}m late`
  if (minutes < 60) return `${minutes}m left`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m left` : `${hours}h left`
}
