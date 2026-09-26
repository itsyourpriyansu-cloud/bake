import {
  AlertTriangle, ArrowRight, BarChart3, BellRing, CircleUserRound, Command, Headphones, HeartHandshake,
  LayoutDashboard, LockKeyhole, LogOut, Menu, PackageCheck, Plus, Search, Settings2, ShieldCheck,
  Truck, UsersRound, UtensilsCrossed, WalletCards,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { CenterDialog, Drawer, ErrorState, Logo, PrimaryButton, SecondaryButton, Skeleton, Switch, TextInput, TierPill } from '../../../shared/components'
import { ownerLogin } from '../../../services/api/auth.api'
import { getMenu } from '../../../services/api/catalog.api'
import { sessionKeys } from '../../../app/router/routeGuards'
import type { OwnerSession as BrowserOwnerSession } from '../../../shared/types/domain'
import type { Order } from '../../../domain/orders/order.types'
import { getFounderDeliveryWatch, isTrackableDelivery } from '../../../domain/orders/delivery-tracking'
import type { AcceptanceMode, StoreConfig } from '../../../domain/store/store.types'
import type { CampaignChannel, CampaignTiming, CrmOpportunity, WhatsAppMessageType } from '../../../domain/retention/retention.types'
import {
  ownerKeys, useOwnerActions, useOwnerAttention, useOwnerAvailability, useOwnerCustomer, useOwnerCustomerSearch,
  useOwnerDashboard, useOwnerOpportunities, useOwnerOrders, useOwnerSupport,
} from '../../../features/owner/hooks/useOwner'

type Section = 'overview' | 'customers' | 'support' | 'growth' | 'config'
type ConfirmAction = { title: string; body: string; consequence: string; confirm: string; run: () => void }

const formatMoney = (value: number) => `₹${value.toLocaleString('en-IN')}`
const cleanStatus = (value: string) => value.replaceAll('_', ' ')

function ownerBrowserSession(): BrowserOwnerSession | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(sessionKeys.owner) ?? 'null') as BrowserOwnerSession | null
    return parsed?.realm === 'owner' && new Date(parsed.expiresAt).getTime() > Date.now() ? parsed : null
  } catch { return null }
}

function OwnerLogin({ onSuccess }: { onSuccess: (session: BrowserOwnerSession) => void }) {
  const [email, setEmail] = useState('owner@pizzawave.demo')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const login = useMutation({
    mutationFn: () => ownerLogin(email, password, code),
    onSuccess: (serverSession) => {
      const session: BrowserOwnerSession = { realm: 'owner', email: serverSession.email, expiresAt: serverSession.expiresAt }
      sessionStorage.setItem(sessionKeys.owner, JSON.stringify(session)); onSuccess(session)
    },
  })
  const submit = (event: FormEvent) => { event.preventDefault(); login.mutate() }
  return <main className="owner-login-page">
    <section className="owner-login-brand">
      <div className="owner-login-mark"><UtensilsCrossed /></div>
      <span>THE PIZZA WAVE · GRAND ROAD</span>
      <h1>RUN THE BUSINESS.<br />HANDLE THE EXCEPTIONS.</h1>
      <p>Operations, customer context and growth decisions—without turning the founder into an order processor.</p>
      <div className="owner-login-promise"><ShieldCheck /><span>Customer, owner and kitchen access remain separate.</span></div>
    </section>
    <section className="owner-login-panel"><form onSubmit={submit} className="owner-login-card">
      <div className="owner-login-icon"><LockKeyhole /></div><span>FOUNDER CONTROL CENTER</span><h2>Owner sign in</h2>
      <p>Demo-only secure realm. Use the frozen prototype credentials.</p>
      <TextInput label="Owner email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
      <TextInput label="Password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <TextInput label="6-digit 2FA" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} />
      {login.isError && <p className="owner-form-error" role="alert">Owner sign-in could not be verified. Check the demo credentials and try again.</p>}
      <PrimaryButton type="submit" disabled={login.isPending}>{login.isPending ? 'VERIFYING…' : 'ENTER CONTROL CENTER'} <ArrowRight /></PrimaryButton>
      <small>Prototype only · No production credentials or live services</small>
    </form></section>
  </main>
}

function SideNav({ active, onChange, onSignOut }: { active: Section; onChange: (section: Section) => void; onSignOut: () => void }) {
  const items: Array<{ id: Section; label: string; icon: ReactNode; hint: string }> = [
    { id: 'overview', label: 'Control Center', icon: <LayoutDashboard />, hint: 'Live business' },
    { id: 'customers', label: 'Customers', icon: <UsersRound />, hint: 'CRM & loyalty' },
    { id: 'support', label: 'Support', icon: <Headphones />, hint: 'Cases & refunds' },
    { id: 'growth', label: 'Growth', icon: <BarChart3 />, hint: 'Opportunities' },
    { id: 'config', label: 'Configuration', icon: <Settings2 />, hint: 'Policy controls' },
  ]
  return <aside className="owner-sidebar">
    <div className="owner-wordmark"><Logo variant="full" theme="light" size="md" /></div>
    <nav aria-label="Owner sections">{items.map((item) => <button type="button" className={active === item.id ? 'active' : ''} onClick={() => onChange(item.id)} key={item.id}>{item.icon}<span><strong>{item.label}</strong><small>{item.hint}</small></span></button>)}</nav>
    <div className="owner-sidebar-foot"><span className="owner-realm-badge"><ShieldCheck /> OWNER REALM</span><button type="button" onClick={onSignOut}><LogOut /> Sign out</button></div>
  </aside>
}

function OwnerTopbar({ onNewOrder, attentionCount }: { onNewOrder: () => void; attentionCount: number }) {
  return <header className="owner-topbar"><div><span>FRIDAY · GRAND ROAD, PURI</span><h1>Good evening, founder.</h1></div><div className="owner-top-actions"><span className="owner-alert-pill"><BellRing /> {attentionCount} need you</span><PrimaryButton onClick={onNewOrder}><Plus /> NEW STORE ORDER</PrimaryButton></div></header>
}

