import { describe, expect, it } from 'vitest'
import { eventBus } from '../../prototype/events/event-bus'
import { DemoRealtimeTransport } from './DemoRealtimeTransport'
import { orderTrackingRefetchInterval } from '../../features/orders/hooks/useOrders'

describe('DemoRealtimeTransport', () => {
  it('owns connection status and fans shared domain events to subscribers', () => {
    const transport = new DemoRealtimeTransport()
    const statuses: boolean[] = []
    const events: string[] = []
    const stopStatus = transport.subscribeStatus((connected) => statuses.push(connected))
    const stopEvents = transport.subscribe((event) => events.push(event.type))

    transport.connect()
    eventBus.emit('KITCHEN_LOAD_CHANGED', { percent: 85 })
    transport.disconnect()
    eventBus.emit('KITCHEN_LOAD_CHANGED', { percent: 25 })

    expect(statuses).toEqual([true, false])
    expect(events).toEqual(['KITCHEN_LOAD_CHANGED'])
    expect(transport.isConnected()).toBe(false)
    stopStatus()
    stopEvents()
  })

  it('enables TanStack Query polling only while realtime is disconnected', () => {
    expect(orderTrackingRefetchInterval(true)).toBe(false)
    expect(orderTrackingRefetchInterval(false)).toBe(3_000)
  })
})
