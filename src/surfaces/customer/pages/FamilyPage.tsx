import { Check, Heart, UserRound, UsersRound } from 'lucide-react'
import { useState } from 'react'
import type { FamilyMember } from '../../../domain/customer/customer-experience.types'
import { useCustomerExperienceActions, useFamily } from '../../../features/customer/hooks/useCustomerExperience'
import { ErrorState, PrimaryButton, Skeleton } from '../../../shared/components'
import { CustomerPageHeader } from '../components/Stage5Ui'

export default function FamilyPage() {
  const family = useFamily(); const actions = useCustomerExperienceActions(); const [editing, setEditing] = useState<FamilyMember>()
  if (family.isError) return <div className="stage5-page"><ErrorState retry={() => void family.refetch()} /></div>
  const save = () => editing && actions.saveFamilyMember.mutate(editing, { onSuccess: () => setEditing(undefined) })
  return <div className="stage5-page family-page"><CustomerPageHeader eyebrow="ORDER FOR EVERYONE" title="Family" back="/app/profile" />
    <p className="stage5-lede">Only food preferences, avoids and favourites live here—never phone numbers or other sensitive details.</p>
    {family.isPending ? <Skeleton className="family-skeleton" /> : <div className="family-grid">{family.data?.map((member, index) => <article key={member.id}><div className={`family-avatar family-${index}`}><UserRound /></div><span>{member.relation.toUpperCase()}</span><h2>{member.name}</h2><div className="family-tags"><b>{member.diet.replace('_', ' ')}</b><b>{member.spiceLevel} SPICE</b></div><dl><div><dt>Avoids</dt><dd>{member.avoid.length ? member.avoid.join(', ') : 'Nothing saved'}</dd></div><div><dt>Favourites</dt><dd>{member.favouriteProducts.join(', ')}</dd></div></dl><button onClick={() => setEditing(member)}>EDIT TASTES</button></article>)}</div>}
    {editing && <section className="family-editor"><div><UsersRound /><span><small>EDITING</small><h2>{editing.name}</h2></span></div><label>DIET<select value={editing.diet} onChange={(event) => setEditing({ ...editing, diet: event.target.value as FamilyMember['diet'] })}><option>VEG</option><option>NON_VEG</option><option>BOTH</option></select></label><label>SPICE<select value={editing.spiceLevel} onChange={(event) => setEditing({ ...editing, spiceLevel: event.target.value as FamilyMember['spiceLevel'] })}><option>MILD</option><option>MEDIUM</option><option>SPICY</option></select></label><label>Avoid (comma separated)<input value={editing.avoid.join(', ')} onChange={(event) => setEditing({ ...editing, avoid: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} /></label><label>Favourites (comma separated)<input value={editing.favouriteProducts.join(', ')} onChange={(event) => setEditing({ ...editing, favouriteProducts: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} /></label><PrimaryButton onClick={save}>{actions.saveFamilyMember.isPending ? 'SAVING…' : <><Check /> SAVE TASTES</>}</PrimaryButton></section>}
    <section className="family-note"><Heart /><span><strong>Family ordering, minus the guesswork</strong>We’ll use these profiles only to make group-order suggestions feel more relevant.</span></section>
  </div>
}
