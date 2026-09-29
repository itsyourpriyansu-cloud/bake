import {
  AlertTriangle, ArrowRight, BarChart3, BellRing, CalendarDays, Check, ClipboardList, Clock3, Eye, Gift, ImageIcon,
  LayoutDashboard, LockKeyhole, LogOut, MoreHorizontal, Search, Settings2, Sparkles, UsersRound, Wifi,
} from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { buildFounderAttention, type FounderAttentionItem } from '../../../domain/bakery/attention.engine'
import { formatPromiseDistance, projectBakeryOrder } from '../../../domain/bakery/production.projection'
import type { BakeryBespokeRequest, BakeryOrder, BakeryProductionStatus } from '../../../domain/bakery/bakery.types'
import { useBakeryAdmin, useBakeryOperations } from '../../../features/bakery/useBakery'
import { BakeryLogo, BakeryStatePanel, useBakeryDialogFocus } from '../components/BakeryUi'
import { aggregateOwnerCustomers, buildCalendarStrip, computeGrowthSegments, ownerWeekdayLabel, productionHealthPercent, productionLoad } from './ownerMetrics'

const sessionKey = 'bakery-wave:session:owner'
type Section = 'today' | 'orders' | 'calendar' | 'requests' | 'customers' | 'growth' | 'settings'

gsap.registerPlugin(ScrollTrigger)

function readOwner() { return sessionStorage.getItem(sessionKey) === 'active' }

function OwnerLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('owner@bakerywave.demo')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (email === 'owner@bakerywave.demo' && password === 'BakeryWave@123' && code === '654321') { sessionStorage.setItem(sessionKey, 'active'); onSuccess() } else setError('Use the frozen bakery demo credentials shown below.')
  }
  return <main className="bakery-owner-login"><section><BakeryLogo /><span>GRAND ROAD · HYDERABAD</span><h1>RUN THE DAY.<br />PROTECT THE MOMENTS.</h1><p>Production, customer context and custom-cake decisions in one calm control room.</p></section><form onSubmit={submit}><LockKeyhole /><span className="bakery-kicker">FOUNDER CONTROL</span><h2>OWNER SIGN IN</h2><label><span>Email</span><input autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label><span>Password</span><input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><label><span>6-digit 2FA</span><input inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} /></label>{error && <p className="bakery-form-error" role="alert">{error}</p>}<button type="submit" className="bakery-button primary wide">ENTER CONTROL ROOM <ArrowRight /></button><small>owner@bakerywave.demo · BakeryWave@123 · 654321</small></form></main>
}

const settingsRows: Array<{ key: 'storeOrderingEnabled' | 'deliveryEnabled' | 'pickupEnabled'; label: string; detail: string }> = [
  { key: 'storeOrderingEnabled', label: 'Store ordering', detail: 'Allow new customer orders' },
  { key: 'deliveryEnabled', label: 'Delivery', detail: 'Offer delivery at checkout' },
  { key: 'pickupEnabled', label: 'Pickup', detail: 'Offer Grand Road pickup' },
]
const acceptanceCycle = ['HYBRID', 'ON', 'OFF'] as const
const navItems = [
  ['today', <LayoutDashboard />, 'Today'], ['orders', <ClipboardList />, 'Orders'], ['calendar', <CalendarDays />, 'Calendar'],
  ['requests', <ImageIcon />, 'References'], ['customers', <UsersRound />, 'Customers'], ['growth', <BarChart3 />, 'Growth'], ['settings', <Settings2 />, 'Settings'],
] as const

const sectionDescriptions: Record<Section, string> = {
  today: 'Resolve the exceptions that can change a customer promise.',
  orders: 'Search every order and open the full decision context.',
  calendar: 'Balance promised work against the bakery’s real capacity.',
  requests: 'Approve what can be replicated before a quote is released.',
  customers: 'Find customer value, preferences, and the next celebration.',
  growth: 'Turn useful customer signals into thoughtful follow-up.',
  settings: 'Control ordering modes and production capacity safely.',
}

function OwnerPanelHeader({ eyebrow, title, description, aside }: { eyebrow: string; title: string; description: string; aside?: ReactNode }) {
  return <div className="bakery-owner-panel-head"><div><span className="bakery-kicker">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{aside}</div>
}

function statusTone(status: BakeryProductionStatus) {
  if (status === 'AWAITING_ACCEPTANCE' || status === 'REJECTED') return 'risk'
  if (status === 'READY' || status === 'COMPLETED') return 'success'
  if (status === 'SCHEDULED') return 'planned'
  return 'active'
}

