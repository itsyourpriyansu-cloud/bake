import { Check, Leaf, Salad, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FoodPreferences } from '../../../domain/customer/customer-experience.types'
import { useCustomerExperienceActions, useFoodPreferences } from '../../../features/customer/hooks/useCustomerExperience'
import { Chip, ErrorState, PrimaryButton, Skeleton } from '../../../shared/components'
import { CustomerPageHeader } from '../components/Stage5Ui'

const options = { diet: ['VEG', 'NON_VEG', 'BOTH'], spiceLevel: ['MILD', 'MEDIUM', 'SPICY'], cheese: ['LIGHT', 'REGULAR', 'EXTRA'] } as const
const avoids = ['Mushroom', 'Onion', 'Jalapeño', 'Olives']
const categories = ['Pizza', 'Kulhad', 'Burger', 'Wrap', 'Sides', 'Shakes', 'Dessert']

export default function PreferencesPage() {
  const query = useFoodPreferences(); const actions = useCustomerExperienceActions(); const [draft, setDraft] = useState<FoodPreferences>()
  useEffect(() => { if (query.data) setDraft(query.data) }, [query.data])
  if (query.isError) return <div className="stage5-page"><ErrorState retry={() => void query.refetch()} /></div>
  if (!draft) return <div className="stage5-page"><Skeleton className="preferences-skeleton" /></div>
  const toggle = (key: 'avoid' | 'favouriteCategories', value: string) => setDraft({ ...draft, [key]: draft[key].includes(value) ? draft[key].filter((item) => item !== value) : [...draft[key], value] })
  return <div className="stage5-page preferences-page"><CustomerPageHeader eyebrow="MADE FOR YOU" title="Food Preferences" back="/app/profile" />
    <p className="stage5-lede">These choices shape recommendations and saved family profiles. You can always order anything from the menu.</p>
    <section className="preference-card"><div><i><Leaf /></i><span><small>DIET</small><h2>What do you eat?</h2></span></div><div className="choice-grid">{options.diet.map((value) => <button className={draft.diet === value ? 'active' : ''} onClick={() => setDraft({ ...draft, diet: value })} key={value}>{value.replace('_', ' ')}{draft.diet === value && <Check />}</button>)}</div></section>
    <section className="preference-card"><div><i><Sparkles /></i><span><small>YOUR TASTE</small><h2>Spice & cheese</h2></span></div><label>SPICE LEVEL<div className="choice-grid three">{options.spiceLevel.map((value) => <button className={draft.spiceLevel === value ? 'active' : ''} onClick={() => setDraft({ ...draft, spiceLevel: value })} key={value}>{value}</button>)}</div></label><label>CHEESE<div className="choice-grid three">{options.cheese.map((value) => <button className={draft.cheese === value ? 'active' : ''} onClick={() => setDraft({ ...draft, cheese: value })} key={value}>{value}</button>)}</div></label></section>
    <section className="preference-card"><div><i><Salad /></i><span><small>HELPFUL, NOT RESTRICTIVE</small><h2>Ingredients to avoid</h2></span></div><div className="chip-wrap">{avoids.map((value) => <Chip active={draft.avoid.includes(value)} onClick={() => toggle('avoid', value)} key={value}>{value}</Chip>)}</div></section>
    <section className="preference-card"><div><i><Sparkles /></i><span><small>FAVOURITE CATEGORIES</small><h2>Show me more</h2></span></div><div className="chip-wrap">{categories.map((value) => <Chip active={draft.favouriteCategories.includes(value)} onClick={() => toggle('favouriteCategories', value)} key={value}>{value}</Chip>)}</div></section>
    <PrimaryButton className="stage5-save" disabled={actions.savePreferences.isPending} onClick={() => actions.savePreferences.mutate(draft)}>{actions.savePreferences.isSuccess ? <><Check /> SAVED</> : 'SAVE PREFERENCES'}</PrimaryButton>
  </div>
}
