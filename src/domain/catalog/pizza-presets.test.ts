import { describe, expect, it } from 'vitest'
import { validateModifierSelections } from './modifier.engine'
import { createPizzaPresets } from './pizza-presets'
import { productSeed } from '../../prototype/seed/catalog.seed'

describe('ready-to-order pizza presets', () => {
  it('builds three valid typed recipes for every customizable pizza product', () => {
    const pizzas = productSeed.filter((product) => product.badges.includes('Customizable'))
    for (const pizza of pizzas) {
      const groups = pizza.modifierGroups ?? []
      const presets = createPizzaPresets(pizza.basePrice, groups)
      expect(presets.map((preset) => preset.id)).toEqual(['CLASSIC', 'CHEESY', 'LOADED'])
      for (const preset of presets) {
        expect(validateModifierSelections(groups, preset.selections)).toEqual([])
        expect(preset.unitPrice).toBeGreaterThanOrEqual(pizza.basePrice)
      }
    }
  })
})
