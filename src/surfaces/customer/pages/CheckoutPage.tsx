import { ArrowLeft, ArrowRight, Check, Clock3, MapPin, Phone, Store } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useDemo } from '../../../app/providers/DemoProvider'
import { useAppStore } from '../../../stores/app.store'
import { useCart, useCartQuote } from '../../../features/cart/hooks/useCart'
import { useCheckoutActions, useCheckoutOptions } from '../../../features/checkout/hooks/useCheckout'
import { usePaymentActions } from '../../../features/payment/hooks/usePayment'
import { ErrorState, IconButton, PrimaryButton, Skeleton, TextInput } from '../../../shared/components'

export function CheckoutSteps({ active }: { active: 'DETAILS' | 'PAYMENT' | 'DONE' }) {
  const stages = ['DETAILS', 'PAYMENT', 'DONE'] as const
  const activeIndex = stages.indexOf(active)
  return <ol className="checkout-steps" aria-label="Checkout progress">{stages.map((stage, index) => <li className={index <= activeIndex ? 'active' : ''} aria-current={stage === active ? 'step' : undefined} key={stage}><i>{index < activeIndex ? <Check size={14} /> : index + 1}</i><span>{stage}</span></li>)}</ol>
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { customerLoggedIn } = useDemo()
  const storedMode = useAppStore((state) => state.fulfillmentMode)
  const pointsRequested = useAppStore((state) => state.checkoutPointsRequested)
  const mode = storedMode === 'STORE' ? 'DELIVERY' : storedMode
  const options = useCheckoutOptions(mode, customerLoggedIn)
  const cart = useCart()
  const quote = useCartQuote(mode, pointsRequested)
  const checkout = useCheckoutActions()
  const payment = usePaymentActions()
  const [phone, setPhone] = useState('')
  const [line1, setLine1] = useState('')
  const [city, setCity] = useState('Puri')
  const [pincode, setPincode] = useState('')
  const [instructions, setInstructions] = useState('')
  const [note, setNote] = useState('')
  const [pickupSlot, setPickupSlot] = useState('')
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!options.data) return
    setPhone((value) => value || options.data.customer.phone)
    setLine1((value) => value || options.data.customer.defaultAddress?.line1 || '')
    setCity((value) => value || options.data.customer.defaultAddress?.city || 'Puri')
    setPincode((value) => value || options.data.customer.defaultAddress?.pincode || '')
    setPickupSlot((value) => value || options.data.pickupSlots[0] || '')
  }, [options.data])

  if (!customerLoggedIn) return <Navigate to="/app/auth?returnTo=/app/checkout" replace />
  if (options.isPending || cart.isPending || quote.isPending) return <section className="full-commerce-flow checkout-page"><Skeleton className="checkout-progress-skeleton" /><Skeleton className="checkout-form-skeleton" /></section>
  if (options.isError || cart.isError || quote.isError || !options.data || !quote.data) return <section className="full-commerce-flow checkout-page"><ErrorState retry={() => { void options.refetch(); void cart.refetch(); void quote.refetch() }} /></section>
  if (!cart.data?.items.length) return <Navigate to="/app/cart" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(undefined)
    if (!/^\d{10}$/.test(phone)) { setError('Enter a valid 10-digit phone number.'); return }
    if (mode === 'DELIVERY' && (!line1.trim() || !/^\d{6}$/.test(pincode))) { setError('Enter a complete delivery address and 6-digit pincode.'); return }
    if (mode === 'PICKUP' && !pickupSlot) { setError('Choose a pickup slot.'); return }
    try {
      const session = await checkout.createSession.mutateAsync({
        fulfillmentType: mode, phone,
        addressSnapshot: mode === 'DELIVERY' ? { line1: line1.trim(), city: city.trim(), pincode } : undefined,
        pickupSlot: mode === 'PICKUP' ? pickupSlot : undefined,
        instructions: mode === 'DELIVERY' ? instructions : undefined, note: mode === 'PICKUP' ? note : undefined,
        pointsRequested,
      })
      const intent = await checkout.createIntent.mutateAsync(session.id)
      const initiated = await payment.initiate.mutateAsync(intent.id)
      navigate(`/app/payment/${initiated.payment.id}`)
    } catch { setError('Checkout could not be prepared. Your cart is unchanged—please try again.') }
  }
  const busy = checkout.createSession.isPending || checkout.createIntent.isPending || payment.initiate.isPending

  return <section className="full-commerce-flow checkout-page">
    <header className="flow-header"><IconButton aria-label="Back to cart" onClick={() => navigate('/app/cart')}><ArrowLeft /></IconButton><div><span>CHECKOUT</span><strong>{mode === 'DELIVERY' ? 'Delivery to Puri' : 'Pickup from Grand Road'}</strong></div></header>
    <CheckoutSteps active="DETAILS" />
    <form className="checkout-layout" onSubmit={(event) => void submit(event)}>
      <div className="checkout-details"><section className="checkout-intro"><span>{mode === 'DELIVERY' ? 'DELIVERY DETAILS' : 'PICKUP DETAILS'}</span><h1>{mode === 'DELIVERY' ? 'Where should we bring it?' : 'When will you pick it up?'}</h1><div><Clock3 /><strong>{options.data.etaLabel}</strong><small>System-generated estimate</small></div></section>
        {mode === 'DELIVERY' ? <section className="checkout-fields"><div className="checkout-section-title"><MapPin /><div><strong>Delivery address</strong><span>Grand Road store delivery area</span></div></div><TextInput label="Address" autoComplete="street-address" value={line1} onChange={(event) => setLine1(event.target.value)} /><div className="field-pair"><TextInput label="City" value={city} onChange={(event) => setCity(event.target.value)} /><TextInput label="Pincode" inputMode="numeric" maxLength={6} value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, ''))} /></div><label className="field"><span>Delivery instructions · optional</span><textarea value={instructions} maxLength={140} onChange={(event) => setInstructions(event.target.value)} placeholder="Landmark, gate or drop-off note" /></label></section> : <section className="checkout-fields"><div className="checkout-section-title"><Store /><div><strong>Pickup slot</strong><span>Generated from current kitchen timing</span></div></div><div className="pickup-slots" role="radiogroup" aria-label="Pickup slot">{options.data.pickupSlots.map((slot) => <button type="button" role="radio" aria-checked={pickupSlot === slot} className={pickupSlot === slot ? 'selected' : ''} onClick={() => setPickupSlot(slot)} key={slot}><Clock3 /><span>{slot}</span>{pickupSlot === slot && <Check />}</button>)}</div><label className="field"><span>Pickup note · optional</span><textarea value={note} maxLength={140} onChange={(event) => setNote(event.target.value)} placeholder="Anything the store should know?" /></label></section>}
        <section className="checkout-fields"><div className="checkout-section-title"><Phone /><div><strong>Contact number</strong><span>Used only for this order</span></div></div><TextInput label="Phone" inputMode="numeric" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))} /></section>
      </div>
      <aside className="checkout-bill"><div className="checkout-section-title"><div><strong>Your bill</strong><span>{quote.data.itemCount} {quote.data.itemCount === 1 ? 'item' : 'items'}</span></div></div><dl><div><dt>Subtotal</dt><dd>₹{quote.data.subtotal}</dd></div>{quote.data.pointsValue > 0 && <div><dt>Wave Points</dt><dd>−₹{quote.data.pointsValue}</dd></div>}<div><dt>{mode === 'DELIVERY' ? 'Delivery fee' : 'Pickup fee'}</dt><dd>{quote.data.deliveryFee ? `₹${quote.data.deliveryFee}` : 'FREE'}</dd></div><div><dt>Total</dt><dd>₹{quote.data.total}</dd></div></dl><div className="checkout-promise"><Clock3 /><span>Estimated by system</span><strong>{new Date(options.data.systemEta).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</strong></div>{error && <p className="flow-error" role="alert">{error}</p>}<PrimaryButton type="submit" disabled={busy || !quote.data.valid}>CONTINUE TO PHONEPE <ArrowRight size={18} /></PrimaryButton><small>Checkout session and order intent are created before the demo payment opens.</small></aside>
    </form>
  </section>
}
