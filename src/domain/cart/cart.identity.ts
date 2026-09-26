import type { CartItemModifierSelection } from './cart.types'

export const normalizeSpecialInstructions = (value?: string) => (value ?? '').trim().replace(/\s+/g, ' ')

export function normalizeCartSelections(selections: CartItemModifierSelection[]): CartItemModifierSelection[] {
  return selections
    .filter((selection) => selection.optionIds.length > 0)
    .map((selection) => ({ groupId: selection.groupId, optionIds: [...new Set(selection.optionIds)].sort() }))
    .sort((left, right) => left.groupId.localeCompare(right.groupId))
}

/** Stable identity for merging only genuinely identical configured lines. */
export function cartConfigurationKey(productId: string, selections: CartItemModifierSelection[], specialInstructions?: string): string {
  return JSON.stringify({
    productId,
    modifiers: normalizeCartSelections(selections),
    specialInstructions: normalizeSpecialInstructions(specialInstructions).toLocaleLowerCase('en-IN'),
  })
}
