import type { Product } from '../catalog/catalog.types'
import type { Order } from '../orders/order.types'
import type { KdsOrder, KdsQueueSection } from './kds.types'

const criticalPattern = /\b(NO |WITHOUT |EXTRA |ALLERGY|ALLERGIC)\b/i

export function getKdsQueueSection(order: Order, position: number): KdsQueueSection {
  if (order.fulfillmentStatus === 'READY') return 'READY'
  if (order.fulfillmentStatus === 'PREPARING') return 'PREPARING'
  if (order.fulfillmentStatus === 'PREP_DUE' || position === 1) return 'START_NOW'
  return 'START_SOON'
}

export function toKdsOrder(order: Order, products: Product[], queuePosition: number): KdsOrder {
  const recommendedStartAt = order.recommendedStartAt ?? order.prepStartAt ?? order.acceptedAt ?? order.createdAt
  const targetReadyAt = order.targetReadyAt ?? new Date(new Date(recommendedStartAt).getTime() + order.effectivePrepMinutes * 60_000).toISOString()
  const kitchenNotes = order.kitchenNotes ?? []
  const items = order.items.map((item, itemIndex) => {
    const product = products.find((candidate) => candidate.id === item.productId)
    const modifiers = (item.modifiers ?? []).flatMap((selection) => {
      const group = product?.modifierGroups?.find((candidate) => candidate.id === selection.groupId)
      return selection.optionIds.map((optionId) => {
        const option = group?.options.find((candidate) => candidate.id === optionId)
        const optionName = option?.name ?? optionId.replaceAll('-', ' ')
        return { groupId: selection.groupId, groupName: group?.name ?? selection.groupId, optionId, optionName, critical: criticalPattern.test(optionName) }
      })
    })
    const size = modifiers.find((modifier) => modifier.groupId === 'size')?.optionName
    const base = modifiers.find((modifier) => modifier.groupId === 'base')?.optionName
    const criticalInstructions = itemIndex === 0 ? kitchenNotes.filter((note) => criticalPattern.test(note)) : []
    const extraCheese = modifiers.find((modifier) => modifier.optionId === 'extra-cheese')
    if (extraCheese && !criticalInstructions.includes('EXTRA CHEESE')) criticalInstructions.push('EXTRA CHEESE')
    return { productId: item.productId, name: item.name, quantity: item.quantity, size, base, modifiers, criticalInstructions }
  })
  const remainingMinutes = order.fulfillmentStatus === 'READY'
    ? 0
    : order.fulfillmentStatus === 'PREPARING'
      ? Math.max(1, order.effectivePrepMinutes - 7)
      : order.effectivePrepMinutes
  return {
    id: order.id,
    publicOrderNumber: order.publicOrderNumber,
    fulfillmentType: order.fulfillmentType,
    fulfillmentStatus: order.fulfillmentStatus,
    queuePosition,
    queueSection: getKdsQueueSection(order, queuePosition),
    recommendedStartAt,
    targetReadyAt,
    remainingMinutes,
    systemPrepMinutes: order.systemPrepMinutes,
    effectivePrepMinutes: order.effectivePrepMinutes,
    overrideReason: order.overrideReason,
    kitchenNotes,
    items,
  }
}