export default function BakeryOwnerPage() {
  const [loggedIn, setLoggedIn] = useState(readOwner)
  const [section, setSection] = useState<Section>('today')
  const [feedback, setFeedback] = useState('')
  const [decisionOrder, setDecisionOrder] = useState<BakeryOrder | null>(null)
  const [overlay, setOverlay] = useState<{ eyebrow: string; title: string; body: string } | null>(null)
  const [bespokeDialog, setBespokeDialog] = useState<BakeryBespokeRequest | null>(null)
  const [quoteAmount, setQuoteAmount] = useState('')
  const [referenceReviewNote, setReferenceReviewNote] = useState('')
  const [referenceFilter, setReferenceFilter] = useState<'ALL' | 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED'>('ALL')
  const [orderQuery, setOrderQuery] = useState('')
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'ATTENTION' | 'ACTIVE' | 'READY'>('ALL')
  const [customerQuery, setCustomerQuery] = useState('')
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const ownerMainRef = useRef<HTMLElement>(null)
  const admin = useBakeryAdmin()
  const operations = useBakeryOperations()
  const overlayRef = useBakeryDialogFocus<HTMLElement>(Boolean(overlay), () => setOverlay(null))
  const bespokeDialogRef = useBakeryDialogFocus<HTMLElement>(Boolean(bespokeDialog), () => setBespokeDialog(null))
  const decisionDialogRef = useBakeryDialogFocus<HTMLElement>(Boolean(decisionOrder), () => setDecisionOrder(null))
  const mobileMoreRef = useBakeryDialogFocus<HTMLElement>(mobileMoreOpen, () => setMobileMoreOpen(false))
  useLayoutEffect(() => {
    const main = ownerMainRef.current
    if (!loggedIn || !main || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const context = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>('[data-owner-reveal]', main)
      gsap.fromTo(panels, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .48, stagger: .055, ease: 'power2.out', clearProps: 'opacity,visibility,transform' })
      gsap.utils.toArray<HTMLElement>('[data-owner-scrub]', main).forEach((copy) => {
        gsap.fromTo(copy, { opacity: .46 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: copy, start: 'top 92%', end: 'top 68%', scrub: .35 } })
      })
    }, main)
    return () => context.revert()
  }, [loggedIn, section])
  if (!loggedIn) return <OwnerLogin onSuccess={() => setLoggedIn(true)} />
  if (admin.isLoading) return <main className="bakery-owner-login"><div className="bakery-loading-row">Opening Founder Control…</div></main>
  if (admin.isError) return <main className="bakery-owner-login"><BakeryStatePanel title="CONTROL ROOM DIDN’T LOAD" description="No bakery data was changed. Retry the local demo connection." actionLabel="TRY AGAIN" onAction={() => void admin.refetch()} /></main>

  const orders = Array.isArray(admin.data?.orders) ? admin.data.orders : []
  const requests = Array.isArray(admin.data?.requests) ? admin.data.requests : []
  const filteredRequests = requests.filter((request) => referenceFilter === 'ALL' || request.referenceApprovalStatus === referenceFilter)
  const savedDesigns = Array.isArray(admin.data?.savedDesigns) ? admin.data.savedDesigns : []
  const settings = admin.data?.settings ?? { storeOrderingEnabled: true, deliveryEnabled: true, pickupEnabled: true, safeAutoAcceptance: 'HYBRID' as const, productionCapacity: 8 }
  const liveOrders = orders.filter((order) => !['COMPLETED', 'REJECTED'].includes(order.productionStatus))
  const healthPercent = productionHealthPercent(orders)
  const load = productionLoad(orders, settings.productionCapacity)
  const attention = buildFounderAttention(orders, requests, settings.productionCapacity)
  const calendarDays = buildCalendarStrip(orders)
  const customers = aggregateOwnerCustomers(orders)
  const growth = computeGrowthSegments(orders, requests, savedDesigns)
  const filteredCustomers = customers.filter((customer) => `${customer.name} ${customer.phone} ${customer.favourite ?? ''}`.toLowerCase().includes(customerQuery.trim().toLowerCase()))
  const filteredOrders = orders.filter((order) => {
    const matchesQuery = `${order.publicNumber} ${order.customerName} ${order.items.map((item) => item.product?.name).join(' ')}`.toLowerCase().includes(orderQuery.toLowerCase())
    const matchesFilter = orderFilter === 'ALL'
      || (orderFilter === 'ATTENTION' && (order.productionStatus === 'AWAITING_ACCEPTANCE' || Boolean(order.note)))
      || (orderFilter === 'ACTIVE' && ['MIXING', 'BAKING', 'COOLING', 'DECORATING', 'PACKING'].includes(order.productionStatus))
      || (orderFilter === 'READY' && order.productionStatus === 'READY')
    return matchesQuery && matchesFilter
  })

  const move = (orderId: string, status: BakeryProductionStatus, message: string) => operations.status.mutate({ orderId, status }, { onSuccess: () => { setFeedback(message); setDecisionOrder(null) } })
  const openBespoke = (request: BakeryBespokeRequest) => { setBespokeDialog(request); setQuoteAmount(request.quoteAmount ? String(request.quoteAmount) : ''); setReferenceReviewNote(request.referenceReviewNote ?? '') }
  const reviewReference = (referenceApprovalStatus: 'APPROVED' | 'CHANGES_REQUESTED') => {
    if (!bespokeDialog?.referenceImage || (referenceApprovalStatus === 'CHANGES_REQUESTED' && !referenceReviewNote.trim())) return
    operations.bespokeStatus.mutate({ requestId: bespokeDialog.id, status: bespokeDialog.status === 'NEW' ? 'REVIEWING' : bespokeDialog.status, referenceApprovalStatus, referenceReviewNote: referenceReviewNote.trim(), referenceReviewedAt: new Date().toISOString() }, { onSuccess: (request) => { setBespokeDialog(request); setFeedback(referenceApprovalStatus === 'APPROVED' ? 'Reference approved for replication. Quoting is now unlocked.' : 'Changes requested. The review note is ready for the customer.') } })
  }
  const sendQuote = () => { if (!bespokeDialog) return; const amount = Number(quoteAmount); if (!amount || amount <= 0) return; operations.bespokeStatus.mutate({ requestId: bespokeDialog.id, status: 'QUOTED', quoteAmount: amount }, { onSuccess: () => { setBespokeDialog(null); setFeedback('Quote saved and marked ready for the customer.') } }) }
  const openAttention = (item: FounderAttentionItem) => {
    if (item.orderId) { setDecisionOrder(orders.find((order) => order.id === item.orderId) ?? null); return }
    if (item.requestId) { const request = requests.find((candidate) => candidate.id === item.requestId); if (request) openBespoke(request); return }
    setSection('calendar')
  }
  const activeDecisionProjection = decisionOrder ? projectBakeryOrder(decisionOrder) : null
  const selectSection = (nextSection: Section) => {
    setSection(nextSection)
    setMobileMoreOpen(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }
  const openDecisionInbox = () => {
    setSection('today')
    window.setTimeout(() => document.getElementById('owner-decision-inbox')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }), 0)
  }

  return <div className="bakery-owner">
    <aside><div className="bakery-owner-brand" aria-label="Bakery Wave founder workspace"><BakeryLogo /><span className="bakery-owner-realm"><LockKeyhole aria-hidden="true" /><span>Founder control</span></span></div><nav className="bakery-owner-desktop-nav" aria-label="Founder control navigation">{navItems.map(([id, icon, label]) => <button type="button" className={section === id ? 'active' : ''} aria-current={section === id ? 'page' : undefined} onClick={() => selectSection(id)} key={id}>{icon}<span>{label}</span></button>)}</nav><div className="bakery-owner-rail-footer"><Link to="/bakery/production/"><Wifi /> Production board <ArrowRight /></Link><button type="button" onClick={() => { sessionStorage.removeItem(sessionKey); setLoggedIn(false) }}><LogOut /> Sign out</button></div></aside>
    <nav className="bakery-owner-mobile-nav" aria-label="Founder mobile navigation">
      {navItems.slice(0, 4).map(([id, icon, label]) => <button type="button" className={section === id ? 'active' : ''} aria-current={section === id ? 'page' : undefined} onClick={() => selectSection(id)} key={id}>{icon}<span>{label}</span></button>)}
      <button type="button" className={['customers', 'growth', 'settings'].includes(section) ? 'active' : ''} aria-expanded={mobileMoreOpen} aria-haspopup="dialog" onClick={() => setMobileMoreOpen(true)}><MoreHorizontal /><span>More</span></button>
    </nav>
    <main ref={ownerMainRef}><header className="bakery-owner-top" data-owner-reveal><div><span>{ownerWeekdayLabel()} · GRAND ROAD</span><h1>{section === 'today' ? 'Good afternoon, founder.' : navItems.find(([id]) => id === section)?.[2]}</h1><p>{sectionDescriptions[section]}</p></div><div><button type="button" className="bakery-attention" onClick={openDecisionInbox} aria-label={`${attention.length} decisions need your attention`}><BellRing /> <b>{attention.length}</b><span>need you</span></button><Link className="bakery-button primary" to="/bakery/app/">VIEW CUSTOMER APP</Link></div></header>
      {feedback && <div className="bakery-action-feedback" role="status" aria-live="polite"><Check /><span>{feedback}</span><button type="button" aria-label="Dismiss message" onClick={() => setFeedback('')}>×</button></div>}

      {section === 'today' && <>
        <section className="bakery-store-health" aria-label="Live bakery status" data-owner-reveal><span><Wifi /> <small>KDS</small><b>Online</b></span><span className={settings.storeOrderingEnabled ? 'healthy' : 'paused'}><small>Ordering</small><b>{settings.storeOrderingEnabled ? 'Open' : 'Paused'}</b></span><span><Clock3 /> <small>Next promise</small><b>{liveOrders.length ? liveOrders.slice().sort((a, b) => +new Date(a.promisedAt) - +new Date(b.promisedAt))[0].slot : 'Clear'}</b></span><span className={load.label === 'FULL' ? 'risk' : ''}><small>Capacity</small><b>{load.percent}% · {load.label}</b></span></section>
        <section id="owner-decision-inbox" className="bakery-decision-inbox" data-owner-reveal><div className="bakery-owner-section-title"><div><span>DECISION INBOX</span><h2>{attention.length ? `${attention.length} decisions need you` : 'The bakery is running clean'}</h2><p data-owner-scrub>Ordered by promise risk, so the most time-sensitive choice is always first.</p></div><span className="bakery-owner-section-icon"><BellRing /></span></div>{attention.length ? <div className="bakery-decision-list">{attention.map((item, index) => <article className={`priority-${item.kind.toLowerCase()}`} key={item.id}><div className="bakery-decision-rank" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div><div><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.detail}</p><b><Clock3 /> {item.deadline}</b></div><button type="button" onClick={() => openAttention(item)}><span>{item.actionLabel}</span><ArrowRight /></button></article>)}</div> : <p className="bakery-owner-empty">No paid exceptions, promise risks, or new bespoke requests need a decision.</p>}</section>
        <section className="bakery-owner-kpis compact" aria-label="Today’s bakery metrics" data-owner-reveal><article><span>REVENUE</span><h2>₹{admin.data?.revenue?.toLocaleString('en-IN') ?? 0}</h2><p>Confirmed payments</p></article><article><span>PAID ORDERS</span><h2>{orders.length}</h2><p>Delivery and pickup</p></article><article><span>PRODUCTION HEALTH</span><h2>{healthPercent}%</h2><p>Promises on track</p></article><article><span>IN PRODUCTION</span><h2>{load.inProgress}</h2><p>of {settings.productionCapacity} capacity</p></article></section>
        <section className="bakery-live-snapshot" data-owner-reveal><div className="bakery-owner-section-title"><div><span>LIVE OPERATIONS</span><h2>Production snapshot</h2><p data-owner-scrub>Open an order to see the promise, customer, capacity, and recommended next move.</p></div><button type="button" onClick={() => selectSection('orders')}>View all <ArrowRight /></button></div><div className="bakery-snapshot-grid">{liveOrders.slice(0, 4).map((order) => <button type="button" key={order.id} onClick={() => setDecisionOrder(order)}><span className={`bakery-status-dot ${statusTone(order.productionStatus)}`} /><small>{order.publicNumber} · {order.fulfillment}</small><strong>{order.items[0]?.product?.name ?? 'Custom cake'}</strong><span>{order.productionStatus.replaceAll('_', ' ')} · {order.slot}</span><ArrowRight /></button>)}</div></section>
      </>}

      {section === 'orders' && <section className="bakery-owner-panel bakery-orders-ledger" data-owner-reveal><OwnerPanelHeader eyebrow="Operational ledger" title="Orders" description={`${filteredOrders.length} of ${orders.length} orders shown. Search by order, customer, or cake.`} aside={<span className="bakery-panel-count">{liveOrders.length} live</span>} /><div className="bakery-ledger-tools"><label><Search /><input aria-label="Search orders" placeholder="Search order, customer or cake" value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} /></label><div role="group" aria-label="Filter orders">{(['ALL', 'ATTENTION', 'ACTIVE', 'READY'] as const).map((filter) => <button className={filter === orderFilter ? 'active' : ''} aria-pressed={filter === orderFilter} type="button" key={filter} onClick={() => setOrderFilter(filter)}>{filter}</button>)}</div></div><div className="bakery-ledger-list">{filteredOrders.map((order) => <button type="button" key={order.id} onClick={() => setDecisionOrder(order)}><span className={`bakery-status-dot ${statusTone(order.productionStatus)}`} /><span className="bakery-ledger-summary"><small>{order.publicNumber} · {order.fulfillment}</small><b>{order.items[0]?.product?.name ?? 'Custom cake'}</b><em>{order.customerName}</em></span><span className="bakery-ledger-promise"><small>Promise</small><b>{order.eventDate} · {order.slot}</b></span><strong className={statusTone(order.productionStatus)}>{order.productionStatus.replaceAll('_', ' ')}</strong><ArrowRight /></button>)}</div>{!filteredOrders.length && <p className="bakery-owner-empty">No orders match this search and filter.</p>}</section>}

      {section === 'calendar' && <section className="bakery-owner-panel" data-owner-reveal><OwnerPanelHeader eyebrow="Promise-first planning" title="Capacity calendar" description={`Compare promised work with the current limit of ${settings.productionCapacity} concurrent cakes.`} aside={<span className="bakery-panel-count">{load.inProgress}/{settings.productionCapacity} active</span>} /><div className="bakery-calendar-strip enhanced">{calendarDays.map((day) => { const percent = Math.min(100, Math.round((day.count / settings.productionCapacity) * 100)); return <div className={day.isToday ? 'active' : ''} key={day.date}><b>{day.weekday}</b><span>{day.dayNumber}</span><i>{day.count} promise{day.count === 1 ? '' : 's'}</i><progress max="100" value={percent} aria-label={`${percent}% of capacity`} /><small>{percent}% capacity</small></div> })}</div><div className="bakery-capacity-note"><CalendarDays /><span><b>How attention works</b><p data-owner-scrub>Founder attention appears when promise windows overlap or production reaches the configured limit.</p></span></div></section>}

      {section === 'requests' && <section className="bakery-owner-panel bakery-reference-workspace" data-owner-reveal>
        <div className="bakery-reference-workspace-head"><OwnerPanelHeader eyebrow="Custom cake control" title="Reference approvals" description="Inspect the customer image, record replication guidance, and approve feasibility before quoting." /><div className="bakery-reference-counts"><span><b>{requests.filter((request) => request.referenceApprovalStatus === 'PENDING_REVIEW').length}</b> pending</span><span><b>{requests.filter((request) => request.referenceApprovalStatus === 'APPROVED').length}</b> approved</span></div></div>
        <div className="bakery-reference-filters" role="group" aria-label="Filter reference requests">{(['ALL', 'PENDING_REVIEW', 'APPROVED', 'CHANGES_REQUESTED'] as const).map((filter) => <button type="button" className={referenceFilter === filter ? 'active' : ''} aria-pressed={referenceFilter === filter} onClick={() => setReferenceFilter(filter)} key={filter}>{filter.replaceAll('_', ' ')}</button>)}</div>
        {filteredRequests.length ? <div className="bakery-reference-grid">{filteredRequests.map((request) => <article className="bakery-reference-card" key={request.id}>{request.referenceImage ? <div className="bakery-reference-thumb"><img src={request.referenceImage.src} alt={`Reference for ${request.event.replaceAll('_', ' ').toLowerCase()} cake`} /><span className={`bakery-reference-status status-${(request.referenceApprovalStatus ?? 'PENDING_REVIEW').toLowerCase()}`}>{(request.referenceApprovalStatus ?? 'PENDING_REVIEW').replaceAll('_', ' ')}</span></div> : <div className="bakery-reference-thumb empty"><Gift /><span>WRITTEN BRIEF</span></div>}<div className="bakery-reference-card-copy"><small>{request.event.replaceAll('_', ' ')} · {request.eventDate} · {request.status}</small><h3>{request.servings} guests · {request.budget}</h3><p>{request.notes}</p>{request.referenceImage && <span className="bakery-reference-file"><ImageIcon /> {request.referenceImage.name}</span>}{request.referenceReviewNote && <blockquote>“{request.referenceReviewNote}”</blockquote>}</div><button type="button" onClick={() => openBespoke(request)}><Eye /> {request.referenceImage ? 'INSPECT REFERENCE' : 'REVIEW BRIEF'}</button></article>)}</div> : <p className="bakery-owner-empty">No requests match this approval filter.</p>}
      </section>}

      {section === 'customers' && <section className="bakery-owner-panel" data-owner-reveal><OwnerPanelHeader eyebrow="Customer context" title="Customer 360" description="Search value, preferences, and celebration context without opening an order." aside={<span className="bakery-panel-count">{customers.length} customers</span>} /><label className="bakery-owner-search"><Search /><input aria-label="Search customers" placeholder="Search customer or favourite cake" value={customerQuery} onChange={(event) => setCustomerQuery(event.target.value)} /></label><div className="bakery-customer-360">{filteredCustomers.map((customer) => <article key={customer.phone}><div className="bakery-customer-avatar" aria-hidden="true">{customer.name.slice(0, 1).toUpperCase()}</div><div><b>{customer.name}</b><p>{customer.favourite ? `Favourite · ${customer.favourite}` : `${customer.confirmedOrderCount} confirmed orders`}</p><small>{customer.nextCelebration ? `Next celebration · ${customer.nextCelebration}` : `${customer.confirmedOrderCount} completed`}</small></div><span><small>Lifetime value</small><strong>₹{customer.lifetimeValue.toLocaleString('en-IN')}</strong></span></article>)}</div>{!filteredCustomers.length && <p className="bakery-owner-empty">No customer matches this search.</p>}</section>}

      {section === 'growth' && <section className="bakery-owner-panel" data-owner-reveal><OwnerPanelHeader eyebrow="Useful, not noisy" title="Retention opportunities" description="Three focused audiences with a clear reason to contact them—nothing more." /><div className="bakery-growth-list"><article><span className="bakery-growth-index">01</span><div><b>Celebrations in 7 days</b><p>Reach customers while their occasion is still actionable.</p></div><strong>{growth.upcomingCelebrations}<small> customers</small></strong><button type="button" onClick={() => setOverlay({ eyebrow: 'Campaign preview', title: 'Your celebration is almost here', body: `Audience: ${growth.upcomingCelebrations} customers with a celebration in the next 7 days · Channel: in-app + WhatsApp simulation.` })}>Preview <ArrowRight /></button></article><article><span className="bakery-growth-index">02</span><div><b>Second cake pending</b><p>Help first-order customers reach their next milestone.</p></div><strong>{growth.secondCakePending}<small> customers</small></strong><button type="button" onClick={() => setOverlay({ eyebrow: 'Campaign preview', title: 'One more cake unlocks your next milestone', body: `Audience: ${growth.secondCakePending} first-order customers · Offer: bonus Sweet Points.` })}>Preview <ArrowRight /></button></article><article><span className="bakery-growth-index">03</span><div><b>Saved design, no order</b><p>Bring a saved idea back when the customer is ready.</p></div><strong>{growth.savedDesignNoOrder}<small> customers</small></strong><button type="button" onClick={() => setOverlay({ eyebrow: 'Campaign preview', title: 'Your saved design is ready when you are', body: `Audience: ${growth.savedDesignNoOrder} customers with a saved design and no order yet.` })}>Preview <ArrowRight /></button></article></div></section>}

      {section === 'settings' && <section className="bakery-owner-panel" data-owner-reveal><OwnerPanelHeader eyebrow="Business controls" title="Configuration" description="Changes affect customer ordering immediately. Every control has a plain-language consequence." /><div className="bakery-setting-list">{settingsRows.map((row) => <div className="bakery-setting-row" key={row.key}><span><b>{row.label}</b><small>{row.detail}</small></span><button role="switch" aria-checked={settings[row.key]} type="button" disabled={operations.settings.isPending} onClick={() => operations.settings.mutate({ [row.key]: !settings[row.key] }, { onSuccess: () => setFeedback(`${row.label} updated.`) })}><i aria-hidden="true" />{settings[row.key] ? 'On' : 'Off'}</button></div>)}<div className="bakery-setting-row"><span><b>Safe-order auto acceptance</b><small>On accepts safe orders, Hybrid escalates complex work, and Off asks every time.</small></span><button className="bakery-mode-control" type="button" disabled={operations.settings.isPending} onClick={() => operations.settings.mutate({ safeAutoAcceptance: acceptanceCycle[(acceptanceCycle.indexOf(settings.safeAutoAcceptance) + 1) % acceptanceCycle.length] })}>{settings.safeAutoAcceptance}</button></div><div className="bakery-setting-row"><span><b>Production capacity</b><small>Maximum cakes actively moving through production.</small></span><span className="bakery-setting-stepper"><button type="button" aria-label="Decrease capacity" disabled={operations.settings.isPending || settings.productionCapacity <= 1} onClick={() => operations.settings.mutate({ productionCapacity: settings.productionCapacity - 1 })}>−</button><b>{settings.productionCapacity} cakes</b><button type="button" aria-label="Increase capacity" disabled={operations.settings.isPending} onClick={() => operations.settings.mutate({ productionCapacity: settings.productionCapacity + 1 })}>+</button></span></div></div></section>}
    </main>

    {decisionOrder && <div className="bakery-sheet-backdrop" role="presentation" onMouseDown={() => setDecisionOrder(null)}><section ref={decisionDialogRef} className="bakery-founder-decision" role="dialog" aria-modal="true" aria-labelledby="founder-decision-title" onMouseDown={(event) => event.stopPropagation()}><header><div><span>{decisionOrder.publicNumber} · {decisionOrder.fulfillment}</span><h2 id="founder-decision-title">{decisionOrder.items[0]?.product?.name ?? 'Bakery order'}</h2></div><strong className={statusTone(decisionOrder.productionStatus)}>{decisionOrder.productionStatus.replaceAll('_', ' ')}</strong></header><div className="bakery-decision-facts"><p><span>PROMISE</span><b>{decisionOrder.eventDate} · {decisionOrder.slot}</b></p><p><span>ORDER VALUE</span><b>₹{decisionOrder.quote.total.toLocaleString('en-IN')}</b></p><p><span>CUSTOMER</span><b>{decisionOrder.customerName}</b></p><p><span>CAPACITY</span><b>{load.percent}% · {load.label}</b></p></div>{activeDecisionProjection && <div className={`bakery-system-recommendation ${activeDecisionProjection.risk === 'CRITICAL' ? 'risk' : ''}`}><Sparkles /><span><small>SYSTEM RECOMMENDATION</small><b>{activeDecisionProjection.riskReason}</b><p>{formatPromiseDistance(activeDecisionProjection.minutesToPromise)} · approximately {activeDecisionProjection.estimatedPrepMinutes} min production.</p></span></div>}{decisionOrder.note && <p className="bakery-owner-note-flag"><AlertTriangle /> {decisionOrder.note}</p>}<div className="bakery-decision-items">{decisionOrder.items.map((item) => <p key={item.id}><b>{item.quantity} × {item.product?.name}</b><span>{item.selections.flatMap((selection) => selection.optionIds).join(' · ').replaceAll('-', ' ')}</span></p>)}</div>{decisionOrder.productionStatus === 'AWAITING_ACCEPTANCE' ? <footer><button type="button" className="reject" disabled={operations.status.isPending} onClick={() => move(decisionOrder.id, 'REJECTED', `${decisionOrder.publicNumber} rejected; refund marked for processing.`)}>REJECT & REFUND</button><button type="button" className="accept" disabled={operations.status.isPending} onClick={() => move(decisionOrder.id, 'SCHEDULED', `${decisionOrder.publicNumber} accepted and sent to production.`)}>ACCEPT PROMISE <Check /></button></footer> : <footer><Link className="accept" to={`/bakery/production/order/${decisionOrder.id}`}>OPEN PRODUCTION ORDER <ArrowRight /></Link></footer>}<button className="bakery-sheet-close" type="button" onClick={() => setDecisionOrder(null)}>CLOSE</button></section></div>}

    {bespokeDialog && <div className="bakery-sheet-backdrop bakery-reference-review-backdrop" role="presentation" onMouseDown={() => setBespokeDialog(null)}><section ref={bespokeDialogRef} className={`bakery-owner-dialog ${bespokeDialog.referenceImage ? 'bakery-reference-review-dialog' : ''}`} role="dialog" aria-modal="true" aria-labelledby="bakery-bespoke-dialog-title" onMouseDown={(event) => event.stopPropagation()}>{bespokeDialog.referenceImage && <figure className="bakery-reference-review-image"><img src={bespokeDialog.referenceImage.src} alt="Customer cake reference at full review size" /><figcaption><span><ImageIcon /> CUSTOMER REFERENCE</span><b>{bespokeDialog.referenceImage.name}</b><small>{(bespokeDialog.referenceImage.sizeBytes / 1024 / 1024).toFixed(1)} MB · {bespokeDialog.referenceImage.mimeType.replace('image/', '').toUpperCase()}</small></figcaption></figure>}<div className="bakery-reference-review-copy"><span className="bakery-kicker">{bespokeDialog.referenceImage ? 'REPLICATION REVIEW' : 'WRITTEN BESPOKE BRIEF'}</span><h2 id="bakery-bespoke-dialog-title">{bespokeDialog.event.replaceAll('_', ' ')} · {bespokeDialog.eventDate}</h2><div className="bakery-reference-facts"><span><small>GUESTS</small><b>{bespokeDialog.servings}</b></span><span><small>BUDGET</small><b>{bespokeDialog.budget}</b></span><span><small>REQUEST</small><b>{bespokeDialog.status}</b></span></div><p>{bespokeDialog.notes || 'No extra customer note.'}</p>{bespokeDialog.referenceImage && <><div className={`bakery-reference-decision status-${(bespokeDialog.referenceApprovalStatus ?? 'PENDING_REVIEW').toLowerCase()}`}><span>REPLICATION STATUS</span><b>{(bespokeDialog.referenceApprovalStatus ?? 'PENDING_REVIEW').replaceAll('_', ' ')}</b><small>{bespokeDialog.referenceApprovalStatus === 'APPROVED' ? 'The image is cleared for faithful adaptation and quoting.' : bespokeDialog.referenceApprovalStatus === 'CHANGES_REQUESTED' ? 'The customer needs the review guidance before approval.' : 'Quote remains locked until feasibility is approved.'}</small></div><label className="bakery-reference-review-note"><span>Owner replication guidance</span><textarea value={referenceReviewNote} onChange={(event) => setReferenceReviewNote(event.target.value)} placeholder="Record what can be matched, what must change, and any material or structure constraints…" /></label><div className="bakery-reference-review-actions"><button className="changes" type="button" disabled={operations.bespokeStatus.isPending || !referenceReviewNote.trim()} onClick={() => reviewReference('CHANGES_REQUESTED')}>REQUEST CHANGES</button><button className="approve" type="button" disabled={operations.bespokeStatus.isPending} onClick={() => reviewReference('APPROVED')}>APPROVE REPLICATION <Check /></button></div></>}{bespokeDialog.status === 'NEW' && !bespokeDialog.referenceImage && <button className="bakery-button secondary wide" type="button" disabled={operations.bespokeStatus.isPending} onClick={() => operations.bespokeStatus.mutate({ requestId: bespokeDialog.id, status: 'REVIEWING' }, { onSuccess: (request) => setBespokeDialog(request) })}>MARK REVIEWING</button>}{bespokeDialog.referenceImage && bespokeDialog.referenceApprovalStatus !== 'APPROVED' ? <div className="bakery-reference-quote-lock"><LockKeyhole /><span><b>QUOTE LOCKED</b><small>Approve replication first so price and promise reflect the actual design.</small></span></div> : bespokeDialog.status !== 'QUOTED' ? <><label className="bakery-message-field"><span>Quote amount (₹)</span><input inputMode="numeric" value={quoteAmount} onChange={(event) => setQuoteAmount(event.target.value.replace(/\D/g, ''))} placeholder="e.g. 14500" /></label><button className="bakery-button primary wide" type="button" disabled={operations.bespokeStatus.isPending || !quoteAmount} onClick={sendQuote}>SAVE QUOTE</button></> : <p className="bakery-owner-note-flag"><Check /> Quoted ₹{bespokeDialog.quoteAmount?.toLocaleString('en-IN')}</p>}<button className="bakery-sheet-close" type="button" onClick={() => setBespokeDialog(null)}>CLOSE</button></div></section></div>}
    {overlay && <div className="bakery-sheet-backdrop" role="presentation" onMouseDown={() => setOverlay(null)}><section ref={overlayRef} className="bakery-owner-dialog" role="dialog" aria-modal="true" aria-labelledby="bakery-campaign-title" onMouseDown={(event) => event.stopPropagation()}><span className="bakery-kicker">{overlay.eyebrow}</span><h2 id="bakery-campaign-title">{overlay.title}</h2><p>{overlay.body}</p><button className="bakery-sheet-close" type="button" onClick={() => setOverlay(null)}>CLOSE PREVIEW</button></section></div>}
    {mobileMoreOpen && <div className="bakery-sheet-backdrop bakery-mobile-more-backdrop" role="presentation" onMouseDown={() => setMobileMoreOpen(false)}><section ref={mobileMoreRef} className="bakery-mobile-more" role="dialog" aria-modal="true" aria-labelledby="bakery-mobile-more-title" onMouseDown={(event) => event.stopPropagation()}><div><span className="bakery-kicker">FOUNDER CONTROL</span><h2 id="bakery-mobile-more-title">More tools</h2><button type="button" aria-label="Close more menu" onClick={() => setMobileMoreOpen(false)}>×</button></div><div className="bakery-mobile-more-grid">{navItems.slice(4).map(([id, icon, label]) => <button type="button" className={section === id ? 'active' : ''} aria-current={section === id ? 'page' : undefined} onClick={() => selectSection(id)} key={id}>{icon}<span>{label}</span></button>)}</div><Link className="bakery-mobile-more-link" to="/bakery/production/"><Wifi /> OPEN PRODUCTION <ArrowRight /></Link><Link className="bakery-mobile-more-link secondary" to="/bakery/app/">VIEW CUSTOMER APP <ArrowRight /></Link><button className="bakery-mobile-signout" type="button" onClick={() => { sessionStorage.removeItem(sessionKey); setLoggedIn(false) }}><LogOut /> SIGN OUT</button></section></div>}
  </div>
}
