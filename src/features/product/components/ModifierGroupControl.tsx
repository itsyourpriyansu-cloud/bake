import { Check, LockKeyhole } from 'lucide-react'
import { availableOptions } from '../../../domain/catalog/modifier.engine'
import type { ModifierGroup } from '../../../domain/catalog/catalog.types'
import type { CartItemModifierSelection } from '../../../domain/cart/cart.types'

export function ModifierGroupControl({ group, selections, onChange, error }: {
  group: ModifierGroup
  selections: CartItemModifierSelection[]
  onChange: (optionId: string) => void
  error?: string
}) {
  const selected = selections.find((selection) => selection.groupId === group.id)?.optionIds ?? []
  const options = availableOptions(group, selections)
  const limitReached = Boolean(group.maxSelections && selected.length >= group.maxSelections)
  return <fieldset className={`modifier-group ${error ? 'has-error' : ''}`}>
    <legend><span>{group.name}</span><small>{group.required ? 'REQUIRED' : 'OPTIONAL'} · {group.multiple ? `UP TO ${group.maxSelections}` : 'CHOOSE 1'}</small></legend>
    <div className="modifier-options">{group.options.map((option) => {
      const checked = selected.includes(option.id)
      const dependencyMet = options.some((candidate) => candidate.id === option.id)
      const unavailable = !option.available || !dependencyMet
      const disabled = (unavailable && !checked) || (group.multiple && limitReached && !checked)
      return <button key={option.id} type="button" role={group.multiple ? 'checkbox' : 'radio'} aria-checked={checked} disabled={disabled} className={checked ? 'selected' : ''} onClick={() => onChange(option.id)}>
        <span>{checked ? <Check size={18} /> : disabled ? <LockKeyhole size={16} /> : <i />}</span>
        <strong>{option.name}</strong>
        <small>{!option.available ? 'Unavailable' : !dependencyMet ? 'Choose another size' : option.priceDelta ? `+₹${option.priceDelta}` : 'Included'}</small>
      </button>
    })}</div>
    {error && <p className="modifier-error" role="alert">{error}</p>}
  </fieldset>
}
