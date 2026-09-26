import {
  AlertTriangle, ArrowLeft, Check, ChefHat, ClipboardList, Clock3, Delete, LogOut, PackageCheck, Search, TimerReset, Wifi,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import {
  buildBakeryProductionQueue, formatPromiseDistance, orderCriticalTags, projectBakeryOrder, type BakeryOrderProjection, type BakeryQueueLane,
} from '../../../domain/bakery/production.projection'
import type { BakeryAvailability, BakeryProduct, BakeryProductionStatus } from '../../../domain/bakery/bakery.types'
import { useBakeryAdmin, useBakeryAvailability, useBakeryOperations, useBakeryOrder } from '../../../features/bakery/useBakery'
import { getBakeryProductAsset } from '../../../shared/utils/bakeryAssets'
import { countdownParts, weekdayDateLabel } from '../components/dateLabels'
import { BakeryLogo, BakeryStatePanel, useBakeryDialogFocus } from '../components/BakeryUi'

const sessionKey = 'bakery-wave:session:production'
const demoPin = '2580'

function useNow(interval = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), interval); return () => clearInterval(timer) }, [interval])
  return now
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(value))
}

function PinPad({ onDigit, onBackspace }: { onDigit: (digit: string) => void; onBackspace: () => void }) {
  return <div className="bakery-pin-pad" role="group" aria-label="PIN keypad">
    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => <button type="button" key={digit} onClick={() => onDigit(digit)}>{digit}</button>)}
    <span aria-hidden="true" />
    <button type="button" onClick={() => onDigit('0')}>0</button>
    <button type="button" aria-label="Delete digit" onClick={onBackspace}><Delete /></button>
  </div>
}

function ProductionLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const attempt = (value: string) => {
    if (value === demoPin) { sessionStorage.setItem(sessionKey, 'active'); onSuccess(); return }
    setError('That PIN did not match this kitchen tablet.'); setPin('')
  }
  const updatePin = (value: string) => {
    setError('')
    const next = value.replace(/\D/g, '').slice(0, 4)
    setPin(next)
    if (next.length === 4) attempt(next)
  }
  const submit = (event: FormEvent) => { event.preventDefault(); attempt(pin) }
  return <main className="bakery-production-login"><form onSubmit={submit}>
    <div className="bakery-login-status"><span><i /> TRUSTED DEVICE</span><b>{weekdayDateLabel()}</b></div>
    <ChefHat /><span className="bakery-kicker">KITCHEN TABLET #1</span><h1>START BAKER SHIFT</h1>
    <p>Open the live production board for Grand Road.</p>
    <label><span>4-digit baker PIN</span><input autoFocus aria-describedby="production-pin-help" type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(event) => updatePin(event.target.value)} /></label>
    <PinPad onDigit={(digit) => updatePin(pin + digit)} onBackspace={() => setPin((value) => value.slice(0, -1))} />
    {error && <p className="bakery-form-error" role="alert">{error}</p>}
    <button type="submit" className="bakery-button primary wide" disabled={pin.length !== 4}>OPEN PRODUCTION</button>
    <small id="production-pin-help">Demo PIN · 2580</small>
  </form></main>
}

export function BakeryProductionShell() {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem(sessionKey) === 'active')
  const now = useNow(1_000)
  if (!loggedIn) return <ProductionLogin onSuccess={() => setLoggedIn(true)} />
  return <div className="bakery-production"><header>
    <div className="bakery-production-brand"><BakeryLogo compact /><span className="bakery-production-tag">BAKE KDS</span></div>
    <nav aria-label="Production navigation"><NavLink end to="/bakery/production/"><ClipboardList /><span>QUEUE</span></NavLink><NavLink to="/bakery/production/availability"><PackageCheck /><span>AVAILABILITY</span></NavLink></nav>
    <div className="bakery-production-device"><span className="bakery-sync-live"><Wifi /> LIVE · {formatTime(new Date(now).toISOString())}</span><button type="button" aria-label="End baker shift" onClick={() => { sessionStorage.removeItem(sessionKey); setLoggedIn(false) }}><LogOut /></button></div>
  </header><Outlet /></div>
}

