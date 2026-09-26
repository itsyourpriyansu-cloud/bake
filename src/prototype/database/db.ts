import Dexie, { type EntityTable } from 'dexie'
import type { Customer } from '../../domain/customer/customer.types'
import type { Category, Product } from '../../domain/catalog/catalog.types'
import type { AvailabilityRecord } from '../../domain/availability/availability.types'
import type { LegacyCart, CartItem } from '../../domain/cart/cart.types'
import type { OrderIntent, Order, OrderEvent } from '../../domain/orders/order.types'
import type { PaymentAttempt } from '../../domain/payment/payment.types'
import type { LoyaltyTransaction, TierStatus } from '../../domain/loyalty/loyalty.types'
import type { Conversation, ChatMessage } from '../../domain/conversation/conversation.types'
import type { SupportCase } from '../../domain/support/support.types'
import type { Refund } from '../../domain/refunds/refund.types'
import type { AttentionItem } from '../../domain/attention/attention.types'
import type { AnySession } from '../../domain/auth/auth.types'
import type { CheckoutSession } from '../../domain/checkout/checkout.types'
import type { CampaignEvent, Referral } from '../../domain/retention/retention.types'

export interface StoredCartItem extends CartItem { quantity: number }
/** Generic key/value store: 'storeConfig' -> StoreConfig, 'capabilities' -> Capabilities, 'customerLoggedIn' -> boolean, 'orderSequence' -> number. */
export interface ConfigRecord { key: string; value: unknown }
export interface AuditLogRecord { id: string; actor: string; action: string; entityType: string; entityId: string; at: string; metadata?: Record<string, unknown> }
export interface SessionRecord { id: string; realm: AnySession['realm']; payload: AnySession }

export class PizzaWaveDatabase extends Dexie {
  customers!: EntityTable<Customer, 'id'>
  products!: EntityTable<Product, 'id'>
  categories!: EntityTable<Category, 'id'>
  availability!: EntityTable<AvailabilityRecord, 'id'>
  carts!: EntityTable<Omit<LegacyCart, 'items'>, 'id'>
  cartItems!: EntityTable<StoredCartItem, 'id'>
  checkoutSessions!: EntityTable<CheckoutSession, 'id'>
  orderIntents!: EntityTable<OrderIntent, 'id'>
  payments!: EntityTable<PaymentAttempt, 'id'>
  orders!: EntityTable<Order, 'id'>
  orderEvents!: EntityTable<OrderEvent, 'id'>
  loyaltyTransactions!: EntityTable<LoyaltyTransaction, 'id'>
  tierStatus!: EntityTable<TierStatus, 'customerId'>
  conversations!: EntityTable<Conversation, 'id'>
  messages!: EntityTable<ChatMessage, 'id'>
  supportCases!: EntityTable<SupportCase, 'id'>
  refunds!: EntityTable<Refund, 'id'>
  attentionItems!: EntityTable<AttentionItem, 'id'>
  sessions!: EntityTable<SessionRecord, 'id'>
  auditLogs!: EntityTable<AuditLogRecord, 'id'>
  campaignEvents!: EntityTable<CampaignEvent, 'id'>
  referrals!: EntityTable<Referral, 'id'>
  config!: EntityTable<ConfigRecord, 'key'>

  constructor() {
    // New prototype namespace avoids unsafe primary-key upgrades from the early Stage 1 database.
    super('pizza-wave-prototype-v2')
    const stores = {
      customers: 'id, phone, tier', products: 'id, categoryId, available, basePrice', categories: 'id, sortOrder',
      availability: 'id, entityId, entityType, source, expiresAt', carts: 'id, customerId, status, updatedAt',
      cartItems: 'id, cartId, productId, [cartId+productId]',
      orderIntents: 'id, customerId, status, expiresAt',
      payments: 'id, orderIntentId, merchantOrderId, status',
      orders: 'id, customerId, orderIntentId, paymentStatus, acceptanceStatus, fulfillmentStatus, createdAt',
      orderEvents: 'id, orderId, type, at',
      loyaltyTransactions: 'id, customerId, orderId, status, expiresAt',
      tierStatus: 'customerId, tier',
      conversations: 'id, customerId, status',
      messages: 'id, conversationId, at',
      supportCases: 'id, conversationId, orderId, customerId, status',
      refunds: 'id, orderId, customerId, status',
      attentionItems: 'id, type, severity, resolvedAt',
      sessions: 'id, realm',
      auditLogs: 'id, actor, entityType, entityId, at',
      config: 'key',
    }
    this.version(1).stores(stores)
    this.version(2).stores({ checkoutSessions: 'id, customerId, cartId, status, expiresAt' })
    // Payment status lookup is part of the Stage 4 customer return flow.
    this.version(3).stores({ orders: 'id, customerId, orderIntentId, paymentId, paymentStatus, acceptanceStatus, fulfillmentStatus, createdAt' })
    // Stable Amani-style cart configuration identity supports safe merge/edit behavior.
    this.version(4).stores({ cartItems: 'id, cartId, productId, configurationKey, [cartId+productId]' })
    // Stage 9 adds compact retention event/referral ledgers. Customer messages remain in
    // the existing conversation table regardless of delivery channel.
    this.version(5).stores({
      campaignEvents: 'id, opportunityId, customerId, channel, status, createdAt',
      referrals: 'id, referrerCustomerId, status, updatedAt',
    })
  }
}

export const db = new PizzaWaveDatabase()
