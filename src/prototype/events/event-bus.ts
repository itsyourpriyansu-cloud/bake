import { createId } from '../../domain/shared/ids'
import { demoClock } from '../../domain/shared/clock'
import type { AppEvent, SystemEventType } from './event-types'

type Listener = (event: AppEvent) => void

/**
 * In-memory pub/sub standing in for a future WebSocket fan-out. Every state-changing action
 * in the prototype (payment, acceptance, kitchen, refunds, availability, loyalty) should emit
 * through here so the realtime transport and any subscriber (customer tracking, owner queue,
 * KDS board) sees the same stream without polling.
 */
class EventBus {
  private listeners = new Set<Listener>()
  private history: AppEvent[] = []

  emit<T>(type: SystemEventType, payload?: T, links: { orderId?: string; customerId?: string } = {}): AppEvent<T> {
    const event: AppEvent<T> = { id: createId('EVT'), type, at: demoClock.now().toISOString(), payload, ...links }
    this.history.push(event)
    this.listeners.forEach((listener) => listener(event))
    return event
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  recent(limit = 50): AppEvent[] {
    return this.history.slice(-limit)
  }

  clearHistory(): void {
    this.history = []
  }
}

export const eventBus = new EventBus()