const lanes: Array<{ id: BakeryQueueLane; label: string; hint: string }> = [
  { id: 'START_NOW', label: 'START NOW', hint: 'Begin in system order' },
  { id: 'START_SOON', label: 'START SOON', hint: 'Stage, but do not start' },
  { id: 'IN_PROGRESS', label: 'IN PRODUCTION', hint: 'Protect the promise' },
  { id: 'READY', label: 'READY', hint: 'Handoff waiting' },
]

function QueueTicket({ projection }: { projection: BakeryOrderProjection }) {
  const operations = useBakeryOperations()
  const { order } = projection
  const canStart = projection.lane === 'START_NOW' && order.productionStatus === 'SCHEDULED'
  return <article className={`bakery-command-ticket risk-${projection.risk.toLowerCase()}`}>
    <div className="bakery-ticket-risk"><span>{projection.risk === 'CRITICAL' ? 'PROMISE RISK' : projection.risk === 'DUE_SOON' ? 'DUE SOON' : projection.risk === 'READY' ? 'HANDOFF' : 'ON TRACK'}</span><b>{formatPromiseDistance(projection.minutesToPromise)}</b></div>
    <header><strong>{order.publicNumber}</strong><span>{order.fulfillment}</span></header>
    <div className="bakery-ticket-promise"><span><Clock3 /> PROMISE</span><b>{formatTime(order.promisedAt)}</b></div>
    <div className="bakery-ticket-products">{order.items.map((item) => <p key={item.id}><strong>{item.quantity} ×</strong> {item.product?.name ?? 'Bakery item'}</p>)}</div>
    {projection.criticalTags.length > 0 && <div className="bakery-ticket-tags">{projection.criticalTags.map((tag) => <b key={tag}>{tag}</b>)}</div>}
    <div className="bakery-ticket-recommendation"><small>SYSTEM RECOMMENDATION</small><strong>{projection.lane === 'START_NOW' ? 'Start this ticket now' : projection.lane === 'START_SOON' ? `Stage for ${formatTime(projection.recommendedStartAt)}` : projection.lane === 'IN_PROGRESS' ? `${order.productionStatus.replaceAll('_', ' ')} · ~${projection.remainingMinutes} min work left` : projection.riskReason}</strong></div>
    {canStart ? <button className="bakery-ticket-primary" type="button" disabled={operations.status.isPending} onClick={() => operations.status.mutate({ orderId: order.id, status: 'MIXING' })}>START PRODUCTION <Check /></button> : <Link className="bakery-ticket-primary" to={`/bakery/production/order/${order.id}`}>{projection.lane === 'READY' ? 'OPEN HANDOFF' : 'OPEN ORDER'} <span aria-hidden="true">→</span></Link>}
  </article>
}

export function BakeryProductionQueuePage() {
  const admin = useBakeryAdmin()
  const now = useNow()
  const allOrders = useMemo(() => Array.isArray(admin.data?.orders) ? admin.data.orders : [], [admin.data?.orders])
  const queue = useMemo(() => buildBakeryProductionQueue(allOrders, now), [allOrders, now])
  if (admin.isLoading) return <main className="bakery-production-main"><div className="bakery-loading-row">Sorting the production queue…</div></main>
  if (admin.isError) return <main className="bakery-production-main"><BakeryStatePanel title="QUEUE DIDN’T LOAD" description="No ticket has been changed. Retry the kitchen connection." actionLabel="TRY AGAIN" onAction={() => void admin.refetch()} /></main>
  const riskCount = queue.filter((item) => item.risk === 'CRITICAL').length
  return <main className="bakery-production-main bakery-command-main">
    <header className="bakery-production-heading"><div><span>{weekdayDateLabel()}</span><h1>PRODUCTION QUEUE</h1></div><div className={riskCount ? 'has-risk' : ''}><Clock3 /><span><b>{queue.length} LIVE · {riskCount} AT RISK</b><small>Sorted by customer promise</small></span></div></header>
    {queue.length ? <div className="bakery-command-board">{lanes.map((lane) => {
      const tickets = queue.filter((item) => item.lane === lane.id)
      return <section className={`bakery-command-lane lane-${lane.id.toLowerCase().replace('_', '-')}`} key={lane.id}>
        <header><div><h2>{lane.label}</h2><span>{lane.hint}</span></div><b>{tickets.length}</b></header>
        <div>{tickets.length ? tickets.map((ticket) => <QueueTicket key={ticket.order.id} projection={ticket} />) : <p className="bakery-lane-empty"><PackageCheck /> Nothing here</p>}</div>
      </section>
    })}</div> : <div className="bakery-production-empty"><PackageCheck /><h2>KITCHEN CLEAR</h2><p>Accepted orders will appear here in promise order.</p></div>}
  </main>
}

