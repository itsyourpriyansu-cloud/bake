import { ArrowDownRight, ArrowUpRight, Gift, History } from 'lucide-react'
import { useLoyaltyHistory } from '../../../features/loyalty/hooks/useLoyalty'
import { EmptyState, ErrorState, Skeleton } from '../../../shared/components'
import { CustomerPageHeader, formatOrderDate } from '../components/Stage5Ui'

const labels: Record<string, string> = { EARN_PENDING: 'Pending from order', EARN_AVAILABLE: 'Earned from order', REDEEM: 'Used on an order', REVERSAL: 'Points reversed', BONUS: 'Frequency bonus', EXPIRY: 'Points expired' }

export default function RewardsHistoryPage() {
  const history = useLoyaltyHistory()
  if (history.isError) return <div className="stage5-page"><ErrorState retry={() => void history.refetch()} /></div>
  return <div className="stage5-page reward-history-page"><CustomerPageHeader eyebrow="WAVE REWARDS" title="Points history" back="/app/rewards" />
    {history.isPending ? <Skeleton className="history-skeleton" /> : history.data?.length ? <div className="loyalty-ledger">{history.data.map((row) => <article key={row.id}><i>{row.type === 'BONUS' ? <Gift /> : row.points >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}</i><div><strong>{row.note || labels[row.type]}</strong><span>{row.orderId ? `Order ${row.orderId.replace('ORDER-', '')}` : labels[row.type]} · {formatOrderDate(row.createdAt)}</span><small>{row.status === 'PENDING' ? 'Pending until completion' : row.expiresAt ? `Expires ${new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(row.expiresAt))}` : row.status.toLowerCase()}</small></div><b className={row.points >= 0 ? 'credit' : 'debit'}>{row.points >= 0 ? '+' : ''}{row.points}</b></article>)}</div> : <EmptyState title="No rewards yet" message="Your earns, redemptions and bonuses will appear here." />}
    <p className="ledger-note"><History /> Points stay pending until fulfillment is complete. Refunds can reverse points from the affected value.</p>
  </div>
}
