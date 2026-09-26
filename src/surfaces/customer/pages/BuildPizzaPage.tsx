import { ArrowLeft, ArrowRight, Check, Clock3, Pizza, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProduct } from '../../../features/catalog/hooks/useCatalog'
import { useCart, useCartActions } from '../../../features/cart/hooks/useCart'
import { configuredUnitPrice, modifierIssueForGroup, validateModifierSelections } from '../../../domain/catalog/modifier.engine'
import type { CartItemModifierSelection } from '../../../domain/cart/cart.types'
import { ModifierGroupControl } from '../../../features/product/components/ModifierGroupControl'
import { ErrorState, IconButton, PrimaryButton, QuantityStepper, SecondaryButton, Skeleton, StickyBottomAction } from '../../../shared/components'
import { createPizzaPresets } from '../../../domain/catalog/pizza-presets'

export default function BuildPizzaPage() {
  const { productId = '' } = useParams()
  const [params] = useSearchParams()
  const editItemId = params.get('edit') ?? undefined
  const copyItemId = params.get('copy') ?? undefined
  const navigate = useNavigate()
  const detail = useProduct(productId)
  const cart = useCart()
  const { add, update } = useCartActions()
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<CartItemModifierSelection[]>([])
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string>()
  const [quickError, setQuickError] = useState<string>()
  const initialized = useRef(false)

  const product = detail.data?.product
  const groups = useMemo(() => product?.modifierGroups ?? [], [product])
  const presets = useMemo(() => createPizzaPresets(product?.price ?? 0, groups), [groups, product?.price])
  useEffect(() => {
    if (initialized.current || !product || ((editItemId || copyItemId) && !cart.data)) return
    const source = cart.data?.items.find((item) => item.id === (editItemId ?? copyItemId))
    if (source) {
      setSelections(source.modifiers)
      setSpecialInstructions(source.specialInstructions ?? '')
      if (editItemId) setQuantity(source.quantity)
    }
    initialized.current = true
  }, [cart.data?.items, copyItemId, editItemId, product])

  if (detail.isPending || cart.isPending) return <section className="commerce-page builder-page"><Skeleton className="builder-head-skeleton" /><Skeleton className="builder-options-skeleton" /></section>
  if (detail.isError || !product) return <section className="commerce-page"><ErrorState retry={() => void detail.refetch()} /></section>
  if (groups.length !== 7) return <section className="commerce-page"><ErrorState /></section>

  const group = groups[step]
  const liveUnitPrice = configuredUnitPrice(product.price, groups, selections)
  const liveTotal = liveUnitPrice * quantity
  const chosenCount = selections.find((selection) => selection.groupId === group.id)?.optionIds.length ?? 0
  const groupIssue = modifierIssueForGroup(groups, selections, group.id)

  const choose = (optionId: string) => {
    setError(undefined)
    setQuickError(undefined)
    setSelections((current) => {
      const existing = current.find((selection) => selection.groupId === group.id)
      const selected = existing?.optionIds ?? []
      const nextIds = group.multiple
        ? selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId].slice(0, group.maxSelections)
        : [optionId]
      return [...current.filter((selection) => selection.groupId !== group.id), { groupId: group.id, optionIds: nextIds }]
    })
  }

  const next = () => {
    if (groupIssue) { setError(groupIssue.message); return }
    setError(undefined)
    setStep((current) => Math.min(6, current + 1))
  }
  const back = () => {
    setError(undefined)
    if (step === 0) navigate(`/app/product/${product.id}`)
    else setStep((current) => current - 1)
  }
  const finish = async () => {
    const issues = validateModifierSelections(groups, selections)
    if (issues.length) {
      const invalidStep = groups.findIndex((candidate) => candidate.id === issues[0].groupId)
      setStep(Math.max(0, invalidStep)); setError(issues[0].message); return
    }
    if (editItemId) await update.mutateAsync({ id: editItemId, quantity, modifiers: selections, specialInstructions })
    else await add.mutateAsync({ productId: product.id, quantity, modifiers: selections, specialInstructions })
    navigate('/app/cart')
  }
  const addPreset = async (preset: (typeof presets)[number]) => {
    setQuickError(undefined)
    try {
      await add.mutateAsync({ productId: product.id, quantity: 1, modifiers: preset.selections })
      navigate('/app/cart')
    } catch {
      setQuickError('That quick build just changed availability. Choose another or customize below.')
    }
  }

  return <section className="commerce-page builder-page">
    <header className="builder-header"><IconButton aria-label="Go back" onClick={back}><ArrowLeft /></IconButton><div><span>BUILD YOUR PIZZA</span><strong>{product.name}</strong></div><div className="live-total"><span>LIVE TOTAL</span><strong>₹{liveTotal}</strong></div></header>
    <div className="build-progress"><div><span>STEP {step + 1} / 7</span><strong>{group.name.toUpperCase()}</strong></div><div className="progress-track"><motion.i animate={{ width: `${((step + 1) / 7) * 100}%` }} transition={{ duration: .2 }} /></div></div>

    {step === 0 && !editItemId && !copyItemId && <section className="quick-builds" aria-labelledby="quick-builds-title">
      <header><span><Clock3 /> SHORT ON TIME?</span><h2 id="quick-builds-title">Pick a ready favourite.</h2><p>Add a proven combination now, or build your own below.</p></header>
      <div className="quick-build-list">{presets.map((preset, index) => <motion.button type="button" key={preset.id} disabled={add.isPending} onClick={() => void addPreset(preset)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} aria-label={`Add ${preset.name} for ₹${preset.unitPrice}`}>
        <span>{preset.id === 'CLASSIC' ? '01' : preset.id === 'CHEESY' ? '02' : '03'}</span><div><strong>{preset.name}</strong><small>{preset.description}</small><em>{preset.optionSummary}</em></div><b>₹{preset.unitPrice}<i><Zap size={13} /> ADD</i></b>
      </motion.button>)}</div>
      {quickError && <p className="quick-build-error" role="alert">{quickError}</p>}
      <div className="custom-build-divider"><span>OR CUSTOMIZE IN 7 STEPS</span></div>
    </section>}

    <motion.div className="builder-stage" key={group.id} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .2 }}>
      <div className="builder-step-copy"><span>{group.required ? 'REQUIRED SELECTION' : 'OPTIONAL EXTRA'}</span><h1>{group.name}</h1><p>{group.required ? 'Choose what feels right for this pizza.' : 'Skip it or add a little more to the meal.'}</p></div>
      <ModifierGroupControl group={group} selections={selections} onChange={choose} error={error} />
      <div className="builder-step-status"><Pizza size={18} /><span>{chosenCount ? `${chosenCount} selected` : group.required ? 'Waiting for your choice' : 'Nothing added yet'}</span>{!groupIssue && <Check size={18} />}</div>
      {step === 6 && <label className="builder-instructions"><span>SPECIAL INSTRUCTIONS · OPTIONAL</span><textarea value={specialInstructions} maxLength={240} rows={3} onChange={(event) => setSpecialInstructions(event.target.value)} placeholder="Example: bake it extra crisp" /><small>{specialInstructions.length}/240 · We’ll confirm anything that affects availability.</small></label>}
    </motion.div>

    <aside className="build-recap"><span>YOUR BUILD</span><div>{groups.map((item, index) => <button key={item.id} type="button" className={index === step ? 'active' : ''} onClick={() => setStep(index)}><i>{index + 1}</i><strong>{item.name}</strong><small>{selections.find((selection) => selection.groupId === item.id)?.optionIds.length ?? 0}</small></button>)}</div></aside>

    <div className="builder-navigation"><SecondaryButton onClick={back}><ArrowLeft size={18} /> BACK</SecondaryButton>{step < 6 && <PrimaryButton onClick={next}>NEXT <ArrowRight size={18} /></PrimaryButton>}</div>
    {step === 6 && <StickyBottomAction><QuantityStepper value={quantity} disabled={add.isPending || update.isPending} onChange={(value) => setQuantity(Math.max(1, Math.min(20, value)))} /><div><span>{editItemId ? 'UPDATED TOTAL' : copyItemId ? 'ADD ANOTHER' : 'YOUR PIZZA'}</span><strong>₹{liveTotal}</strong></div><PrimaryButton disabled={add.isPending || update.isPending} onClick={() => void finish()}>{editItemId ? 'UPDATE PIZZA' : 'ADD PIZZA'} <ArrowRight size={18} /></PrimaryButton></StickyBottomAction>}
  </section>
}
