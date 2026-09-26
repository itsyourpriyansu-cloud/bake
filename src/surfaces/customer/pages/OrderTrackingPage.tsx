import { Bike, Check, CheckCircle2, Clock3, Heart, HelpCircle, MapPin, PackageCheck, Pizza, RefreshCw, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { customerTimeline, getCustomerOrderView } from '../../../domain/orders/customer-order.view'
import { useLoyalty } from '../../../features/loyalty/hooks/useLoyalty'
import { useOrder, useOrderActions, useOrderEvents } from '../../../features/orders/hooks/useOrders'
import { showDemoTools } from '../../../app/config/env'
import { ErrorState, Skeleton } from '../../../shared/components'
import { CustomerPageHeader, formatMoney, MiniProductArt } from '../components/Stage5Ui'
import { useCustomerExperienceActions } from '../../../features/customer/hooks/useCustomerExperience'
import { useRealtimeStatus } from '../../../features/realtime/hooks/useRealtimeStatus'
import { DeliveryTrackingMap } from '../components/DeliveryTrackingMap'

const eventNames: Record<string, string> = { PAYMENT_CONFIRMED: 'Payment received', ORDER_ACCEPTED: 'Pizza Wave accepted your order', FULFILLMENT_SCHEDULED: 'Kitchen slot reserved', PREP_STARTED: 'Fresh preparation started', PREP_TIME_OVERRIDDEN: 'ETA updated', ORDER_READY: 'Order packed and ready', ORDER_DISPATCHED: 'Rider left Grand Road', ORDER_COMPLETED: 'Order completed', POINTS_CREDITED: 'Wave Points added' }

export default function OrderTrackingPage() {
  const { orderId = '' } = useParams(); const order = useOrder(orderId); const events = useOrderEvents(orderId); const loyalty = useLoyalty(); const actions = useOrderActions(); const customerActions = useCustomerExperienceActions(); const navigate = useNavigate()
  const realtimeConnected = useRealtimeStatus()
  if (order.isError) return <div className="stage5-page"><ErrorState retry={() => void order.refetch()} /></div>
  if (!order.data) return <div className="stage5-page"><Skeleton className="tracking-skeleton" /></div>
  const status = getCustomerOrderView(order.data); const steps = customerTimeline(order.data)
  const eta = order.data.promisedAt ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(order.data.promisedAt)) : 'Updating now'
  if (status.terminal && ['DELIVERED', 'PICKED_UP', 'STORE_COMPLETED'].includes(order.data.fulfillmentStatus)) return <div className="stage5-page completion-page">
    <CustomerPageHeader eyebrow={order.data.publicOrderNumber} title="Complete" back="/app/orders" />
    <motion.section className="completion-card" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}><div className="completion-icon"><Heart fill="currentColor" /></div><span>DELIVERED WITH LOVE</span><h1>DELIVERED <Heart fill="currentColor" /></h1><p>How was your Pizza Wave?</p><div className="rating-row" aria-label="Rate your order">{['😍', '🙂', '😐', '😕'].map((face, index) => <button key={face} aria-label={`${4 - index} star rating`}>{face}</button>)}</div><div className="points-celebration"><Star /><div><strong>+{order.data.financialSnapshot.pointsToEarn} points</strong><span>{loyalty.data?.customer.pointsAvailable ?? 206} total · available now</span></div></div><p className="tier-nudge">2 orders to Platinum</p><div className="completion-actions"><button className="button button-secondary" disabled={customerActions.saveCompletedOrder.isPending} onClick={() => customerActions.saveCompletedOrder.mutate({ orderId: order.data.id, name: 'My PW1384' }, { onSuccess: () => navigate('/app/saved-orders') })}>SAVE THIS ORDER</button><Link className="button button-primary" to="/app/">DONE</Link></div></motion.section>
  </div>
  return <div className="stage5-page tracking-page">
    <CustomerPageHeader eyebrow="LIVE ORDER" title={order.data.publicOrderNumber} back="/app/orders" />
    <motion.section className={`tracking-hero stage-${status.stage.toLowerCase()}`} key={status.label} initial={{ opacity: .6, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="tracking-hero-icon">{status.stage === 'PREPARING' ? <Pizza /> : status.stage === 'READY' ? <PackageCheck /> : status.stage === 'TRAVEL' ? <Bike /> : <Clock3 />}</div>
      <span>{order.data.fulfillmentType === 'DELIVERY' ? 'DELIVERY TO CT ROAD' : 'PICKUP FROM GRAND ROAD'}</span><h1>{status.label}</h1><p>{status.detail}</p>
      <div className="eta-block"><Clock3 /><span>ESTIMATED {order.data.fulfillmentType === 'DELIVERY' ? 'DELIVERY' : 'READY'}<strong>{eta}</strong></span><em>Live</em></div>
      <div className="tracking-progress"><motion.i initial={{ width: 0 }} animate={{ width: `${status.progress}%` }} transition={{ duration: .55 }} /></div>
    </motion.section>
    {order.data.fulfillmentType === 'DELIVERY' && <DeliveryTrackingMap order={order.data} events={events.data} realtimeConnected={realtimeConnected} />}
    <section className="tracking-section"><h2>Your order journey</h2><ol className="order-timeline">{steps.map((step) => <li className={`${step.complete ? 'complete' : ''} ${step.current ? 'current' : ''}`} key={step.stage}><i>{step.complete ? <Check /> : step.current ? <span /> : null}</i><span>{step.label}</span></li>)}</ol></section>
    <div className="tracking-grid"><section className="tracking-section"><h2>In this order</h2><div className="tracking-items">{order.data.items.map((item) => <div key={item.productId}><MiniProductArt productId={item.productId} name={item.name} /><span><strong>{item.quantity}× {item.name}</strong><small>{formatMoney(item.unitPrice)} each</small></span><b>{formatMoney(item.unitPrice * item.quantity)}</b></div>)}</div></section>
      <section className="tracking-section order-payment-summary"><h2>Payment summary</h2><dl><div><dt>Food & customisations</dt><dd>{formatMoney(order.data.financialSnapshot.subtotal)}</dd></div>{order.data.financialSnapshot.discount > 0 && <div><dt>Savings</dt><dd>−{formatMoney(order.data.financialSnapshot.discount)}</dd></div>}<div><dt>Delivery fee</dt><dd>{formatMoney(order.data.financialSnapshot.deliveryFee)}</dd></div><div><dt>Paid via PhonePe demo</dt><dd>{formatMoney(order.data.financialSnapshot.total)}</dd></div></dl><div className="pending-points"><Star /><span><strong>+{order.data.financialSnapshot.pointsToEarn} points pending</strong>Available after completion</span></div></section></div>
    {events.data?.length ? <section className="tracking-section order-updates"><h2>Latest updates</h2>{events.data.slice(-3).reverse().map((event) => <div key={event.id}><CheckCircle2 /><span><strong>{eventNames[event.type] ?? 'Order updated'}</strong><small>{new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(event.at))}</small></span></div>)}</section> : null}
    <section className="tracking-help"><MapPin /><div><strong>Need help with {order.data.publicOrderNumber}?</strong><span>Track, change or report a problem in guided support.</span></div><Link to={`/app/support?orderId=${order.data.id}`}><HelpCircle /> GET HELP</Link></section>
    {showDemoTools && <button className="demo-advance" disabled={actions.advance.isPending} onClick={() => actions.advance.mutate(order.data.id)}><RefreshCw /> DEMO: ADVANCE ORDER</button>}
  </div>
}
