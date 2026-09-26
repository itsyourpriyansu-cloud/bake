import type { ModifierGroup, ModifierOption } from './catalog.types'

export interface ModifierSelection { groupId: string; optionIds: string[] }
export interface ModifierValidationIssue { groupId: string; message: string }

const selectedFor = (selections: ModifierSelection[], groupId: string) => selections.find((selection) => selection.groupId === groupId)?.optionIds ?? []

export function optionMatchesDependencies(option: ModifierOption, selections: ModifierSelection[]): boolean {
  return option.variantDependencies.every((dependency) => dependency.optionIds.some((id) => selectedFor(selections, dependency.groupId).includes(id)))
}

export function availableOptions(group: ModifierGroup, selections: ModifierSelection[]): ModifierOption[] {
  return group.options.filter((option) => option.available && optionMatchesDependencies(option, selections))
}

export function validateModifierSelections(groups: ModifierGroup[], selections: ModifierSelection[]): ModifierValidationIssue[] {
  const issues: ModifierValidationIssue[] = []
  const knownGroups = new Map(groups.map((group) => [group.id, group]))
  const groupCounts = new Map<string, number>()
  for (const selection of selections) {
    groupCounts.set(selection.groupId, (groupCounts.get(selection.groupId) ?? 0) + 1)
    const group = knownGroups.get(selection.groupId)
    if (!group) {
      issues.push({ groupId: selection.groupId, message: 'This customization is not available for this item.' })
      continue
    }
    if (new Set(selection.optionIds).size !== selection.optionIds.length) issues.push({ groupId: group.id, message: `Choose each ${group.name.toLowerCase()} option only once.` })
  }
  for (const [groupId, count] of groupCounts) if (count > 1) issues.push({ groupId, message: 'Each customization group can be selected only once.' })
  for (const group of groups) {
    const selected = selectedFor(selections, group.id)
    const availableIds = new Set(availableOptions(group, selections).map((option) => option.id))
    if (selected.some((id) => !availableIds.has(id))) issues.push({ groupId: group.id, message: `Review your ${group.name.toLowerCase()} selection.` })
    if (selected.length < group.minSelections) issues.push({ groupId: group.id, message: `Choose ${group.minSelections} ${group.name.toLowerCase()} option${group.minSelections === 1 ? '' : 's'}.` })
    if (group.maxSelections && selected.length > group.maxSelections) issues.push({ groupId: group.id, message: `Choose up to ${group.maxSelections} ${group.name.toLowerCase()} option${group.maxSelections === 1 ? '' : 's'}.` })
  }
  return issues
}

/** Validates the complete build so cross-step dependencies remain available, then returns only the active step's issue. */
export function modifierIssueForGroup(groups: ModifierGroup[], selections: ModifierSelection[], groupId: string): ModifierValidationIssue | undefined {
  return validateModifierSelections(groups, selections).find((issue) => issue.groupId === groupId)
}

export function configuredUnitPrice(basePrice: number, groups: ModifierGroup[], selections: ModifierSelection[]): number {
  return basePrice + groups.reduce((total, group) => {
    const selectedIds = new Set(selectedFor(selections, group.id))
    return total + group.options.filter((option) => selectedIds.has(option.id)).reduce((sum, option) => sum + option.priceDelta, 0)
  }, 0)
}

/** Used by compact fast-add only. The full builder deliberately begins with empty required choices. */
export function defaultModifierSelections(groups: ModifierGroup[]): ModifierSelection[] {
  const selections: ModifierSelection[] = []
  for (const group of groups) {
    if (!group.required || group.minSelections === 0) continue
    const options = availableOptions(group, selections).slice(0, group.minSelections)
    if (options.length) selections.push({ groupId: group.id, optionIds: options.map((option) => option.id) })
  }
  return selections
}