const nextStatus: Partial<Record<BakeryProductionStatus, BakeryProductionStatus>> = { SCHEDULED: 'MIXING', MIXING: 'BAKING', BAKING: 'COOLING', COOLING: 'DECORATING', DECORATING: 'PACKING', PACKING: 'READY', READY: 'COMPLETED' }
const stages: BakeryProductionStatus[] = ['MIXING', 'BAKING', 'COOLING', 'DECORATING', 'PACKING', 'READY']
const problemReasons = ['Ingredient unavailable', 'Capacity delay', 'Equipment issue', 'Damaged / rework', 'Customer clarification', 'Other']

export function BakeryProductionOrderPage() {
  const { orderId } = useParams()
  const order = useBakeryOrder(orderId)
  const operations = useBakeryOperations()
  const [problemOpen, setProblemOpen] = useState(false)
  const [problemReason, setProblemReason] = useState(problemReasons[0])
  const [delayMinutes, setDelayMinutes] = useState(15)
  const now = useNow(1_000)
  const problemDialogRef = useBakeryDialogFocus<HTMLElement>(problemOpen, () => setProblemOpen(false))
  const value = order.data
  if (order.isError) return <main className="bakery-production-main"><BakeryStatePanel title="TICKET NOT FOUND" description="Return to the queue and choose an active production ticket." actionLabel="BACK TO QUEUE" link="/bakery/production/" /></main>
  if (!value) return <main className="bakery-production-main"><div className="bakery-loading-row">Opening production ticket…</div></main>
  const items = Array.isArray(value.items) ? value.items : []
  const tags = orderCriticalTags(value)
  const advance = nextStatus[value.productionStatus]
  const countdown = countdownParts(value.promisedAt, now)
  const stageIndex = stages.indexOf(value.productionStatus)
  const projection = projectBakeryOrder(value, now)
  const canAdvance = !(value.productionStatus === 'SCHEDULED' && projection?.lane === 'START_SOON')
  const reportProblem = () => {
    operations.note.mutate({ orderId: value.id, note: `${problemReason} · estimated ${delayMinutes} min delay` }, { onSuccess: () => setProblemOpen(false) })
  }
  return <main className="bakery-production-main bakery-order-command">
    <Link className="bakery-back-link" to="/bakery/production/"><ArrowLeft /> BACK TO QUEUE</Link>
    <section className="bakery-production-order-head"><div><span>{value.publicNumber} · {value.fulfillment}</span><h1>{value.productionStatus.replaceAll('_', ' ')}</h1><p>Promise {value.eventDate} · {value.slot}</p></div><div className={`bakery-big-timer ${countdown.overdue ? 'overdue' : ''}`}><TimerReset /><b>{countdown.label}</b><span>{countdown.overdue ? 'OVERDUE' : 'TO PROMISE'}</span></div></section>
    <ol className="bakery-stage-rail" aria-label="Production stages">{stages.map((stage, index) => <li className={index < stageIndex ? 'done' : index === stageIndex ? 'current' : ''} key={stage}><i>{index < stageIndex ? '✓' : index + 1}</i><span>{stage}</span></li>)}</ol>
    {value.note && <p className="bakery-problem-confirmed" role="status"><AlertTriangle /> {value.note}</p>}
    <div className="bakery-production-order-grid">
      <section className="bakery-order-reference"><img src={getBakeryProductAsset(items[0]?.productId ?? '')} alt={`Reference for ${items[0]?.product?.name ?? 'bakery order'}`} /><span>CAKE REFERENCE</span></section>
      <section className="bakery-make-line"><span className="bakery-kicker">MAKE LINE · {projection?.riskReason.toUpperCase()}</span><div className="bakery-critical-tags">{tags.map((tag) => <strong key={tag}>{tag}</strong>)}</div><h2>ITEMS & INSTRUCTIONS</h2>{items.map((item) => <article key={item.id}><div><b>{item.quantity} ×</b><h3>{item.product?.name ?? 'Bakery item'}</h3></div><p>{item.selections.flatMap((selection) => selection.optionIds).join(' · ').replaceAll('-', ' ') || 'Standard bakery finish'}</p>{item.message && <blockquote><small>WRITE EXACTLY</small>“{item.message}”</blockquote>}</article>)}</section>
    </div>
    <footer className="bakery-production-actions"><button type="button" onClick={() => setProblemOpen(true)}><AlertTriangle /> REPORT PROBLEM</button>{advance && <button className="primary" disabled={operations.status.isPending || !canAdvance} onClick={() => operations.status.mutate({ orderId: value.id, status: advance })}>{canAdvance ? (advance === 'READY' ? 'MARK READY' : advance === 'COMPLETED' ? 'COMPLETE HANDOFF' : `MOVE TO ${advance}`) : `START AT ${formatTime(projection?.recommendedStartAt ?? value.promisedAt)}`} {canAdvance && <Check />}</button>}</footer>
    {problemOpen && <div className="bakery-sheet-backdrop" role="presentation" onMouseDown={() => setProblemOpen(false)}><section ref={problemDialogRef} className="bakery-production-problem" role="dialog" aria-modal="true" aria-labelledby="bakery-problem-title" onMouseDown={(event) => event.stopPropagation()}><span className="bakery-kicker">PRODUCTION EXCEPTION</span><h2 id="bakery-problem-title">WHAT CHANGED?</h2><p>The founder will see the reason, delay, and customer promise immediately.</p><label className="bakery-problem-field"><span>Reason</span><select value={problemReason} onChange={(event) => setProblemReason(event.target.value)}>{problemReasons.map((reason) => <option key={reason}>{reason}</option>)}</select></label><div className="bakery-delay-options"><span>Estimated delay</span>{[15, 30, 60].map((minutes) => <button className={delayMinutes === minutes ? 'active' : ''} type="button" key={minutes} onClick={() => setDelayMinutes(minutes)}>{minutes} MIN</button>)}</div><div className="bakery-problem-impact"><AlertTriangle /><span><b>Founder attention will be created</b><small>{formatPromiseDistance(projection?.minutesToPromise ?? 0)} on the current promise</small></span></div><button className="bakery-button primary wide" type="button" disabled={operations.note.isPending} onClick={reportProblem}>REPORT {delayMinutes} MIN DELAY</button><button className="bakery-sheet-close" type="button" onClick={() => setProblemOpen(false)}>CANCEL</button></section></div>}
  </main>
}

