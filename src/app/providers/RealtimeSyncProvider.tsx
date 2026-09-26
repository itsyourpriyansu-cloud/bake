import { useEffect, type PropsWithChildren } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { demoRealtimeTransport } from '../../services/realtime/DemoRealtimeTransport'
import type { AppEvent } from '../../prototype/events/event-types'
import { demoClock } from '../../domain/shared/clock'

const invalidate = (client: ReturnType<typeof useQueryClient>, keys: readonly (readonly unknown[])[]) => {
  for (const queryKey of keys) void client.invalidateQueries({ queryKey })
}

function synchronize(client: ReturnType<typeof useQueryClient>, event: AppEvent) {
  void client.invalidateQueries({ queryKey: ['demo-state'] })
  if (event.type === 'DEMO_RESET') demoClock.reset()
  if (event.type === 'DEMO_CLOCK_ADVANCED') {
    const totalMinutes = (event.payload as { totalMinutes?: number } | undefined)?.totalMinutes
    if (typeof totalMinutes === 'number') demoClock.setOffsetMinutes(totalMinutes)
  }
  if (event.type === 'DEMO_RESET' || event.type === 'DEMO_SCENARIO_LOADED' || event.type === 'DEMO_CLOCK_ADVANCED') {
    void client.invalidateQueries()
    return
  }
  if (event.orderId || [
    'PAYMENT_CONFIRMED', 'ORDER_REVIEW_REQUIRED', 'ORDER_ACCEPTED', 'ORDER_REJECTED', 'FULFILLMENT_SCHEDULED',
    'PREP_DUE', 'PREP_STARTED', 'PREP_TIME_OVERRIDDEN', 'ORDER_READY', 'ORDER_DISPATCHED', 'ORDER_COMPLETED',
    'REFUND_REQUESTED', 'REFUND_COMPLETED', 'POINTS_CREDITED', 'TIER_CHANGED', 'KITCHEN_PROBLEM_REPORTED',
  ].includes(event.type)) {
    invalidate(client, [
      ['orders'], ['order', event.orderId], ['order-events', event.orderId], ['owner'], ['kds'],
      ['loyalty'], ['loyalty-wallet'], ['loyalty-history'], ['customer-profile'], ['notifications'],
      ['conversations'], ['conversation'], ['refunds'],
    ])
  }
  if (event.type === 'AVAILABILITY_CHANGED') {
    invalidate(client, [['menu'], ['product'], ['search'], ['cart'], ['cart-quote'], ['owner'], ['kds', 'availability']])
  }
  if (event.type === 'CART_UPDATED') invalidate(client, [['cart'], ['cart-quote']])
  if (event.type === 'KDS_ONLINE_CHANGED' || event.type === 'KITCHEN_LOAD_CHANGED') {
    invalidate(client, [['owner'], ['kds'], ['capabilities']])
  }
  if (event.type === 'CAPABILITIES_CHANGED') invalidate(client, [['capabilities'], ['owner']])
  if (event.type === 'PAYMENT_STATUS_CHANGED') invalidate(client, [['payment'], ['owner'], ['orders']])
  if (event.type === 'REFUND_STATUS_CHANGED') invalidate(client, [['refunds'], ['orders'], ['owner'], ['loyalty'], ['notifications'], ['conversation']])
  if (event.type === 'ATTENTION_CHANGED') invalidate(client, [['owner', 'attention'], ['owner', 'dashboard']])
  if (event.type === 'CONVERSATION_UPDATED') invalidate(client, [['conversations'], ['conversation'], ['owner', 'support']])
  if (event.type === 'CUSTOMER_UPDATED') invalidate(client, [['customer-profile'], ['loyalty'], ['loyalty-wallet'], ['owner', 'customer']])
  if (event.type === 'RETENTION_UPDATED') invalidate(client, [['retention'], ['owner', 'opportunities'], ['conversations'], ['conversation'], ['customer-profile'], ['loyalty']])
}

export function RealtimeSyncProvider({ children }: PropsWithChildren) {
  const client = useQueryClient()
  useEffect(() => {
    demoRealtimeTransport.connect()
    const unsubscribe = demoRealtimeTransport.subscribe((event) => synchronize(client, event))
    return () => { unsubscribe(); demoRealtimeTransport.disconnect() }
  }, [client])
  return children
}
