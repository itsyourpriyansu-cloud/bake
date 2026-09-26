import { eventBus } from '../../prototype/events/event-bus'
import type { AppEvent } from '../../prototype/events/event-types'
import type { RealtimeTransport } from './RealtimeTransport'

type EventListener = (event: AppEvent) => void
type StatusListener = (connected: boolean) => void

/**
 * Stands in for a future WebSocket transport. Domain handlers continue to publish to the
 * shared event bus; this adapter fans the same event out to every Pizza Wave browser tab.
 * No surface needs to know whether the event was local or arrived through BroadcastChannel.
 */
export class DemoRealtimeTransport implements RealtimeTransport {
  private readonly sourceId = crypto.randomUUID()
  private readonly listeners = new Set<EventListener>()
  private readonly statusListeners = new Set<StatusListener>()
  private busUnsubscribe?: () => void
  private channel?: BroadcastChannel
  private connected = false

  connect(): void {
    if (this.connected) return
    this.connected = true
    this.busUnsubscribe = eventBus.subscribe((event) => {
      this.listeners.forEach((listener) => listener(event))
      this.channel?.postMessage({ sourceId: this.sourceId, event })
    })
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('pizza-wave:realtime:v1')
      this.channel.onmessage = ({ data }: MessageEvent<{ sourceId?: string; event?: AppEvent }>) => {
        if (!data?.event || data.sourceId === this.sourceId) return
        this.listeners.forEach((listener) => listener(data.event!))
      }
    }
    this.statusListeners.forEach((listener) => listener(true))
  }

  disconnect(): void {
    if (!this.connected) return
    this.busUnsubscribe?.()
    this.busUnsubscribe = undefined
    this.channel?.close()
    this.channel = undefined
    this.connected = false
    this.statusListeners.forEach((listener) => listener(false))
  }

  isConnected(): boolean {
    return this.connected
  }

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener)
    return () => { this.statusListeners.delete(listener) }
  }
}

export const demoRealtimeTransport = new DemoRealtimeTransport()