function StoreControls({ config, onConfirm }: { config: StoreConfig; onConfirm: (action: ConfirmAction) => void }) {
  const actions = useOwnerActions()
  const askToggle = (key: 'isOpen' | 'deliveryEnabled' | 'pickupEnabled' | 'storeOrderingEnabled', value: boolean, label: string) => onConfirm({
    title: `${value ? 'Turn on' : 'Pause'} ${label}?`,
    body: value ? `${label} becomes available to new orders immediately.` : `New ${label.toLowerCase()} orders will stop. Existing paid orders stay visible and unchanged.`,
    consequence: value ? 'Customer capabilities update now.' : 'Current orders are not cancelled or refunded automatically.',
    confirm: value ? `TURN ON ${label.toUpperCase()}` : `PAUSE ${label.toUpperCase()}`,
    run: () => actions.config.mutate({ [key]: value }),
  })
  const setMode = (mode: AcceptanceMode) => onConfirm({
    title: `Use ${mode} acceptance?`, body: mode === 'AUTO' ? 'Safe paid orders will enter the kitchen automatically.' : mode === 'HYBRID' ? 'Safe paid orders auto-accept; exceptions wait for you.' : 'Every paid order waits for founder acceptance.',
    consequence: 'This affects new paid orders only. Existing orders keep their current acceptance state.', confirm: `USE ${mode}`, run: () => actions.config.mutate({ acceptanceMode: mode }),
  })
  return <section className="owner-control-band">
    <div className="owner-store-state"><span className={config.isOpen ? 'live-dot' : 'live-dot off'} /><div><small>STORE STATUS</small><strong>{config.isOpen ? 'Accepting orders' : 'Paused'}</strong></div><Switch checked={config.isOpen} onChange={(value) => askToggle('isOpen', value, 'store')} label="" /></div>
    <div className="owner-mode-block"><small>ACCEPTANCE MODE</small><div className="owner-mode-select">{(['AUTO', 'HYBRID', 'MANUAL'] as const).map((mode) => <button type="button" key={mode} className={config.acceptanceMode === mode ? 'active' : ''} onClick={() => setMode(mode)}>{mode}</button>)}</div></div>
    <div className="owner-service-toggles"><Switch checked={config.deliveryEnabled} onChange={(value) => askToggle('deliveryEnabled', value, 'Delivery')} label="Delivery" /><Switch checked={config.pickupEnabled} onChange={(value) => askToggle('pickupEnabled', value, 'Pickup')} label="Pickup" /><Switch checked={config.storeOrderingEnabled} onChange={(value) => askToggle('storeOrderingEnabled', value, 'In-store')} label="In-store" /></div>
  </section>
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) { return <article className="owner-kpi"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article> }

function AttentionList({ onOrder, onSupport }: { onOrder: (orderId: string) => void; onSupport: () => void }) {
  const attention = useOwnerAttention()
  if (attention.isPending) return <div className="owner-list-skeleton"><Skeleton /><Skeleton /></div>
  if (attention.isError) return <ErrorState retry={() => attention.refetch()} />
  if (!attention.data?.length) return <div className="owner-empty"><PackageCheck /><strong>Everything routine is automated.</strong><span>No unresolved exception needs you.</span></div>
  return <div className="owner-attention-list">{attention.data.map((item) => <article key={item.id}>
    <div className={`owner-severity ${item.severity.toLowerCase()}`}><AlertTriangle /> {item.severity}</div>
    <div><span>{cleanStatus(item.type)}</span><h3>{item.title}</h3><p>{item.summary}</p><small><strong>SYSTEM SUGGESTS</strong> {item.suggestedAction}</small></div>
    <button type="button" onClick={() => item.type === 'COMPLAINT' ? onSupport() : item.orderId ? onOrder(item.orderId) : undefined}>OPEN <ArrowRight /></button>
  </article>)}</div>
}

function KitchenHealth({ data }: { data: NonNullable<ReturnType<typeof useOwnerDashboard>['data']>['kitchen'] }) {
  return <article className="owner-kitchen-card"><div className="owner-section-title"><div><span>KITCHEN HEALTH</span><h2>What the kitchen can promise</h2></div><span className={data.kdsOnline ? 'owner-online' : 'owner-offline'}>{data.kdsOnline ? 'KDS ONLINE' : 'KDS OFFLINE'}</span></div>
    <div className="owner-load"><div className="owner-load-ring" style={{ '--load': `${data.loadPercent * 3.6}deg` } as CSSProperties}><strong>{data.loadPercent}%</strong><span>LOAD</span></div><div><span>Next capacity</span><strong>{data.nextCapacityAt}</strong><small>{data.ordersAtRisk} orders at risk · {data.delayedOrders} delayed</small></div></div>
    <div className="owner-health-stats"><span><strong>{data.averagePrepMinutes}m</strong> avg prep</span><span><strong>{data.etaAccuracyPercent}%</strong> ETA accuracy</span></div>
  </article>
}

function DeliveryWatch({ onOrder }: { onOrder: (orderId: string) => void }) {
  const orders = useOwnerOrders()
  const deliveries = (orders.data ?? []).filter(isTrackableDelivery).slice(0, 4)
  return <section className="owner-delivery-watch">
    <div className="owner-section-title"><div><span>DELIVERY WATCH</span><h2>Promises beyond the kitchen</h2></div><span className="owner-live-badge"><i /> LIVE</span></div>
    <p className="owner-delivery-intro">The system watches preparation impact, rider handoff and customer ETA. Only a meaningful delay becomes an exception.</p>
    {orders.isPending ? <Skeleton /> : deliveries.length ? <div className="owner-delivery-list">{deliveries.map((order) => {
      const watch = getFounderDeliveryWatch(order)
      const promise = order.promisedAt ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(order.promisedAt)) : 'Updating'
      return <button type="button" key={order.id} onClick={() => onOrder(order.id)}>
        <span className={`owner-delivery-icon ${watch.level.toLowerCase()}`}><Truck /></span>
        <span><small>{order.publicOrderNumber} · DELIVERY</small><strong>{watch.label}</strong><em>{watch.detail}</em></span>
        <span><small>CUSTOMER PROMISE</small><strong>{promise}</strong><ArrowRight /></span>
      </button>
    })}</div> : <div className="owner-empty"><PackageCheck /><strong>No active deliveries</strong><span>New rider handoffs will appear here automatically.</span></div>}
  </section>
}

