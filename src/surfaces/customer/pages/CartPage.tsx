import { ArrowLeft, ArrowRight, Check, Gift, Pencil, Plus, Sparkles, Trash2, Waves } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart, useCartActions, useCartQuote } from '../../../features/cart/hooks/useCart'
import { useRecommendations } from '../../../features/catalog/hooks/useCatalog'
import { useLoyalty } from '../../../features/loyalty/hooks/useLoyalty'
import { useAppStore } from '../../../stores/app.store'
import { BottomSheet, EmptyState, ErrorState, IconButton, PrimaryButton, QuantityStepper, SecondaryButton, Skeleton } from '../../../shared/components'
import { getProductAsset } from '../../../shared/utils/assets'
import { CustomerAsset } from '../components/CustomerAsset'
import type { LegacyCart } from '../../../domain/cart/cart.types'
import { useDemo } from '../../../app/providers/DemoProvider'

function modifierNames(item: LegacyCart['items'][number]) {
  const product = item.product
  const groupOrder = new Map((product.modifierGroups ?? []).map((group, index) => [group.id, index]))
  if (item.customizationSummary?.length) return [...item.customizationSummary]
    .sort((left, right) => (groupOrder.get(left.groupId) ?? 99) - (groupOrder.get(right.groupId) ?? 99))
    .map((selection) => selection.optionName)
  return item.modifiers.flatMap((selection) => {
    const group = product.modifierGroups?.find((candidate) => candidate.id === selection.groupId)
    return selection.optionIds.map((id) => group?.options.find((option) => option.id === id)?.name).filter((name): name is string => Boolean(name))
  })
}

