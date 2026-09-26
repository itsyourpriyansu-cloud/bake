import { describe, expect, it } from 'vitest'
import { cartConfigurationKey, normalizeCartSelections, normalizeSpecialInstructions } from './cart.identity'

describe('cart configuration identity', () => {
  it('normalizes modifier and note ordering deterministically', () => {
    const left = cartConfigurationKey('pizza', [
      { groupId: 'toppings', optionIds: ['corn', 'paneer'] },
      { groupId: 'size', optionIds: ['medium'] },
    ], '  Extra   crisp ')
    const right = cartConfigurationKey('pizza', [
      { groupId: 'size', optionIds: ['medium'] },
      { groupId: 'toppings', optionIds: ['paneer', 'corn'] },
    ], 'extra crisp')
    expect(left).toBe(right)
  })

  it('keeps distinct customizations as distinct lines', () => {
    expect(cartConfigurationKey('pizza', [{ groupId: 'size', optionIds: ['regular'] }]))
      .not.toBe(cartConfigurationKey('pizza', [{ groupId: 'size', optionIds: ['large'] }]))
  })

  it('removes duplicate options and normalizes whitespace', () => {
    expect(normalizeCartSelections([{ groupId: 'toppings', optionIds: ['corn', 'corn'] }])[0].optionIds).toEqual(['corn'])
    expect(normalizeSpecialInstructions('  no    onion  ')).toBe('no onion')
  })
})
