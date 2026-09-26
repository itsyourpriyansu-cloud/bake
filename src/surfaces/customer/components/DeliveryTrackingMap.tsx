import { Bike, Clock3, MapPin, Navigation, Radio, Store } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Order, OrderEvent } from '../../../domain/orders/order.types'
import { getDeliveryTrackingView } from '../../../domain/orders/delivery-tracking'

const routePath = 'M 66 236 C 94 205, 112 190, 142 183 S 193 187, 213 151 S 242 100, 282 109 S 318 119, 348 72'

const routePoints = [
  { x: 66, y: 236 }, { x: 111, y: 194 }, { x: 155, y: 183 }, { x: 207, y: 157 },
  { x: 239, y: 112 }, { x: 289, y: 110 }, { x: 348, y: 72 },
]

function pointAt(progress: number) {
  const clamped = Math.max(0, Math.min(1, progress))
  const position = clamped * (routePoints.length - 1)
  const index = Math.min(routePoints.length - 2, Math.floor(position))
  const fraction = position - index
  const start = routePoints[index]; const end = routePoints[index + 1]
  return { x: start.x + (end.x - start.x) * fraction, y: start.y + (end.y - start.y) * fraction }
}

const formatUpdate = (value?: string) => value
  ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
  : 'Just now'

export function DeliveryTrackingMap({ order, events, realtimeConnected }: { order: Order; events?: OrderEvent[]; realtimeConnected: boolean }) {
  const view = getDeliveryTrackingView(order)
  const rider = pointAt(view.progress)
  const latestEvent = events?.at(-1)?.at
  return <section className="delivery-map-card" aria-labelledby="delivery-map-title">
    <header>
      <div><span><Radio /> {realtimeConnected ? 'LIVE ROUTE' : 'UPDATING'}</span><h2 id="delivery-map-title">Grand Road → CT Road</h2></div>
      <div className={`tracking-connection ${realtimeConnected ? 'online' : ''}`}><i />{realtimeConnected ? 'Connected' : 'Polling'}</div>
    </header>
    <div className="delivery-map-canvas" role="img" aria-label={`${view.headline}. Route from Pizza Wave on Grand Road to the delivery address on CT Road.`}>
      <svg viewBox="0 0 400 290" aria-hidden="true">
        <rect width="400" height="290" rx="26" className="map-land" />
        <path d="M -15 42 C 80 67, 93 38, 178 58 S 300 60, 420 20" className="map-road-secondary" />
        <path d="M 15 270 C 79 224, 129 226, 168 191 S 229 135, 275 155 S 341 194, 414 150" className="map-road-secondary" />
        <path d="M 38 -10 C 55 54, 76 93, 62 151 S 33 237, 57 310" className="map-road" />
        <path d="M 367 -12 C 325 44, 330 92, 350 135 S 385 228, 365 310" className="map-road" />
        <path d={routePath} className="map-route-base" pathLength="100" />
        <motion.path d={routePath} className="map-route-travelled" pathLength="100" initial={{ strokeDasharray: '0 100' }} animate={{ strokeDasharray: `${view.progress * 100} 100` }} transition={{ duration: 1.1, ease: 'easeOut' }} />
        <text x="79" y="88">GRAND ROAD</text><text x="285" y="207">VIP ROAD</text><text x="292" y="45">CT ROAD</text>
        <circle cx="66" cy="236" r="17" className="map-store-ring" />
        <circle cx="348" cy="72" r="18" className="map-destination-ring" />
      </svg>
      <div className="map-marker store" style={{ left: `${66 / 4}%`, top: `${236 / 2.9}%` }}><Store /><span>Pizza Wave</span></div>
      <div className="map-marker destination" style={{ left: `${348 / 4}%`, top: `${72 / 2.9}%` }}><MapPin /><span>Your place</span></div>
      {view.riderVisible && <motion.div className="map-rider" initial={{ left: '16.5%', top: '81.3%', scale: .75 }} animate={{ left: `${rider.x / 4}%`, top: `${rider.y / 2.9}%`, scale: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }}><Bike /><span>{view.phase === 'ON_ROUTE' ? 'RIDER' : 'PICKUP'}</span></motion.div>}
      <div className="map-scale"><i /><span>1.8 km</span></div>
    </div>
    <div className="delivery-live-card">
      <div className="delivery-live-icon">{view.phase === 'ON_ROUTE' ? <Navigation /> : view.phase === 'HANDOFF' ? <Bike /> : <Clock3 />}</div>
      <div><span>{view.phase.replace('_', ' ')}</span><strong>{view.headline}</strong><p>{view.detail}</p><small><MapPin /> {view.locationLabel} · Updated {formatUpdate(latestEvent)}</small></div>
    </div>
    <footer><span><b>STORE</b> Grand Road, Puri</span><i /><span><b>DROP</b> CT Road, Puri</span></footer>
  </section>
}