function Dashboard({ onConfirm, onOrder, onSupport, onLive, onAvailability, onCustomer }: { onConfirm: (a: ConfirmAction) => void; onOrder: (id: string) => void; onSupport: () => void; onLive: (key: string) => void; onAvailability: () => void; onCustomer: () => void }) {
  const dashboard = useOwnerDashboard()
  if (dashboard.isPending) return <div className="owner-dashboard-loading"><Skeleton /><Skeleton /><Skeleton /></div>
  if (dashboard.isError || !dashboard.data) return <ErrorState retry={() => dashboard.refetch()} />
  const data = dashboard.data
  const live = [['Awaiting Review', data.live.awaitingReview, 'AWAITING_REVIEW'], ['Preparing', data.live.preparing, 'PREPARING'], ['Ready', data.live.ready, 'READY'], ['Delivery Active', data.live.deliveryActive, 'DELIVERY_ACTIVE'], ['Pickup Active', data.live.pickupActive, 'PICKUP_ACTIVE']] as const
  return <><StoreControls config={data.store} onConfirm={onConfirm} /><section className="owner-kpi-grid">{data.kpis.map((kpi) => <MetricCard key={kpi.label} {...kpi} />)}</section>
    <section className="owner-live-strip"><div className="owner-section-title"><div><span>LIVE OPERATIONS</span><h2>The floor, right now</h2></div><small>Counts open in context—no dashboard maze.</small></div><div>{live.map(([label, count, key]) => <button type="button" key={label} onClick={() => onLive(key)}><strong>{count}</strong><span>{label}</span><ArrowRight /></button>)}</div></section>
    <div className="owner-dashboard-grid"><section className="owner-attention"><div className="owner-section-title"><div><span>NEEDS YOUR ATTENTION</span><h2>Only the exceptions</h2></div><span className="owner-count-badge">UNRESOLVED</span></div><AttentionList onOrder={onOrder} onSupport={onSupport} /></section><KitchenHealth data={data.kitchen} /></div>
    <DeliveryWatch onOrder={onOrder} />
    <section className="owner-snapshot-grid">
      <article><div className="owner-section-title"><div><span>CUSTOMER GROWTH</span><h2>Retention pulse</h2></div><UsersRound /></div><div className="owner-mini-metrics"><span><strong>{data.growth.newCustomers}</strong> New</span><span><strong>{data.growth.returningCustomers}</strong> Returning</span><span><strong>{data.growth.reactivatedCustomers}</strong> Reactivated</span><span><strong>{data.growth.secondOrderPending}</strong> Need order #2</span></div><button type="button" onClick={onCustomer}>SEARCH CUSTOMERS <ArrowRight /></button></article>
      <article><div className="owner-section-title"><div><span>WAVE LOYALTY</span><h2>Wallet health</h2></div><WalletCards /></div><div className="owner-tier-counts"><span>M {data.loyalty.member}</span><span>S {data.loyalty.silver}</span><span>G {data.loyalty.gold}</span><span>P {data.loyalty.platinum}</span></div><p><strong>{data.loyalty.pointsIssued}</strong> issued · <strong>{data.loyalty.pointsRedeemed}</strong> redeemed · <strong>{data.loyalty.pointsPending}</strong> pending</p></article>
      <article className="owner-availability-promo"><div className="owner-section-title"><div><span>AVAILABILITY</span><h2>Menu control</h2></div><Menu /></div><p>Owner policy overrides chef temporary status. Control products, variants and modifiers by service mode.</p><button type="button" onClick={onAvailability}>OPEN QUICK DRAWER <ArrowRight /></button></article>
    </section></>
}

function OrderDrawer({ order, onClose }: { order?: Order; onClose: () => void }) {
  const actions = useOwnerActions(); const [mode, setMode] = useState<'NONE' | 'ACCEPT' | 'REJECT'>('NONE'); const [reason, setReason] = useState('Kitchen capacity cannot safely meet the promise'); const review = order?.acceptanceStatus === 'REVIEW_REQUIRED'
  return <Drawer open={Boolean(order)} onClose={onClose} title={order ? `${order.publicOrderNumber} · ${review ? 'PAID REVIEW' : cleanStatus(order.fulfillmentStatus)}` : 'Order'}>{order && <div className="owner-drawer-body">
    <div className="owner-paid-banner"><ShieldCheck /><span><strong>{formatMoney(order.financialSnapshot.total)} PAID</strong><small>Backend-confirmed · customer funds received</small></span></div>
    <div className="owner-order-facts"><span><small>FULFILLMENT</small><strong>{order.fulfillmentType}</strong></span><span><small>CUSTOMER</small><strong>{order.customerId === 'CUST001' ? 'Priyanshu · Gold' : order.customerId}</strong></span><span><small>KITCHEN LOAD</small><strong>{review ? '94%' : 'Live'}</strong></span><span><small>PROMISE</small><strong>{review ? '58 min' : `${order.effectivePrepMinutes} min`}</strong></span></div>
    <section><span className="owner-eyebrow">ORDER</span>{order.items.map((item) => <div className="owner-order-item" key={item.productId}><span>{item.quantity}× {item.name}</span><strong>{formatMoney(item.quantity * item.unitPrice)}</strong></div>)}</section>
    {review && mode === 'NONE' && <><div className="owner-recommendation"><Command /><div><strong>System recommendation</strong><p>Accept only if the team can protect the 58-minute delivery promise. Rejection prevents kitchen entry and starts a full refund.</p></div></div><div className="owner-drawer-actions"><PrimaryButton onClick={() => setMode('ACCEPT')}>ACCEPT ANYWAY</PrimaryButton><SecondaryButton onClick={() => setMode('REJECT')}>REJECT & REFUND</SecondaryButton></div></>}
    {mode === 'ACCEPT' && <div className="owner-decision-box"><h3>Accept this paid order?</h3><p>Expected load remains high. The system will schedule the order, send it to KDS and update the customer’s promise.</p><strong>Consequence: the kitchen owns the 58-minute commitment.</strong><div><SecondaryButton onClick={() => setMode('NONE')}>GO BACK</SecondaryButton><PrimaryButton disabled={actions.accept.isPending} onClick={() => actions.accept.mutate(order.id, { onSuccess: onClose })}>ACCEPT & SCHEDULE</PrimaryButton></div></div>}
    {mode === 'REJECT' && <div className="owner-decision-box danger"><h3>Reject money already received?</h3><p>The order will never enter KDS. A refund starts, the customer is notified, and CRM/audit context is retained.</p><label className="owner-select-field"><span>Reason</span><select value={reason} onChange={(event) => setReason(event.target.value)}><option>Kitchen capacity cannot safely meet the promise</option><option>Delivery is not serviceable</option><option>Item became unavailable after payment</option><option>KDS is offline</option></select></label><div><SecondaryButton onClick={() => setMode('NONE')}>KEEP ORDER</SecondaryButton><PrimaryButton disabled={actions.reject.isPending} onClick={() => actions.reject.mutate({ orderId: order.id, reason }, { onSuccess: onClose })}>REJECT & START REFUND</PrimaryButton></div></div>}
  </div>}</Drawer>
}

