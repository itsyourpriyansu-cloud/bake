import type { BakeryBespokeRequest, BakeryOrder, BakerySavedDesign } from '../../../domain/bakery/bakery.types'
import { weekdayLabel } from '../components/dateLabels'

const DAY = 24 * 60 * 60 * 1000
const activeProductionStatuses = ['MIXING', 'BAKING', 'COOLING', 'DECORATING', 'PACKING']

export const todayISODate = () => new Date().toISOString().slice(0, 10)

export { weekdayLabel as ownerWeekdayLabel }

/** Share of non-awaiting, non-rejected orders that are finished or still ahead of their promised time. */
export function productionHealthPercent(orders: BakeryOrder[]) {
  const tracked = orders.filter((order) => order.productionStatus !== 'AWAITING_ACCEPTANCE' && order.productionStatus !== 'REJECTED')
  if (!tracked.length) return 100
  const onTrack = tracked.filter((order) => order.productionStatus === 'COMPLETED' || order.productionStatus === 'READY' || new Date(order.promisedAt).getTime() > Date.now())
  return Math.round((onTrack.length / tracked.length) * 100)
}

export function productionLoad(orders: BakeryOrder[], capacity: number) {
  const inProgress = orders.filter((order) => activeProductionStatuses.includes(order.productionStatus)).length
  const percent = capacity > 0 ? Math.min(100, Math.round((inProgress / capacity) * 100)) : 0
  const label = percent >= 100 ? 'FULL' : percent >= 70 ? 'BUSY' : 'HEALTHY'
  return { inProgress, percent, label }
}

export interface OwnerCalendarDay { date: string; weekday: string; dayNumber: string; count: number; isToday: boolean }

export function buildCalendarStrip(orders: BakeryOrder[], days = 7): OwnerCalendarDay[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.now() + index * DAY)
    const isoDate = date.toISOString().slice(0, 10)
    return {
      date: isoDate,
      weekday: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date).toUpperCase(),
      dayNumber: String(date.getDate()),
      count: orders.filter((order) => order.eventDate === isoDate).length,
      isToday: index === 0,
    }
  })
}

/** Only surfaces a note when a real slot clash exists — no fabricated warning otherwise. */
export function calendarAttentionNote(days: OwnerCalendarDay[], orders: BakeryOrder[]) {
  for (const day of days) {
    const slotCounts = new Map<string, number>()
    orders.filter((order) => order.eventDate === day.date).forEach((order) => slotCounts.set(order.slot, (slotCounts.get(order.slot) ?? 0) + 1))
    const clash = [...slotCounts.entries()].find(([, count]) => count >= 2)
    if (clash) return `${day.weekday} ${day.dayNumber} needs attention — ${clash[1]} orders share the ${clash[0]} promise window. Review before accepting another complex order that day.`
  }
  return null
}

export interface OwnerCustomer { phone: string; name: string; orderCount: number; confirmedOrderCount: number; lifetimeValue: number; nextCelebration?: string; favourite?: string }

export function aggregateOwnerCustomers(orders: BakeryOrder[]): OwnerCustomer[] {
  const today = todayISODate()
  const byPhone = new Map<string, OwnerCustomer>()
  const tastes = new Map<string, Map<string, number>>()
  for (const order of orders) {
    const record = byPhone.get(order.customerPhone) ?? { phone: order.customerPhone, name: order.customerName, orderCount: 0, confirmedOrderCount: 0, lifetimeValue: 0 }
    record.orderCount += 1
    if (order.paymentStatus === 'CONFIRMED') {
      record.confirmedOrderCount += 1
      record.lifetimeValue += order.quote.total
      if (order.eventDate >= today && (!record.nextCelebration || order.eventDate < record.nextCelebration)) record.nextCelebration = order.eventDate
    }
    byPhone.set(order.customerPhone, record)
    const tasteMap = tastes.get(order.customerPhone) ?? new Map<string, number>()
    order.items.forEach((item) => { const key = item.product?.style ?? item.product?.category; if (key) tasteMap.set(key, (tasteMap.get(key) ?? 0) + item.quantity) })
    tastes.set(order.customerPhone, tasteMap)
  }
  for (const [phone, record] of byPhone) {
    const tasteMap = tastes.get(phone)
    if (tasteMap?.size) record.favourite = [...tasteMap.entries()].sort((a, b) => b[1] - a[1])[0][0].replaceAll('_', ' ').toLowerCase()
  }
  return [...byPhone.values()].sort((a, b) => b.lifetimeValue - a.lifetimeValue)
}

export interface OwnerGrowthSegments { upcomingCelebrations: number; secondCakePending: number; savedDesignNoOrder: number }

export function computeGrowthSegments(orders: BakeryOrder[], requests: BakeryBespokeRequest[], savedDesigns: BakerySavedDesign[]): OwnerGrowthSegments {
  const customers = aggregateOwnerCustomers(orders)
  const confirmedPhones = new Set(orders.filter((order) => order.paymentStatus === 'CONFIRMED').map((order) => order.customerPhone))
  const today = todayISODate()
  const in7Days = new Date(Date.now() + 7 * DAY).toISOString().slice(0, 10)
  const upcomingFromOrders = customers.filter((customer) => customer.nextCelebration && customer.nextCelebration >= today && customer.nextCelebration <= in7Days).length
  const upcomingFromBespoke = new Set(requests.filter((request) => request.eventDate >= today && request.eventDate <= in7Days && request.customerPhone).map((request) => request.customerPhone)).size
  const secondCakePending = customers.filter((customer) => customer.confirmedOrderCount === 1).length
  const savedDesignPhones = new Set(savedDesigns.map((design) => design.customerPhone))
  const savedDesignNoOrder = [...savedDesignPhones].filter((phone) => !confirmedPhones.has(phone)).length
  return { upcomingCelebrations: upcomingFromOrders + upcomingFromBespoke, secondCakePending, savedDesignNoOrder }
}
