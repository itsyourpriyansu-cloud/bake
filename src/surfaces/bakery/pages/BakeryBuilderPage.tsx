import { ArrowLeft, ArrowRight, CalendarDays, Check, ImagePlus, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { BakeryEvent, BakerySelection } from '../../../domain/bakery/bakery.types'
import { useBakeryCartActions, useBakeryProduct, useBakerySavedDesignActions } from '../../../features/bakery/useBakery'
import { getBakeryProductAsset } from '../../../shared/utils/bakeryAssets'
import { BakeryStatePanel } from '../components/BakeryUi'

const eventOptions: Array<{ id: BakeryEvent; label: string }> = [
  { id: 'BIRTHDAY', label: 'Birthday' }, { id: 'ANNIVERSARY', label: 'Anniversary' }, { id: 'WEDDING', label: 'Wedding' },
  { id: 'BABY_SHOWER', label: 'Baby shower' }, { id: 'KIDS', label: 'Kids party' }, { id: 'CORPORATE', label: 'Corporate' }, { id: 'JUST_BECAUSE', label: 'Just because' },
]

export default function BakeryBuilderPage() {
  const { productId } = useParams(); const productQuery = useBakeryProduct(productId); const actions = useBakeryCartActions(); const savedActions = useBakerySavedDesignActions(); const navigate = useNavigate()
  const defaultDate = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10)
  const [step, setStep] = useState(0); const [eventType, setEventType] = useState<BakeryEvent>('BIRTHDAY'); const [eventDate, setEventDate] = useState(defaultDate); const [message, setMessage] = useState('Happy Birthday!'); const [selections, setSelections] = useState<BakerySelection[]>([]); const [attempted, setAttempted] = useState(false); const [designSaved, setDesignSaved] = useState(false)
  const product = productQuery.data; const group = step > 0 ? product?.modifierGroups[step - 1] : undefined; const totalSteps = (product?.modifierGroups.length ?? 7) + 1
  const selectedIds = group ? selections.find((selection) => selection.groupId === group.id)?.optionIds ?? [] : []
  const estimatedTotal = useMemo(() => { if (!product) return 0; const ids = new Set(selections.flatMap((selection) => selection.optionIds)); return product.basePrice + product.modifierGroups.flatMap((item) => item.options).filter((option) => ids.has(option.id)).reduce((sum, option) => sum + option.priceDelta, 0) }, [product, selections])
  if (productQuery.isLoading) return <div className="bakery-loading-row">Opening the cake studio…</div>
  if (productQuery.isError) return <BakeryStatePanel title="THE STUDIO DIDN’T OPEN" description="Your cake is safe. Retry the connection to continue designing." actionLabel="TRY AGAIN" onAction={() => void productQuery.refetch()} />
  if (!product) return <BakeryStatePanel title="THAT DESIGN ISN’T HERE" description="Choose another cake to open in the studio." actionLabel="BROWSE CAKES" link="/bakery/app/cakes" />
  if (!product.available) return <BakeryStatePanel title="THIS CAKE IS TEMPORARILY PAUSED" description="The bakery cannot accept new customisations for this design right now." actionLabel="CHOOSE ANOTHER CAKE" link="/bakery/app/cakes" />
  if (!product.customisable) return <BakeryStatePanel title="READY-MADE ONLY" description="This bake is finished as shown and can be added directly from its product page." actionLabel="VIEW PRODUCT" link={`/bakery/app/product/${product.id}`} />
  const valid = step === 0 ? Boolean(eventDate) : !group?.required || selectedIds.length >= group.min
  const toggle = (optionId: string) => {
    if (!group) return
    setSelections((current) => {
      const existing = current.find((selection) => selection.groupId === group.id)?.optionIds ?? []
      const nextIds = group.max === 1 ? [optionId] : existing.includes(optionId) ? existing.filter((id) => id !== optionId) : existing.length < group.max ? [...existing, optionId] : existing
      return [...current.filter((selection) => selection.groupId !== group.id), { groupId: group.id, optionIds: nextIds }]
    })
  }
  const next = () => { if (!valid) { setAttempted(true); return } if (step < totalSteps - 1) { setAttempted(false); setStep((value) => value + 1) } }
  const add = () => actions.add.mutate({ productId: product.id, selections, message, eventType, eventDate }, { onSuccess: () => navigate('/bakery/app/cart') })
  const saveForLater = () => savedActions.save.mutate({ productId: product.id, selections, message, eventType, eventDate }, { onSuccess: () => setDesignSaved(true) })
  const stepLabels = ['Moment', ...product.modifierGroups.map((item) => item.title)]
  const selectionSummary = selections.flatMap((selection) => { const currentGroup = product.modifierGroups.find((item) => item.id === selection.groupId); return selection.optionIds.map((id) => currentGroup?.options.find((option) => option.id === id)?.label).filter(Boolean) })
  return <div className="bakery-builder-page">
    <header className="bakery-builder-top"><Link to={`/bakery/app/product/${product.id}`} aria-label="Back to product"><ArrowLeft /></Link><div><span>CAKE STUDIO</span><b>STEP {step + 1} OF {totalSteps}</b></div><strong>₹{estimatedTotal}</strong></header>
    <div className="bakery-builder-progress"><span style={{ width: `${((step + 1) / totalSteps) * 100}%` }} /></div>
    <nav className="bakery-builder-steps" aria-label="Cake design progress">{stepLabels.map((label, index) => <button type="button" className={index === step ? 'active' : index < step ? 'done' : ''} disabled={index > step} onClick={() => index < step && setStep(index)} key={label}><span>{index < step ? <Check /> : index + 1}</span><b>{label}</b></button>)}</nav>
    <div className="bakery-builder-layout"><aside className="bakery-live-cake"><div className="bakery-preview-stage"><img src={getBakeryProductAsset(product.id)} alt={`Preview of ${product.name}`} /><span className="bakery-preview-message">{message || 'Your message'}</span><i className="spark one">✦</i><i className="spark two">✦</i></div><div><span>YOUR LIVE PREVIEW</span><h2>{product.name}</h2><p>Preview is a style guide. Every cake is finished by hand.</p></div></aside>
      <section className="bakery-builder-controls">{step === 0 ? <><span className="bakery-kicker">START WITH THE MOMENT</span><h1>WHEN ARE WE CELEBRATING?</h1><p>Your date helps us show designs that can be made beautifully and on time.</p><div className="bakery-event-choice">{eventOptions.map((option) => <button type="button" className={eventType === option.id ? 'selected' : ''} key={option.id} onClick={() => setEventType(option.id)}>{option.label}{eventType === option.id && <Check />}</button>)}</div><label className="bakery-date-field"><CalendarDays /><span><b>Event date</b><input type="date" min={new Date().toISOString().slice(0, 10)} value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></span></label><Link className="bakery-inspiration-link" to="/bakery/app/bespoke"><ImagePlus /><span><b>Already have an inspiration image?</b><small>Start a bespoke request instead</small></span><ArrowRight /></Link></> : group ? <><span className="bakery-kicker">{group.required ? 'REQUIRED CHOICE' : 'MAKE IT EXTRA'}</span><h1>{group.title.toUpperCase()}</h1><p>{group.description}</p><div className="bakery-builder-options" role="group" aria-label={group.title}>{group.options.map((option) => { const selected = selectedIds.includes(option.id); const available = option.available !== false; return <button type="button" aria-pressed={selected} disabled={!available} className={selected ? 'selected' : ''} onClick={() => toggle(option.id)} key={option.id}><span className="bakery-choice-mark">{selected && <Check />}</span><b>{option.label}</b><small>{available ? option.priceDelta ? `+₹${option.priceDelta}` : 'Included' : 'Unavailable'}</small>{option.recommended && available && <em>POPULAR</em>}</button> })}</div>{group.id === 'decor' && <label className="bakery-message-field"><span>Message on the cake</span><input maxLength={34} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Happy Birthday!" /><small>{message.length}/34</small></label>}{attempted && !valid && <p className="bakery-validation">Choose at least {group.min} option to continue.</p>}{step === totalSteps - 1 && <aside className="bakery-builder-recap"><div><Sparkles /><span><b>YOUR DESIGN IS READY</b><small>{eventType.replaceAll('_', ' ')} · {eventDate}</small></span></div><p>{selectionSummary.length} choices saved{message ? ` · “${message}”` : ''}</p><strong>LIVE TOTAL · ₹{estimatedTotal}</strong><button type="button" className="bakery-text-link" disabled={savedActions.save.isPending} onClick={saveForLater}>{designSaved ? 'SAVED FOR LATER ✓' : savedActions.save.isPending ? 'SAVING…' : 'SAVE FOR LATER'}</button></aside>}</> : null}
      {actions.add.isError && <p className="bakery-validation">The design could not be added. Check availability and try again.</p>}<footer className="bakery-builder-actions"><button type="button" className="bakery-button secondary" disabled={step === 0} onClick={() => { setAttempted(false); setStep((value) => Math.max(0, value - 1)) }}><ArrowLeft /> BACK</button>{step === totalSteps - 1 ? <button type="button" className="bakery-button primary" disabled={!valid || actions.add.isPending} onClick={add}><Sparkles /> {actions.add.isPending ? 'ADDING…' : `ADD DESIGN · ₹${estimatedTotal}`}</button> : <button type="button" className="bakery-button primary" onClick={next}>NEXT <ArrowRight /></button>}</footer></section>
    </div>
  </div>
}