export default function CartPage() {
  const navigate = useNavigate()
  const storedMode = useAppStore((state) => state.fulfillmentMode)
  const pointsRequested = useAppStore((state) => state.checkoutPointsRequested)
  const setPointsRequested = useAppStore((state) => state.setCheckoutPointsRequested)
  const mode = storedMode === 'STORE' ? 'DELIVERY' : storedMode
  const { customerLoggedIn } = useDemo()
  const cart = useCart()
  const usePoints = pointsRequested > 0
  const quote = useCartQuote(mode, customerLoggedIn ? pointsRequested : 0)
  const loyalty = useLoyalty(customerLoggedIn)
  const recommendations = useRecommendations('popular')
  const { add, update, remove } = useCartActions()
  const [changeOpen, setChangeOpen] = useState(true)
  const issue = quote.data?.availabilityIssues?.[0]
  useEffect(() => { if (issue) setChangeOpen(true) }, [issue?.entityId, issue?.itemId])
  useEffect(() => { if (!customerLoggedIn && pointsRequested) setPointsRequested(0) }, [customerLoggedIn, pointsRequested, setPointsRequested])

  const suggestions = useMemo(() => recommendations.data?.filter((product) => ['sides', 'shakes', 'desserts'].includes(product.category) && !cart.data?.items.some((item) => item.productId === product.id)).slice(0, 3) ?? [], [cart.data?.items, recommendations.data])

  if (cart.isPending || quote.isPending) return <section className="commerce-page cart-page"><Skeleton className="cart-head-skeleton" />{Array.from({ length: 2 }, (_, index) => <Skeleton className="cart-item-skeleton" key={index} />)}</section>
  if (cart.isError || quote.isError || !cart.data || !quote.data) return <section className="commerce-page"><ErrorState retry={() => { void cart.refetch(); void quote.refetch() }} /></section>
  if (cart.data.items.length === 0) return <section className="commerce-page cart-page empty-cart-page"><header className="cart-header"><IconButton aria-label="Back to menu" onClick={() => navigate('/app/menu')}><ArrowLeft /></IconButton><div><span>YOUR ORDER</span><h1>Cart</h1></div></header><EmptyState title="Your cart is waiting" message="Add a pizza, quick bite or shake to start your order." /><PrimaryButton onClick={() => navigate('/app/menu')}>EXPLORE THE MENU <ArrowRight size={18} /></PrimaryButton></section>

  const threshold = quote.data.threshold
  const thresholdProgress = threshold ? Math.min(100, (quote.data.subtotal / threshold.target) * 100) : 0
  const pointsAvailable = loyalty.data?.customer.pointsAvailable ?? 0

  return <section className="commerce-page cart-page">
    <header className="cart-header"><IconButton aria-label="Back to menu" onClick={() => navigate('/app/menu')}><ArrowLeft /></IconButton><div><span>YOUR ORDER</span><h1>Cart</h1></div><strong>{quote.data.itemCount} {quote.data.itemCount === 1 ? 'ITEM' : 'ITEMS'}</strong></header>

    <div className="cart-layout"><div className="cart-primary">
      <section className="cart-items" aria-label="Cart items">{cart.data.items.map((item) => {
        const asset = getProductAsset(item.product.id, item.product.image)
        const selectedNames = modifierNames(item)
        const customizable = Boolean(item.product.modifierGroups?.length)
        return <motion.article className="cart-item" layout key={item.id}><Link className="cart-item-art" to={`/app/product/${item.productId}`}><CustomerAsset src={asset.src} alt={item.product.name} fallbackLabel={asset.fallbackLabel} /></Link><div className="cart-item-copy"><div><span className={`veg-status ${item.product.veg ? 'veg' : 'non-veg'}`}><i />{item.product.veg ? 'VEG' : 'NON-VEG'}</span><h2>{item.product.name}</h2>{selectedNames.length > 0 && <p>{selectedNames.join(' · ')}</p>}{item.specialInstructions && <p className="cart-item-note">“{item.specialInstructions}”</p>}</div><div className="cart-item-actions"><strong>₹{item.lineTotal ?? item.unitPriceSnapshot * item.quantity}</strong><div>{customizable ? <Link to={`/app/build/${item.productId}?edit=${item.id}`}><Pencil size={15} /> EDIT</Link> : <span />}<button type="button" onClick={() => remove.mutate(item.id)} aria-label={`Remove ${item.product.name}`}><Trash2 size={17} /></button></div><QuantityStepper value={item.quantity} disabled={update.isPending} onChange={(quantity) => update.mutate({ id: item.id, quantity })} onIncrement={customizable ? () => navigate(`/app/build/${item.productId}?copy=${item.id}`) : undefined} /></div></div></motion.article>
      })}</section>

      {threshold && <section className={`threshold-card ${threshold.remaining === 0 ? 'complete' : ''}`}><div><Gift /><span>{threshold.remaining > 0 ? `${threshold.label} · ₹${threshold.remaining} to go` : 'Feast goal reached'}</span>{threshold.remaining === 0 && <Check />}</div><div className="threshold-track"><i style={{ width: `${thresholdProgress}%` }} /></div></section>}

      {suggestions.length > 0 && <section className="cart-suggestions"><div className="section-heading"><div><span>GOOD WITH THAT</span><h2>Add a little extra</h2></div></div><div>{suggestions.map((product) => {
        const asset = getProductAsset(product.id, product.image)
        return <article key={product.id}><CustomerAsset src={asset.src} alt={product.name} fallbackLabel={asset.fallbackLabel} /><div><strong>{product.name}</strong><span>₹{product.price}</span></div><IconButton aria-label={`Add ${product.name}`} disabled={add.isPending} onClick={() => add.mutate(product.id)}><Plus /></IconButton></article>
      })}</div></section>}
    </div>

    <aside className="cart-summary">
      {customerLoggedIn ? <>
        <section className="gold-wave-card"><Waves /><div><span>GOLD WAVE</span><h2>You'll earn +{quote.data.pointsToEarn} points</h2><p>{pointsAvailable} available</p></div><Sparkles /></section>
        <button type="button" className={`points-redemption ${usePoints ? 'active' : ''}`} aria-pressed={usePoints} onClick={() => setPointsRequested(usePoints ? 0 : 50)}><span>{usePoints ? <Check /> : <i />}</span><div><strong>Use 50 points</strong><small>{usePoints ? `Save ₹${quote.data.pointsRedeemed ?? 0}` : '1 point = ₹1 · limits apply'}</small></div></button>
      </> : <section className="gold-wave-card guest-wave-card"><Waves /><div><span>WAVE REWARDS</span><h2>Sign in to earn and use points</h2><p>Verify at checkout to connect your balance.</p><Link to="/app/auth?returnTo=%2Fapp%2Fcart">SIGN IN TO WAVE <ArrowRight size={15} /></Link></div><Sparkles /></section>}
      {quote.data.warnings.map((warning) => <p className="quote-warning" key={warning}>{warning}</p>)}
      <section className="bill-card"><div className="section-heading"><div><span>SERVER QUOTE</span><h2>Your bill</h2></div></div><dl><div><dt>Subtotal</dt><dd>₹{quote.data.subtotal}</dd></div>{quote.data.discount > 0 && <div className="saving"><dt>Wave Points</dt><dd>−₹{quote.data.discount}</dd></div>}<div><dt>{mode === 'DELIVERY' ? 'Delivery fee' : 'Pickup fee'}</dt><dd>{quote.data.deliveryFee ? `₹${quote.data.deliveryFee}` : 'FREE'}</dd></div><div className="bill-total"><dt>Total</dt><dd>₹{quote.data.total}</dd></div></dl><small>Availability and pricing rechecked just now.</small></section>
      <PrimaryButton className="checkout-cta" disabled={!quote.data.valid} onClick={() => navigate('/app/checkout')}>CONTINUE TO CHECKOUT <ArrowRight size={18} /></PrimaryButton>
      <p className="payment-boundary">You’ll authenticate before opening the demo PhonePe payment.</p>
    </aside></div>

    <BottomSheet open={Boolean(issue && changeOpen)} onClose={() => setChangeOpen(false)} title="ONE ITEM CHANGED">
      {issue && <div className="availability-change"><p>{issue.message}</p><PrimaryButton onClick={() => navigate(`/app/build/${issue.productId}?edit=${issue.itemId}`)}>UPDATE PIZZA</PrimaryButton><SecondaryButton onClick={() => { remove.mutate(issue.itemId); setChangeOpen(false) }}>REMOVE ITEM</SecondaryButton></div>}
    </BottomSheet>
  </section>
}