function LiveOrdersDrawer({ status, onClose, onOpenOrder }: { status?: string; onClose: () => void; onOpenOrder: (id: string) => void }) {
  const orders = useOwnerOrders(); const rows = (orders.data ?? []).filter((order) => {
    if (status === 'AWAITING_REVIEW') return order.acceptanceStatus === 'REVIEW_REQUIRED'
    if (status === 'DELIVERY_ACTIVE') return order.fulfillmentType === 'DELIVERY' && ['SCHEDULED', 'PREP_DUE', 'PREPARING', 'READY', 'DISPATCHED'].includes(order.fulfillmentStatus)
    if (status === 'PICKUP_ACTIVE') return order.fulfillmentType === 'PICKUP' && ['SCHEDULED', 'PREP_DUE', 'PREPARING', 'READY'].includes(order.fulfillmentStatus)
    return order.fulfillmentStatus === status
  })
  return <Drawer open={Boolean(status)} onClose={onClose} title={cleanStatus(status ?? 'LIVE ORDERS')}><div className="owner-drawer-body">{orders.isPending ? <Skeleton /> : rows.length ? rows.map((order) => <button type="button" className="owner-live-order-row" key={order.id} onClick={() => onOpenOrder(order.id)}><span><strong>{order.publicOrderNumber}</strong><small>{order.fulfillmentType} · {order.items.length} items</small></span><span><strong>{order.effectivePrepMinutes} min</strong><small>{cleanStatus(order.fulfillmentStatus)}{order.chefOverrideMinutes ? ' · CHEF OVERRIDE' : ''}</small></span><ArrowRight /></button>) : <div className="owner-empty"><PackageCheck /><strong>No orders in this state</strong><span>The count updates from the mock source of truth.</span></div>}</div></Drawer>
}

function AvailabilityDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const menu = useQuery({ queryKey: ['catalog', 'owner-menu'], queryFn: getMenu }); const availability = useOwnerAvailability(); const actions = useOwnerActions(); const [query, setQuery] = useState('')
  const products = (menu.data?.products ?? []).filter((product) => product.name.toLowerCase().includes(query.toLowerCase()))
  return <Drawer open={open} onClose={onClose} title="AVAILABILITY CONTROL"><div className="owner-drawer-body"><p className="owner-drawer-intro">Owner policy is highest authority. A chef’s temporary status remains visible but cannot override <strong>OWNER_DISABLED</strong>.</p><label className="owner-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product, variant or modifier" /></label>
    {menu.isPending || availability.isPending ? <Skeleton /> : <div className="owner-availability-list">{products.map((product) => {
      const records = availability.data?.filter((row) => row.entityId === product.id) ?? []; const owner = records.find((row) => row.source === 'OWNER'); const chef = records.find((row) => row.source === 'CHEF'); const enabled = owner?.status !== 'OWNER_DISABLED'
      const chefMinutes = chef?.expiresAt ? Math.max(1, Math.round((new Date(chef.expiresAt).getTime() - new Date(chef.startsAt).getTime()) / 60_000)) : undefined
      return <article key={product.id}><div><strong>{product.name}</strong><span>{product.category} · {formatMoney(product.price)}</span></div><div className="owner-availability-status">{owner?.status === 'OWNER_DISABLED' && <b>OWNER_DISABLED</b>}{chef && <em>Chef unavailable — {chefMinutes ? `${chefMinutes} min` : 'until enabled'}</em>}</div><Switch checked={enabled} label="Available" onChange={(value) => actions.availability.mutate({ entityId: product.id, entityType: 'PRODUCT', available: value, reason: value ? 'Owner restored availability' : 'Owner paused from control center' })} />
        {product.modifierGroups?.flatMap((group) => group.options.slice(0, 2)).map((option) => { const optionOwner = availability.data?.find((row) => row.entityId === option.id && row.source === 'OWNER'); return <div className="owner-modifier-row" key={option.id}><span>{option.name}<small>Modifier · {option.groupId}</small></span><Switch checked={optionOwner?.status !== 'OWNER_DISABLED'} label="" onChange={(value) => actions.availability.mutate({ entityId: option.id, entityType: 'MODIFIER', available: value, reason: 'Owner modifier control' })} /></div> })}
      </article>
    })}</div>}
  </div></Drawer>
}

