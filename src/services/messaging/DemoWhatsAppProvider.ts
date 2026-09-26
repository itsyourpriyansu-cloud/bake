import { createId } from '../../domain/shared/ids'
import { demoClock } from '../../domain/shared/clock'
import type { MessagingProvider, OutboundMessage } from './MessagingProvider'

/** No real WhatsApp messages are ever sent — this only records that the app "would have" sent one. */
export class DemoWhatsAppProvider implements MessagingProvider {
  private outbox: Array<OutboundMessage & { id: string; deliveredAt: string }> = []

  async send(message: OutboundMessage) {
    const record = { ...message, id: createId('WA'), deliveredAt: demoClock.now().toISOString() }
    this.outbox.push(record)
    return record
  }

  getOutbox() {
    return this.outbox
  }

  reset() {
    this.outbox = []
  }
}

export const demoWhatsAppProvider = new DemoWhatsAppProvider()
