import type { AppEvent } from '../../prototype/events/event-types'

export interface RealtimeTransport {
  connect(): void
  disconnect(): void
  isConnected(): boolean
  subscribe(listener: (event: AppEvent) => void): () => void
  subscribeStatus(listener: (connected: boolean) => void): () => void
}