function CustomerSection({ onOpen }: { onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('Priyanshu'); const search = useOwnerCustomerSearch(query)
  return <section className="owner-page-section"><div className="owner-section-hero"><span>CUSTOMER 360</span><h2>Know the person, not just the ticket.</h2><p>Search by name, verified phone or order ID. Identity stays unified across Delivery, Pickup and Store.</p></div><label className="owner-search owner-search-large"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, phone or order ID" /><kbd>⌘ K</kbd></label><div className="owner-customer-results">{search.isPending ? <Skeleton /> : search.data?.map((customer) => <button type="button" key={customer.id} onClick={() => onOpen(customer.id)}><span className="owner-avatar">{customer.firstName[0]}</span><span><strong>{customer.firstName}</strong><small>{customer.phone.replace(/(\+91)(\d{2})\d{6}(\d{2})/, '$1 $2••••••$3')} · {customer.stats.lifetimeOrders} orders</small></span><TierPill>{customer.tier} WAVE</TierPill><span><strong>{formatMoney(customer.stats.lifetimeValue)}</strong><small>LTV</small></span><ArrowRight /></button>)}</div></section>
}

function CustomerDrawer({ customerId, onClose }: { customerId?: string; onClose: () => void }) {
  const detail = useOwnerCustomer(customerId); const actions = useOwnerActions(); const [showPoints, setShowPoints] = useState(false); const [direction, setDirection] = useState<'ADD' | 'REMOVE'>('ADD'); const [amount, setAmount] = useState(25); const [reason, setReason] = useState('Service recovery'); const [note, setNote] = useState(''); const data = detail.data
  return <Drawer open={Boolean(customerId)} onClose={onClose} title="CUSTOMER 360">{detail.isPending ? <Skeleton /> : data && <div className="owner-drawer-body">
    <div className="owner-customer-head"><span className="owner-avatar large">{data.customer.firstName[0]}</span><div><h3>{data.customer.firstName}</h3><p>{data.customer.phone.replace(/(\+91)(\d{2})\d{6}(\d{2})/, '$1 $2••••••$3')} · {data.customer.customerStage}</p></div><TierPill>{data.customer.tier} WAVE</TierPill></div>
    <div className="owner-wallet-grid"><span><small>AVAILABLE</small><strong>{data.customer.pointsAvailable} pts</strong></span><span><small>PENDING</small><strong>{data.customer.pointsPending} pts</strong></span><span><small>EXPIRING</small><strong>{data.pointsExpiring} pts</strong></span></div>
    <div className="owner-progress-card"><div><span>PLATINUM PROGRESS</span><strong>{data.customer.stats.rolling120Orders} / 10 orders</strong></div><div className="owner-progress"><i style={{ width: `${Math.min(100, data.customer.stats.rolling120Orders * 10)}%` }} /></div><p>{Math.max(0, 10 - data.customer.stats.rolling120Orders)} orders + {formatMoney(Math.max(0, 4500 - data.customer.stats.rolling120EligibleSpend))} to Platinum</p></div>
    <div className="owner-customer-stats"><span><strong>{data.customer.stats.lifetimeOrders}</strong> lifetime orders</span><span><strong>{formatMoney(data.customer.stats.lifetimeValue)}</strong> LTV</span><span><strong>{formatMoney(data.customer.stats.averageOrderValue)}</strong> AOV</span></div><div className="owner-source-split"><span>Delivery {data.sourceSplit.delivery}%</span><span>Pickup {data.sourceSplit.pickup}%</span><span>Store {data.sourceSplit.store}%</span></div><div className="owner-tags">{data.customer.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    <SecondaryButton onClick={() => setShowPoints(!showPoints)}><HeartHandshake /> ADJUST GOODWILL POINTS</SecondaryButton>
    {showPoints && <div className="owner-points-form"><div className="owner-mode-select"><button className={direction === 'ADD' ? 'active' : ''} onClick={() => setDirection('ADD')}>ADD</button><button className={direction === 'REMOVE' ? 'active' : ''} onClick={() => setDirection('REMOVE')}>REMOVE</button></div><TextInput label="Points amount" type="number" min={1} value={amount} onChange={(event) => setAmount(Number(event.target.value))} /><TextInput label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} /><TextInput label="Internal note" value={note} onChange={(event) => setNote(event.target.value)} /><p>Tier is derived and cannot be manually assigned. This creates a permanent audit record.</p><PrimaryButton disabled={actions.points.isPending} onClick={() => actions.points.mutate({ customerId: data.customer.id, input: { direction, amount, reason, note } }, { onSuccess: () => setShowPoints(false) })}>SAVE AUDITED ADJUSTMENT</PrimaryButton></div>}
    <section><span className="owner-eyebrow">UNIFIED TIMELINE</span><div className="owner-timeline">{data.timeline.slice(0, 12).map((item) => <article key={item.id}><i /><div><strong>{item.title}</strong><span>{item.detail}</span><small>{new Date(item.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small></div></article>)}</div></section>
  </div>}</Drawer>
}

function SupportSection() {
  const support = useOwnerSupport(); const actions = useOwnerActions(); const [filter, setFilter] = useState('Needs Me'); const [selected, setSelected] = useState<string>(); const [refundOpen, setRefundOpen] = useState(false); const [refundAmount, setRefundAmount] = useState(129); const [message, setMessage] = useState('We’re sorry this item was missed. I’ve taken care of this personally.')
  const rows = (support.data ?? []).filter((item) => (filter === 'All') || (filter === 'Needs Me' ? !['CLOSED', 'RESOLVED'].includes(item.supportCase.status) : filter === 'Complaints' ? item.supportCase.category !== 'PAYMENT' : filter === 'Refunds' ? Boolean(item.supportCase.refundId) : filter === 'Questions' ? item.supportCase.category === 'OTHER' : true)); const active = rows.find((item) => item.supportCase.id === selected) ?? rows[0]
  return <section className="owner-page-section"><div className="owner-section-hero"><span>UNIFIED SUPPORT INBOX</span><h2>One thread. Full context. One decision.</h2><p>Complaints, cancellations, refunds and questions share customer, order and loyalty context.</p></div><div className="owner-filter-row">{['Needs Me', 'Complaints', 'Cancellations', 'Refunds', 'Questions', 'All'].map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div>
    {support.isPending ? <Skeleton /> : active ? <div className="owner-support-workspace"><div className="owner-case-list">{rows.map((item) => <button className={active.supportCase.id === item.supportCase.id ? 'active' : ''} key={item.supportCase.id} onClick={() => setSelected(item.supportCase.id)}><span>{cleanStatus(item.supportCase.category)}</span><strong>{item.customer.firstName}</strong><p>{item.supportCase.description}</p><small>{cleanStatus(item.supportCase.status)}</small></button>)}</div><article className="owner-thread"><div className="owner-thread-head"><div><span>{active.supportCase.id}</span><h3>{cleanStatus(active.supportCase.category)}</h3></div><TierPill>{active.customer.tier} · {active.customer.pointsAvailable} PTS</TierPill></div><div className="owner-thread-context"><span><small>ORDER</small><strong>{active.order?.publicOrderNumber ?? 'No order'}</strong></span><span><small>PAYMENT</small><strong>{active.order?.paymentStatus ?? '—'}</strong></span><span><small>VALUE</small><strong>{active.order ? formatMoney(active.order.financialSnapshot.total) : '—'}</strong></span></div><div className="owner-messages">{active.messages.map((entry) => <div className={entry.from.toLowerCase()} key={entry.id}><small>{entry.from}</small><p>{entry.text}</p></div>)}</div><TextInput label="Founder reply" value={message} onChange={(event) => setMessage(event.target.value)} /><div className="owner-support-actions"><PrimaryButton onClick={() => setRefundOpen(true)}>REFUND ITEM</PrimaryButton><SecondaryButton onClick={() => actions.support.mutate({ caseId: active.supportCase.id, input: { action: 'REPLACEMENT', message: 'We can prepare a replacement for you.' } })}>REPLACEMENT</SecondaryButton><SecondaryButton onClick={() => actions.support.mutate({ caseId: active.supportCase.id, input: { action: 'ANSWER', message } })}>ANSWER</SecondaryButton><button onClick={() => actions.support.mutate({ caseId: active.supportCase.id, input: { action: 'CLOSE', message } })}>Close case</button></div></article><aside className="owner-case-context"><span>CUSTOMER CONTEXT</span><h3>{active.customer.firstName}</h3><p>{active.customer.stats.lifetimeOrders} orders · {formatMoney(active.customer.stats.lifetimeValue)} LTV</p><div className="owner-tags">{active.customer.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><strong>Suggested resolution</strong><p>Missing item: verify linked order and offer item refund or replacement. Keep one clear customer update.</p></aside></div> : <div className="owner-empty"><PackageCheck /><strong>No cases in this filter</strong><span>Resolved work stays out of the founder queue.</span></div>}
    <CenterDialog open={refundOpen} onClose={() => setRefundOpen(false)} title="REFUND THIS ITEM?">{active && <div className="owner-confirm-content"><p>This is a simulated PhonePe refund against {active.order?.publicOrderNumber}. The customer thread, financial state, points and audit history update together.</p><TextInput label="Refund amount" type="number" min={1} max={active.order?.financialSnapshot.total} value={refundAmount} onChange={(event) => setRefundAmount(Number(event.target.value))} /><div className="owner-warning"><AlertTriangle /> No real money moves in this prototype.</div><div><SecondaryButton onClick={() => setRefundOpen(false)}>CANCEL</SecondaryButton><PrimaryButton onClick={() => actions.support.mutate({ caseId: active.supportCase.id, input: { action: 'REFUND_ITEM', amount: refundAmount, message } }, { onSuccess: () => setRefundOpen(false) })}>ISSUE DEMO REFUND</PrimaryButton></div></div>}</CenterDialog>
  </section>
}

function GrowthSection() {
  const opportunities = useOwnerOpportunities(); const actions = useOwnerActions(); const [selected, setSelected] = useState<CrmOpportunity>();
  const [whatsAppOpen, setWhatsAppOpen] = useState(false); const [messageType, setMessageType] = useState<WhatsAppMessageType>('ORDER_CONFIRMATION')
  const [channel, setChannel] = useState<CampaignChannel>('WHATSAPP_SIM'); const [timing, setTiming] = useState<CampaignTiming>('TONIGHT_7PM');
  const [offer, setOffer] = useState(''); const [message, setMessage] = useState('')
  const open = (item: CrmOpportunity) => { setSelected(item); setChannel(item.suggestedChannel); setTiming(item.suggestedTiming); setOffer(item.offer); setMessage(item.message); actions.previewCampaign.reset(); actions.simulateCampaign.reset() }
  const input = selected ? { opportunityId: selected.id, channel, timing, offer, message } : undefined
  const estimate = actions.previewCampaign.data
  const messageTypes: Array<{ id: WhatsAppMessageType; label: string }> = [
    { id: 'ORDER_CONFIRMATION', label: 'Order confirmation' }, { id: 'DELAY', label: 'Delay' }, { id: 'READY_FOR_PICKUP', label: 'Ready for pickup' },
    { id: 'ON_THE_WAY', label: 'On the way' }, { id: 'POINTS_EARNED', label: 'Points earned' }, { id: 'BIRTHDAY', label: 'Birthday' },
    { id: 'REORDER', label: 'Reorder' }, { id: 'REFUND', label: 'Refund' }, { id: 'SUPPORT', label: 'Support' },
  ]
  return <section className="owner-page-section"><div className="owner-section-hero"><span>CRM OPPORTUNITIES</span><h2>Turn signals into the next visit.</h2><p>Derived segments become lightweight, reviewable simulations—not a sprawling marketing suite.</p></div>
    <div className="owner-opportunity-grid">{opportunities.isPending ? <Skeleton /> : opportunities.data?.map((item) => <article key={item.id}><span>{item.label}</span><strong>{item.customerCount}</strong><small>ESTIMATED AUDIENCE</small><h3>{item.title}</h3><p>{item.insight}</p><div><small>RECOMMENDED OFFER</small><q>{item.offer}</q></div><SecondaryButton onClick={() => open(item)}>PREVIEW CAMPAIGN</SecondaryButton></article>)}</div>
    <section className="whatsapp-lab-card"><div><span>WHATSAPP SIMULATION LAB</span><h2>Nine moments. One customer thread.</h2><p>Preview order, service and retention messages using live demo facts. Nothing leaves this browser.</p></div><div className="whatsapp-type-cloud">{messageTypes.map((item) => <span key={item.id}>{item.label}</span>)}</div><PrimaryButton onClick={() => { actions.simulateWhatsApp.reset(); setWhatsAppOpen(true) }}>OPEN SIMULATOR</PrimaryButton></section>
    <Drawer open={Boolean(selected)} onClose={() => setSelected(undefined)} title="CAMPAIGN PREVIEW">{selected && <div className="owner-drawer-body campaign-drawer">
      <div className="campaign-demo-flag"><ShieldCheck /><span><strong>INTERNAL SIMULATION</strong><small>No real WhatsApp, push or customer send occurs.</small></span></div>
      <section><span>AUDIENCE</span><h3>{selected.title}</h3><p>{selected.customerCount} estimated customers · {selected.derivedCustomerIds.length} currently matched demo profiles</p></section>
      <label className="owner-select-field"><span>OFFER</span><input value={offer} onChange={(event) => setOffer(event.target.value)} /></label>
      <fieldset className="campaign-channel"><legend>CHANNEL</legend>{(['IN_APP', 'WHATSAPP_SIM', 'PUSH_SIM'] as const).map((value) => <button type="button" className={channel === value ? 'active' : ''} onClick={() => { setChannel(value); actions.previewCampaign.reset() }} key={value}>{value === 'IN_APP' ? 'In-App' : value === 'WHATSAPP_SIM' ? 'WhatsApp Simulation' : 'Push Simulation'}</button>)}</fieldset>
      <label className="owner-select-field"><span>TIMING</span><select value={timing} onChange={(event) => { setTiming(event.target.value as CampaignTiming); actions.previewCampaign.reset() }}><option value="NOW">Now</option><option value="TONIGHT_7PM">Tonight · 7 PM</option><option value="TOMORROW_11AM">Tomorrow · 11 AM</option></select></label>
      <label className="campaign-message"><span>MESSAGE</span><textarea rows={5} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
      <div className="campaign-phone-preview"><small>{channel === 'WHATSAPP_SIM' ? 'WHATSAPP SIMULATION' : channel === 'PUSH_SIM' ? 'PUSH SIMULATION' : 'IN-APP PREVIEW'}</small><p>{message}</p><strong>{offer}</strong><em>THE PIZZA WAVE · DEMO</em></div>
      <div className="campaign-estimates"><span><small>AUDIENCE</small><strong>{estimate?.estimatedAudience ?? selected.customerCount}</strong></span><span><small>EST. COST</small><strong>₹{estimate?.estimatedCost ?? selected.estimatedCost}</strong></span><span><small>FAKE CONVERSION</small><strong>{estimate?.estimatedConversions ?? selected.estimatedConversions}</strong></span></div>
      {actions.simulateCampaign.isSuccess && <div className="campaign-success"><PackageCheck /><span><strong>Simulation recorded</strong><small>Open customer Support to see it in the same conversation history.</small></span></div>}
      <div className="owner-drawer-actions"><SecondaryButton disabled={!input || actions.previewCampaign.isPending} onClick={() => input && actions.previewCampaign.mutate(input)}>REFRESH ESTIMATE</SecondaryButton><PrimaryButton disabled={!input || !message.trim() || !offer.trim() || actions.simulateCampaign.isPending} onClick={() => input && actions.simulateCampaign.mutate(input)}>{actions.simulateCampaign.isPending ? 'SIMULATING…' : 'RUN SIMULATION'}</PrimaryButton></div>
    </div>}</Drawer>
    <Drawer open={whatsAppOpen} onClose={() => setWhatsAppOpen(false)} title="WHATSAPP SIMULATION"><div className="owner-drawer-body whatsapp-simulator"><div className="campaign-demo-flag"><ShieldCheck /><span><strong>INTERNAL / DEMO ONLY</strong><small>Uses backend facts and stores the result in the shared conversation.</small></span></div><label className="owner-select-field"><span>MESSAGE TYPE</span><select value={messageType} onChange={(event) => { setMessageType(event.target.value as WhatsAppMessageType); actions.simulateWhatsApp.reset() }}>{messageTypes.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label><div className="campaign-phone-preview"><small>WHATSAPP SIMULATION · THE PIZZA WAVE</small><p>{actions.simulateWhatsApp.data?.text ?? 'Choose a message type, then generate a backend-shaped preview using Priyanshu’s live demo context.'}</p><em>{actions.simulateWhatsApp.data ? 'Recorded in the same In-App support conversation' : 'No real message will be sent'}</em></div><PrimaryButton disabled={actions.simulateWhatsApp.isPending} onClick={() => actions.simulateWhatsApp.mutate(messageType)}>{actions.simulateWhatsApp.isPending ? 'GENERATING…' : actions.simulateWhatsApp.isSuccess ? 'GENERATE AGAIN' : 'GENERATE & ADD TO SHARED THREAD'}</PrimaryButton></div></Drawer>
  </section>
}

function ConfigSection({ onConfirm }: { onConfirm: (action: ConfirmAction) => void }) {
  const dashboard = useOwnerDashboard(); const actions = useOwnerActions(); const [draft, setDraft] = useState<Partial<StoreConfig>>({}); if (!dashboard.data) return <Skeleton />; const config = { ...dashboard.data.store, ...draft }
  const numberField = (label: string, key: 'maxDeliveryWaitMinutes' | 'maxPickupWaitMinutes' | 'kitchenCapacityCount' | 'deliveryFeeFlat') => <TextInput label={label} type="number" min={0} value={config[key]} onChange={(event) => setDraft((current) => ({ ...current, [key]: Number(event.target.value) }))} />
  return <section className="owner-page-section"><div className="owner-section-hero"><span>BUSINESS POLICY</span><h2>Configuration with consequences.</h2><p>Commercial rules stay in the API-backed store configuration, never inside screens.</p></div><div className="owner-config-grid"><article><span>FULFILLMENT PROMISES</span>{numberField('Max delivery wait (minutes)', 'maxDeliveryWaitMinutes')}{numberField('Max pickup wait (minutes)', 'maxPickupWaitMinutes')}{numberField('Flat delivery fee', 'deliveryFeeFlat')}</article><article><span>KITCHEN CAPACITY</span>{numberField('Concurrent capacity', 'kitchenCapacityCount')}<p>Capacity changes influence scheduling and whether HYBRID routes a paid order to review.</p></article><article><span>LOYALTY GUARDRAILS</span><div className="owner-readonly-rule"><strong>1 point = ₹1</strong><small>Frozen business rule</small></div><div className="owner-readonly-rule"><strong>Minimum 50 points</strong><small>Redemption threshold</small></div><div className="owner-readonly-rule"><strong>Maximum 20%</strong><small>Eligible food subtotal</small></div></article><article><span>ESCALATION DEFAULTS</span><div className="owner-readonly-rule"><strong>8 min</strong><small>Customer delay notice</small></div><div className="owner-readonly-rule"><strong>15 min</strong><small>Founder attention</small></div><div className="owner-readonly-rule"><strong>Food quality</strong><small>Always founder review</small></div></article></div><PrimaryButton disabled={!Object.keys(draft).length || actions.config.isPending} onClick={() => onConfirm({ title: 'Save business policy?', body: 'New quotes, promises and scheduling decisions will use these values.', consequence: 'Existing paid orders keep their immutable financial and timing snapshots.', confirm: 'SAVE POLICY', run: () => actions.config.mutate(draft, { onSuccess: () => setDraft({}) }) })}>REVIEW & SAVE CONFIGURATION</PrimaryButton></section>
}

function StoreOrderDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const menu = useQuery({ queryKey: ['catalog', 'store-order'], queryFn: getMenu }); const actions = useOwnerActions(); const [step, setStep] = useState(1); const [customerMode, setCustomerMode] = useState<'WAVE_ID' | 'PHONE_OTP' | 'GUEST'>('WAVE_ID'); const [phone, setPhone] = useState('9876543210'); const [otp, setOtp] = useState('123456'); const [productId, setProductId] = useState('PIZZA-PANEER-001'); const [quantity, setQuantity] = useState(1); const [result, setResult] = useState<Awaited<ReturnType<typeof actions.storeOrder.mutateAsync>>>(); const product = menu.data?.products.find((item) => item.id === productId); const total = (product?.price ?? 0) * quantity
  const reset = () => { setStep(1); setResult(undefined); onClose() }; const pay = async () => { const response = await actions.storeOrder.mutateAsync({ customerMode, customerId: customerMode === 'GUEST' ? undefined : 'CUST001', phone, otp: customerMode === 'PHONE_OTP' ? otp : undefined, productId, quantity }); setResult(response); setStep(5) }
  return <Drawer open={open} onClose={reset} title="NEW STORE ORDER"><div className="owner-drawer-body"><div className="owner-store-order-progress">{['CUSTOMER', 'ITEMS', 'QUOTE', 'PHONEPE', 'CONFIRMED'].map((label, index) => <span className={step >= index + 1 ? 'active' : ''} key={label}><i>{index + 1}</i>{label}</span>)}</div>
    {step === 1 && <section className="owner-flow-step"><span>1 · CUSTOMER</span><h3>Connect this visit</h3><div className="owner-choice-grid">{(['WAVE_ID', 'PHONE_OTP', 'GUEST'] as const).map((mode) => <button className={customerMode === mode ? 'active' : ''} onClick={() => setCustomerMode(mode)} key={mode}>{mode === 'WAVE_ID' ? 'Scan Wave ID' : mode === 'PHONE_OTP' ? 'Phone + OTP' : 'Guest'}<small>{mode === 'WAVE_ID' ? 'One-time token' : mode === 'PHONE_OTP' ? 'Verify before attach' : 'No profile linking'}</small></button>)}</div>{customerMode === 'PHONE_OTP' && <><TextInput label="Customer phone" value={phone} onChange={(event) => setPhone(event.target.value)} /><TextInput label="WhatsApp OTP" value={otp} onChange={(event) => setOtp(event.target.value)} /></>}{customerMode === 'WAVE_ID' && <div className="owner-wave-scan"><CircleUserRound /><span><strong>Priyanshu · Gold Wave</strong><small>Demo Wave ID scanned · temporary store session</small></span></div>}<PrimaryButton onClick={() => setStep(2)}>CONTINUE TO ITEMS</PrimaryButton></section>}
    {step === 2 && <section className="owner-flow-step"><span>2 · ITEMS</span><h3>Build the store order</h3><label className="owner-select-field"><span>Menu item</span><select value={productId} onChange={(event) => setProductId(event.target.value)}>{menu.data?.products.map((item) => <option value={item.id} key={item.id}>{item.name} · {formatMoney(item.price)}</option>)}</select></label><TextInput label="Quantity" type="number" min={1} max={10} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} /><div className="owner-drawer-actions"><SecondaryButton onClick={() => setStep(1)}>BACK</SecondaryButton><PrimaryButton onClick={() => setStep(3)}>GET SERVER QUOTE</PrimaryButton></div></section>}
    {step === 3 && <section className="owner-flow-step"><span>3 · QUOTE</span><h3>Review the bill</h3><div className="owner-bill"><span>{quantity}× {product?.name}<strong>{formatMoney(total)}</strong></span><span>Points preview<strong>+{Math.floor(total * .04)} pending</strong></span><b>Total <strong>{formatMoney(total)}</strong></b></div><p>Price and points are a server-shaped snapshot. The order does not exist yet.</p><div className="owner-drawer-actions"><SecondaryButton onClick={() => setStep(2)}>EDIT</SecondaryButton><PrimaryButton onClick={() => setStep(4)}>CONTINUE TO PHONEPE</PrimaryButton></div></section>}
    {step === 4 && <section className="owner-flow-step owner-phonepe"><span>4 · PHONEPE</span><div className="owner-phonepe-mark">पे</div><h3>Collect {formatMoney(total)}</h3><p>Believable demo payment flow. No real credentials or money movement.</p><div className="owner-paid-banner"><ShieldCheck /><span><strong>DEMO TERMINAL READY</strong><small>Order intent exists before payment confirmation</small></span></div><PrimaryButton disabled={actions.storeOrder.isPending} onClick={pay}>{actions.storeOrder.isPending ? 'CONFIRMING WITH MOCK BACKEND…' : 'PAY SUCCESS'}</PrimaryButton></section>}
    {step === 5 && result && <section className="owner-flow-step owner-confirmed-step"><PackageCheck /><span>5 · CONFIRMED</span><h3>Payment received.</h3><p>{result.order.publicOrderNumber} is {cleanStatus(result.acceptanceOutcome).toLowerCase()} under the same acceptance policy as every other channel.</p><div className="owner-bill"><span>Payment<strong>{result.paymentStatus}</strong></span><span>Fulfillment<strong>STORE</strong></span><b>Total<strong>{formatMoney(result.order.financialSnapshot.total)}</strong></b></div><PrimaryButton onClick={reset}>DONE</PrimaryButton></section>}
  </div></Drawer>
}

export default function OwnerPage() {
  const [session, setSession] = useState<BrowserOwnerSession | null>(() => ownerBrowserSession()); const [section, setSection] = useState<Section>('overview'); const [confirm, setConfirm] = useState<ConfirmAction>(); const [orderId, setOrderId] = useState<string>(); const [liveStatus, setLiveStatus] = useState<string>(); const [availability, setAvailability] = useState(false); const [customerId, setCustomerId] = useState<string>(); const [newOrder, setNewOrder] = useState(false)
  const queryClient = useQueryClient(); const dashboard = useOwnerDashboard(); const attention = useOwnerAttention(); const orders = useOwnerOrders(); const selectedOrder = useMemo(() => orders.data?.find((order) => order.id === orderId), [orders.data, orderId])
  if (!session) return <OwnerLogin onSuccess={setSession} />
  const signOut = () => { sessionStorage.removeItem(sessionKeys.owner); setSession(null); queryClient.removeQueries({ queryKey: ownerKeys.all }) }
  return <main className="owner-app"><SideNav active={section} onChange={setSection} onSignOut={signOut} /><div className="owner-workspace"><OwnerTopbar attentionCount={attention.data?.length ?? dashboard.data?.live.awaitingReview ?? 0} onNewOrder={() => setNewOrder(true)} /><div className="owner-content">{section === 'overview' && <Dashboard onConfirm={setConfirm} onOrder={setOrderId} onSupport={() => setSection('support')} onLive={setLiveStatus} onAvailability={() => setAvailability(true)} onCustomer={() => setSection('customers')} />}{section === 'customers' && <CustomerSection onOpen={setCustomerId} />}{section === 'support' && <SupportSection />}{section === 'growth' && <GrowthSection />}{section === 'config' && <ConfigSection onConfirm={setConfirm} />}</div></div>
    <CenterDialog open={Boolean(confirm)} onClose={() => setConfirm(undefined)} title={confirm?.title ?? 'Confirm'}>{confirm && <div className="owner-confirm-content"><p>{confirm.body}</p><div className="owner-warning"><AlertTriangle /> {confirm.consequence}</div><div><SecondaryButton onClick={() => setConfirm(undefined)}>GO BACK</SecondaryButton><PrimaryButton onClick={() => { confirm.run(); setConfirm(undefined) }}>{confirm.confirm}</PrimaryButton></div></div>}</CenterDialog>
    <OrderDrawer order={selectedOrder} onClose={() => setOrderId(undefined)} /><LiveOrdersDrawer status={liveStatus} onClose={() => setLiveStatus(undefined)} onOpenOrder={(id) => { setLiveStatus(undefined); setOrderId(id) }} /><AvailabilityDrawer open={availability} onClose={() => setAvailability(false)} /><CustomerDrawer customerId={customerId} onClose={() => setCustomerId(undefined)} /><StoreOrderDrawer open={newOrder} onClose={() => setNewOrder(false)} />
  </main>
}
