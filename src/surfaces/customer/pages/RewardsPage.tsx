import { ArrowRight, Crown, Gift, History, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useLoyalty, useLoyaltyHistory } from '../../../features/loyalty/hooks/useLoyalty'
import { ErrorState, Logo, Skeleton } from '../../../shared/components'
import { CustomerPageHeader, formatMoney } from '../components/Stage5Ui'

export default function RewardsPage() {
  const loyalty = useLoyalty(); const history = useLoyaltyHistory()
  if (loyalty.isError) return <div className="stage5-page"><ErrorState retry={() => void loyalty.refetch()} /></div>
  if (!loyalty.data) return <div className="stage5-page"><Skeleton className="rewards-skeleton" /></div>
  const { customer, progress } = loyalty.data
  return <div className="stage5-page rewards-page">
    <CustomerPageHeader eyebrow="WAVE REWARDS" title="Your Gold Wave" action={<Link className="icon-button" aria-label="Points history" to="/app/rewards/history"><History /></Link>} />
    <section className="gold-membership-card"><div className="gold-wave-mark"><Logo variant="mark" size={44} /></div><span>THE PIZZA WAVE · GOLD</span><h2>{customer.firstName.toUpperCase()}</h2><div className="gold-points"><strong>{customer.pointsAvailable}</strong><span>WAVE POINTS<br />{formatMoney(customer.pointsAvailable)} VALUE</span></div><footer><span>4% back on eligible food</span><Sparkles /></footer></section>
    <div className="wallet-grid"><article><span>AVAILABLE NOW</span><strong>{customer.pointsAvailable}</strong><small>1 point = ₹1</small></article><article><span>PENDING</span><strong>{customer.pointsPending}</strong><small>After completion</small></article></div>
    <section className="tier-progress-card"><div className="tier-progress-head"><div><span>NEXT STOP</span><h2>Platinum Wave</h2></div><Crown /></div><p>{progress.message}</p><div className="tier-measure"><div><span>Orders</span><strong>{progress.currentOrders} / {progress.targetOrders}</strong></div><div className="tier-track"><motion.i initial={{ width: 0 }} animate={{ width: `${progress.ordersPercent}%` }} /></div></div><div className="tier-measure"><div><span>Eligible spend</span><strong>{formatMoney(progress.currentSpend)} / {formatMoney(progress.targetSpend)}</strong></div><div className="tier-track"><motion.i initial={{ width: 0 }} animate={{ width: `${progress.spendPercent}%` }} /></div></div></section>
    <section className="frequency-card"><Gift /><div><span>MONTHLY FREQUENCY</span><h2>Three orders = +25 bonus</h2><p>You have already unlocked this month’s first frequency reward.</p></div><strong>3 / 3</strong></section>
    <section className="rewards-benefits"><div className="section-heading"><div><span>YOUR BENEFITS</span><h2>Gold looks good on you</h2></div></div><div><article><Star /><strong>4% back</strong><span>On eligible food spend</span></article><article><ShieldCheck /><strong>One wallet</strong><span>Delivery, pickup and store</span></article><article><Sparkles /><strong>Member picks</strong><span>Offers that fit your taste</span></article></div></section>
    <section className="reward-recent"><div className="section-heading"><div><span>RECENT ACTIVITY</span><h2>Your points</h2></div><Link to="/app/rewards/history">SEE ALL <ArrowRight /></Link></div>{history.data?.slice(0, 3).map((row) => <div key={row.id}><i>{row.points >= 0 ? <Sparkles /> : <Gift />}</i><span><strong>{row.note ?? (row.points >= 0 ? 'Wave Points earned' : 'Points used')}</strong><small>{row.status === 'PENDING' ? 'Pending until completion' : row.status.toLowerCase()}</small></span><b>{row.points > 0 ? '+' : ''}{row.points}</b></div>)}</section>
    <div className="reward-links"><Link to="/app/wave-id"><span><strong>My Wave ID</strong><small>Link your in-store order securely</small></span><ArrowRight /></Link><Link to="/app/rewards/history"><span><strong>Points history</strong><small>Every earn, redeem and bonus</small></span><ArrowRight /></Link></div>
  </div>
}