const pauseDurations: Array<{ label: string; ms: number | null }> = [{ label: '1 hour', ms: 60 * 60 * 1000 }, { label: '4 hours', ms: 4 * 60 * 60 * 1000 }, { label: 'Rest of today', ms: null }]

function untilFor(durationMs: number | null) {
  if (durationMs !== null) return new Date(Date.now() + durationMs).toISOString()
  const endOfDay = new Date(); endOfDay.setHours(23, 59, 0, 0); return endOfDay.toISOString()
}

export function BakeryAvailabilityPage() {
  const data = useBakeryAvailability()
  const admin = useBakeryAdmin()
  const operations = useBakeryOperations()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'OFF'>('ALL')
  const [pauseTarget, setPauseTarget] = useState<BakeryProduct | null>(null)
  const pauseDialogRef = useBakeryDialogFocus<HTMLElement>(Boolean(pauseTarget), () => setPauseTarget(null))
  const overrides = (Array.isArray(data.data?.overrides) ? data.data.overrides : []) as BakeryAvailability[]
  const allProducts = Array.isArray(data.data?.products) ? data.data.products : []
  const products = allProducts.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()) && (filter === 'ALL' || (filter === 'LIVE' ? product.available : !product.available)))
  const activeOrders = Array.isArray(admin.data?.orders) ? admin.data.orders.filter((order) => !['COMPLETED', 'REJECTED'].includes(order.productionStatus)) : []
  if (data.isLoading) return <main className="bakery-production-main"><div className="bakery-loading-row">Checking the bakery counter…</div></main>
  if (data.isError) return <main className="bakery-production-main"><BakeryStatePanel title="AVAILABILITY DIDN’T LOAD" description="Customer items remain unchanged. Retry before pausing a product." actionLabel="TRY AGAIN" onAction={() => void data.refetch()} /></main>
  const affectedOrders = pauseTarget ? activeOrders.filter((order) => order.items.some((item) => item.productId === pauseTarget.id)) : []
  const confirmPause = (durationMs: number | null) => { if (!pauseTarget) return; operations.availability.mutate({ productId: pauseTarget.id, available: false, source: 'BAKER', reason: 'Production capacity', until: untilFor(durationMs) }, { onSuccess: () => setPauseTarget(null) }) }
  return <main className="bakery-production-main bakery-availability-command"><header className="bakery-production-heading"><div><span>COUNTER & INGREDIENT CONTROL</span><h1>AVAILABILITY</h1></div><div><PackageCheck /><span><b>{allProducts.filter((product) => product.available).length} LIVE</b><small>{allProducts.filter((product) => !product.available).length} paused</small></span></div></header>
    <div className="bakery-availability-tools"><label className="bakery-production-search"><Search /><input aria-label="Search products" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cakes or bakes" /></label><div className="bakery-availability-filters">{(['ALL', 'LIVE', 'OFF'] as const).map((value) => <button className={filter === value ? 'active' : ''} type="button" key={value} onClick={() => setFilter(value)}>{value}</button>)}</div></div>
    <div className="bakery-availability-list">{products.map((product) => { const override = overrides.find((item) => item.productId === product.id); return <article key={product.id}><img src={getBakeryProductAsset(product.id)} alt="" /><div><small>{product.category}</small><h2>{product.name}</h2><p>{product.available ? 'Available to customers' : `${override?.source === 'OWNER' ? 'Founder lock' : 'Baker pause'}${override?.until ? ` · until ${formatTime(override.until)}` : ''}`}</p></div><span className={product.available ? 'on' : 'off'}>{product.available ? 'LIVE' : 'OFF'}</span><button disabled={operations.availability.isPending || (!product.available && override?.source === 'OWNER')} onClick={() => product.available ? setPauseTarget(product) : operations.availability.mutate({ productId: product.id, available: true, source: 'BAKER', reason: 'Back in stock' })}>{product.available ? 'PAUSE' : override?.source === 'OWNER' ? 'FOUNDER LOCK' : 'ENABLE NOW'}</button></article> })}</div>
    {!products.length && <div className="bakery-production-empty"><Search /><h2>NO MATCHING ITEMS</h2><p>Try another name or availability filter.</p></div>}
    {pauseTarget && <div className="bakery-sheet-backdrop" role="presentation" onMouseDown={() => setPauseTarget(null)}><section ref={pauseDialogRef} className="bakery-production-problem" role="dialog" aria-modal="true" aria-labelledby="bakery-pause-title" onMouseDown={(event) => event.stopPropagation()}><span className="bakery-kicker">PAUSE PRODUCT</span><h2 id="bakery-pause-title">PAUSE “{pauseTarget.name}”?</h2><p>New customers will not be able to order it. Existing accepted orders are not cancelled.</p>{affectedOrders.length > 0 && <div className="bakery-problem-impact"><AlertTriangle /><span><b>{affectedOrders.length} accepted order{affectedOrders.length === 1 ? '' : 's'} use this product</b><small>Review them separately after pausing.</small></span></div>}{pauseDurations.map((duration) => <button type="button" key={duration.label} disabled={operations.availability.isPending} onClick={() => confirmPause(duration.ms)}>{duration.label}<span aria-hidden="true">→</span></button>)}<button className="bakery-sheet-close" type="button" onClick={() => setPauseTarget(null)}>CANCEL</button></section></div>}
  </main>
}
