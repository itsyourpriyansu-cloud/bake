import type { CartItemModifierSelection } from '../cart/cart.types'
import type { ModifierGroup, ModifierOption } from './catalog.types'
import { availableOptions, configuredUnitPrice, validateModifierSelections } from './modifier.engine'

export interface PizzaPreset {
  id: 'CLASSIC' | 'CHEESY' | 'LOADED'
  name: string
  description: string
  selections: CartItemModifierSelection[]
  optionSummary: string
  unitPrice: number
}

type PresetDefinition = Omit<PizzaPreset, 'selections' | 'optionSummary' | 'unitPrice'> & {
  preferred: Record<string, string[]>
  multiple?: Record<string, number>
}

const definitions: PresetDefinition[] = [
  {
    id: 'CLASSIC', name: 'Classic Wave', description: 'The familiar, easy favourite.',
    preferred: { size: ['regular', 'classic kulhad'], base: ['normal', 'classic veg'], sauce: ['classic tomato'], cheese: ['regular'], spice: ['mild'] },
  },
  {
    id: 'CHEESY', name: 'Cheese Hit', description: 'Medium, makhani and extra cheesy.',
    preferred: { size: ['medium', 'sharing duo'], base: ['normal', 'makhani paneer'], sauce: ['smoky makhani'], cheese: ['double mozzarella', 'extra'], toppings: ['corn'], spice: ['medium'] },
    multiple: { toppings: 1 },
  },
  {
    id: 'LOADED', name: 'Fully Loaded', description: 'Big size, three toppings and fries.',
    preferred: { size: ['large', 'sharing duo'], base: ['multigrain', 'cheesy corn'], sauce: ['fiery peri peri'], cheese: ['extra'], spice: ['spicy'], meal: ['peri peri fries'] },
    multiple: { toppings: 3, meal: 1 },
  },
]

const normalize = (value: string) => value.toLowerCase().replaceAll('-', ' ')
const preferredOption = (options: ModifierOption[], terms: string[]) => terms
  .map((term) => options.find((option) => normalize(option.name).includes(normalize(term)) || normalize(option.id).includes(normalize(term))))
  .find((option): option is ModifierOption => Boolean(option))

function selectionsFor(groups: ModifierGroup[], definition: PresetDefinition): CartItemModifierSelection[] {
  const selections: CartItemModifierSelection[] = []
  for (const group of groups) {
    const options = availableOptions(group, selections)
    const desiredCount = group.multiple ? definition.multiple?.[group.id] ?? 0 : group.required ? 1 : 0
    if (desiredCount === 0) continue
    const preferred = preferredOption(options, definition.preferred[group.id] ?? [])
    const optionIds = group.multiple
      ? [...(preferred ? [preferred] : []), ...options.filter((option) => option.id !== preferred?.id)].slice(0, Math.min(desiredCount, group.maxSelections ?? desiredCount)).map((option) => option.id)
      : [preferred ?? options[0]].filter((option): option is ModifierOption => Boolean(option)).map((option) => option.id)
    if (optionIds.length) selections.push({ groupId: group.id, optionIds })
  }
  return selections
}

/** Ready-to-order recipes generated from the same live modifier data as the full builder. */
export function createPizzaPresets(basePrice: number, groups: ModifierGroup[]): PizzaPreset[] {
  return definitions.flatMap((definition) => {
    const selections = selectionsFor(groups, definition)
    if (validateModifierSelections(groups, selections).length) return []
    const names = selections.flatMap((selection) => {
      const group = groups.find((candidate) => candidate.id === selection.groupId)
      return selection.optionIds.map((id) => group?.options.find((option) => option.id === id)?.name).filter((name): name is string => Boolean(name))
    })
    return [{
      id: definition.id, name: definition.name, description: definition.description, selections,
      optionSummary: names.slice(0, 4).join(' · '), unitPrice: configuredUnitPrice(basePrice, groups, selections),
    }]
  })
}
