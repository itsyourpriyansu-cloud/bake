import { ArrowRight, Bike, RefreshCw, Store } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isActiveCustomerOrder, getCustomerOrderView } from '../../../domain/orders/customer-order.view'
import type { ReorderChange } from '../../../domain/customer/customer-experience.types'
import { useOrders, useOrderActions } from '../../../features/orders/hooks/useOrders'
import { BottomSheet, EmptyState, ErrorState, PrimaryButton, SecondaryButton, Skeleton } from '../../../shared/components'
import { CustomerPageHeader, formatMoney, formatOrderDate } from '../components/Stage5Ui'

export default function OrdersPage() {
  const [tab, setTab] = useState<'ACTIVE' | 'PAST'>('ACTIVE')
  const [review, setReview] = useState<{ orderId: string; changes: ReorderChange[] }>()
  const orders = useOrders('CUST001'); const actions = useOrderActions(); const navigate = useNavigate()
  if (orders.isError) return <div className="stage5-page"><ErrorState retry={() => void orders.refetch()} /></div>
  const rows = (orders.data ?? []).filter((order) => tab === 'ACTIVE' ? isActiveCustomerOrder(order) : !isActiveCustomerOrder(order))
  const reorder = async (orderId: string, acceptChanges = false) => {
    const result = await actions.reorder.mutateAsync({ orderId, acceptChanges })
    if (result.status === 'REVIEW_REQUIRED') setReview({ orderId, changes: result.changes })
    else { setReview(undefined); navigate('/app/cart') }
  }
  return <div className="stage5-page orders-page">
    <CustomerPageHeader eyebrow="YOUR WAVE" title="Orders" />
    <div className="order-tabs" role="tablist" aria-label="Order history"><button className={tab === 'ACTIVE' ? 'active' : ''} onClick={() => setTab('ACTIVE')}>ACTIVE</button><button className={tab === 'PAST' ? 'active' : ''} onClick={() => setTab('PAST')}>PAST</button></div>
    {orders.isPending ? <div className="stage5-list">{[1, 2].map((item) => <Skeleton key={item} className="order-card-skeleton" />)}</div> : rows.length ? <div className="stage5-list">{rows.map((order) => {
      const status = getCustomerOrderView(order); const Mode = order.fulfillmentType === 'DELIVERY' ? Bike : Store
      return <article className={`order-history-card ${isActiveCustomerOrder(order) ? 'active-order-card' : ''}`} key={order.id}>
        <div className="order-card-top"><span><Mode />{order.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'}</span><time>{formatOrderDate(order.createdAt)}</time></div>
        <div className="order-card-status"><div><small>{order.publicOrderNumber}</small><h2>{status.label}</h2><p>{status.detail}</p></div><strong>{formatMoney(order.financialSnapshot.total)}</strong></div>
        <p className="order-item-summary">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(' · ')}</p>
        <div className="order-card-foot"><span>+{order.financialSnapshot.pointsToEarn} points</span>{isActiveCustomerOrder(order) ? <Link className="button button-primary" to={`/app/orders/${order.id}`}>TRACK <ArrowRight /></Link> : <><button className="button button-secondary" disabled={actions.reorder.isPending} onClick={() => void reorder(order.id)}><RefreshCw /> REORDER</button><Link to={`/app/orders/${order.id}`}>VIEW DETAILS</Link></>}</div>
      </article>
    })}</div> : <EmptyState title={tab === 'ACTIVE' ? 'No active orders' : 'No past orders yet'} message={tab === 'ACTIVE' ? 'Your next order will appear here from payment to delivery.' : 'Your completed Pizza Wave orders will live here.'} />}
    <BottomSheet open={Boolean(review)} onClose={() => setReview(undefined)} title="YOUR ORDER HAS CHANGED">
      <p className="sheet-copy">We rechecked today’s prices, products, modifiers and availability before touching your cart.</p>
      <div className="change-list">{review?.changes.map((change, index) => <div key={`${change.productId}-${index}`}><strong>{change.name}</strong><span>{change.message}</span></div>)}</div>
      <PrimaryButton disabled={actions.reorder.isPending} onClick={() => review && void reorder(review.orderId, true)}>REVIEW ORDER</PrimaryButton>
      <SecondaryButton onClick={() => setReview(undefined)}>KEEP MY CART</SecondaryButton>
    </BottomSheet>
  </div>
}
