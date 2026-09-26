export interface OutboundMessage { to: string; text: string }

/** Replaceable boundary. Production implementation talks to WhatsApp Cloud API; prototype logs to the conversation model. */
export interface MessagingProvider {
  send(message: OutboundMessage): Promise<{ id: string; deliveredAt: string }>
}
