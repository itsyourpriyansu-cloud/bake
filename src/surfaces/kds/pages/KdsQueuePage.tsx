import { ArrowRight, ChefHat, Clock3, Play, TimerReset } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { KdsOrder, KdsQueueSection } from '../../../domain/kitchen/kds.types'
import { useKdsActions, useKdsQueue } from '../../../features/kds/hooks/useKds'
import { EmptyState, ErrorState, Skeleton } from '../../../shared/components'

const sections: Array<{ id: KdsQueueSection; label: string; hint: string }> = [
  { id: 'START_NOW', label: 'START NOW', hint: 'System says begin' },
  { id: 'START_SOON', label: 'START SOON', hint: 'Next in system queue' },
  { id: 'PREPARING', label: 'PREPARING', hint: 'On the line' },
  { id: 'READY', label: 'READY', hint: 'Handoff now' },
]

const time = (value: string) => new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date(value)).replace(/^0/, '')

function Ticket({ order }: { order: KdsOrder }) {
  const actions = useKdsActions()
  const canStart = order.fulfillmentStatus === 'SCHEDULED' || order.fulfillmentStatus === 'PREP_DUE'
  return <article className={`kds-ticket status-${order.queueSection.toLowerCase().replace('_', '-')}`}><div className="kds-ticket-top"><span>#{order.queuePosition}</span><strong>{order.publicOrderNumber}</strong><b>{order.fulfillmentType}</b></div><div className="kds-ticket-timing"><span><Clock3 /> SYSTEM START<strong>{time(order.recommendedStartAt)}</strong></span><span><TimerReset /> READY<strong>{time(order.targetReadyAt)}</strong></span></div><div className="kds-ticket-items">{order.items.map((item) => <span key={item.productId}><strong>{item.quantity} ×</strong> {item.name}</span>)}</div>{order.items.flatMap((item) => item.criticalInstructions).length > 0 && <div className="kds-ticket-critical">{order.items.flatMap((item) => item.criticalInstructions).slice(0, 3).map((note) => <b key={note}>{note}</b>)}</div>}<div className="kds-system-note"><ChefHat /><span><small>SYSTEM RECOMMENDATION</small><strong>{order.queueSection === 'START_NOW' ? 'Start this ticket now' : order.queueSection === 'START_SOON' ? 'Stage ingredients—do not start yet' : order.queueSection === 'PREPARING' ? `${order.remainingMinutes} min remaining` : 'Move to handoff'}</strong></span></div><div className="kds-ticket-actions">{canStart && <button type="button" className="kds-start-button" disabled={actions.start.isPending} onClick={() => actions.start.mutate(order.id)}><Play /> START PREP</button>}<Link to={`/kds/order/${order.id}`}>OPEN ORDER <ArrowRight /></Link></div></article>
}

export default function KdsQueuePage() {
  const queue = useKdsQueue()
  if (queue.isError) return <section className="kds-screen"><ErrorState retry={() => queue.refetch()} /></section>
  return <section className="kds-screen kds-queue-screen"><div className="kds-screen-title"><div><span>SCREEN 1 · SYSTEM ORDER</span><h1>KITCHEN QUEUE</h1></div><div className="kds-shift-summary"><strong>{queue.data?.length ?? 0}</strong><span>ACTIVE TICKETS</span></div></div>{queue.isPending ? <div className="kds-loading-grid"><Skeleton /><Skeleton /><Skeleton /></div> : queue.data?.length ? <div className="kds-queue-board">{sections.map((section) => { const rows = queue.data.filter((order) => order.queueSection === section.id); return <section className={`kds-queue-column column-${section.id.toLowerCase().replace('_', '-')}`} key={section.id}><header><div><h2>{section.label}</h2><span>{section.hint}</span></div><b>{rows.length}</b></header><div>{rows.length ? rows.map((order) => <Ticket key={order.id} order={order} />) : <p className="kds-column-empty">No tickets</p>}</div></section> })}</div> : <EmptyState title="Kitchen clear" message="Paid and accepted orders will appear here in system order." />}</section>
}
