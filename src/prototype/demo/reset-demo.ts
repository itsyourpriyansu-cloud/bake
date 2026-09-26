import { db } from '../database/db'
import { deriveCapabilities } from '../../domain/store/capability.engine'
import { storeConfigSeed } from '../seed/store.seed'
import { primaryCustomerSeed, secondaryCustomerSeed } from '../seed/customers.seed'
import { categorySeed, productSeed, smartCollectionSeed } from '../seed/catalog.seed'
import { orderEventSeed, orderHistorySeed } from '../seed/orders.seed'
import { loyaltyTransactionSeed, tierStatusSeed } from '../seed/loyalty.seed'
import { conversationSeed, messageSeed } from '../seed/conversations.seed'
import { supportCaseSeed } from '../seed/support.seed'
import { attentionSeed } from '../seed/attention.seed'
import { demoClock } from '../../domain/shared/clock'
import { eventBus } from '../events/event-bus'
import { celebrationSeed, familySeed, favouriteSeed, foodPreferencesSeed, notificationPreferencesSeed, notificationSeed, savedOrderSeed } from '../seed/customer-experience.seed'
import { referralSeed } from '../seed/retention.seed'
import { demoWhatsAppProvider } from '../../services/messaging/DemoWhatsAppProvider'

export const DEMO_CART_ID = 'CART-DEMO'
const CATALOG_VERSION = 6
const AUTH_VERSION = 2
const OWNER_VERSION = 1
const KDS_VERSION = 1
const REALTIME_VERSION = 1
const RETENTION_VERSION = 1

export async function resetDemoDatabase(): Promise<void> {
  demoClock.reset()
  demoWhatsAppProvider.reset()
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))

    await db.config.bulkAdd([
      { key: 'storeConfig', value: storeConfigSeed },
      { key: 'capabilities', value: deriveCapabilities(storeConfigSeed) },
      { key: 'customerLoggedIn', value: false },
      { key: 'orderSequence', value: orderHistorySeed.length },
      { key: 'smartCollections', value: smartCollectionSeed },
      { key: 'cartThreshold', value: { target: 499, label: 'Build a ₹499 feast' } },
      { key: 'activeScenario', value: 'none' },
      { key: 'catalogVersion', value: CATALOG_VERSION },
      { key: 'authVersion', value: AUTH_VERSION },
      { key: 'customerExperienceVersion', value: 1 },
      { key: 'ownerExperienceVersion', value: OWNER_VERSION },
      { key: 'kdsExperienceVersion', value: KDS_VERSION },
      { key: 'realtimeExperienceVersion', value: REALTIME_VERSION },
      { key: 'retentionExperienceVersion', value: RETENTION_VERSION },
      { key: 'demoClockMinutes', value: 0 },
      { key: 'demoKitchenLoadPercent', value: null },
      { key: 'savedOrders', value: savedOrderSeed },
      { key: 'favourites', value: favouriteSeed },
      { key: 'foodPreferences', value: foodPreferencesSeed },
      { key: 'notificationPreferences', value: notificationPreferencesSeed },
      { key: 'family', value: familySeed },
      { key: 'celebrations', value: celebrationSeed },
      { key: 'customerNotifications', value: notificationSeed },
    ])

    await db.customers.bulkAdd([primaryCustomerSeed, secondaryCustomerSeed])
    await db.categories.bulkAdd(categorySeed)
    await db.products.bulkAdd(productSeed)
    await db.carts.add({ id: DEMO_CART_ID, customerId: primaryCustomerSeed.id, status: 'ACTIVE', updatedAt: new Date(0).toISOString() })
    await db.orders.bulkAdd(orderHistorySeed)
    await db.orderEvents.bulkAdd(orderEventSeed)
    await db.loyaltyTransactions.bulkAdd(loyaltyTransactionSeed)
    await db.tierStatus.bulkAdd(tierStatusSeed)
    if (conversationSeed.length) await db.conversations.bulkAdd(conversationSeed)
    if (messageSeed.length) await db.messages.bulkAdd(messageSeed)
    if (supportCaseSeed.length) await db.supportCases.bulkAdd(supportCaseSeed)
    if (attentionSeed.length) await db.attentionItems.bulkAdd(attentionSeed)
    if (referralSeed.length) await db.referrals.bulkAdd(referralSeed)
  })
  eventBus.clearHistory()
  eventBus.emit('DEMO_RESET')
}

export async function ensureDemoDatabase(): Promise<void> {
  const [productCount, categoryCount, customer, cart, storeConfig, experienceVersion, ownerVersion, kdsVersion, realtimeVersion, retentionVersion, activeOrder, reviewOrder] = await Promise.all([
    db.products.count(), db.categories.count(), db.customers.get(primaryCustomerSeed.id),
    db.carts.get(DEMO_CART_ID), db.config.get('storeConfig'), db.config.get('customerExperienceVersion'), db.config.get('ownerExperienceVersion'), db.config.get('kdsExperienceVersion'), db.config.get('realtimeExperienceVersion'), db.config.get('retentionExperienceVersion'), db.orders.get('ORDER-ACTIVE-1384'), db.orders.get('ORDER-REVIEW-1382'),
  ])
  if (productCount !== productSeed.length || categoryCount !== categorySeed.length || !customer || !cart || !storeConfig || experienceVersion?.value !== 1 || ownerVersion?.value !== OWNER_VERSION || kdsVersion?.value !== KDS_VERSION || realtimeVersion?.value !== REALTIME_VERSION || retentionVersion?.value !== RETENTION_VERSION || !activeOrder || !reviewOrder) {
    await resetDemoDatabase()
    return
  }
  const catalogVersion = await db.config.get('catalogVersion')
  if (catalogVersion?.value !== CATALOG_VERSION) {
    await db.transaction('rw', db.categories, db.products, db.cartItems, db.config, async () => {
      await db.categories.clear()
      await db.products.clear()
      // Stage 3 modifier pricing snapshots are incompatible with earlier fast-add rows.
      await db.cartItems.clear()
      await db.categories.bulkAdd(categorySeed)
      await db.products.bulkAdd(productSeed)
      await db.config.put({ key: 'smartCollections', value: smartCollectionSeed })
      await db.config.put({ key: 'cartThreshold', value: { target: 499, label: 'Build a ₹499 feast' } })
      await db.config.put({ key: 'catalogVersion', value: CATALOG_VERSION })
    })
  }
  const authVersion = await db.config.get('authVersion')
  if (authVersion?.value !== AUTH_VERSION) {
    await db.transaction('rw', db.sessions, db.config, async () => {
      await db.sessions.where('realm').equals('CUSTOMER').delete()
      await db.config.put({ key: 'customerLoggedIn', value: false })
      await db.config.put({ key: 'authVersion', value: AUTH_VERSION })
    })
  }

  const cartRows = await db.cartItems.toArray()
  const invalidCartSnapshot = cartRows.some((row) =>
    !Number.isInteger(row.quantity) || row.quantity <= 0 ||
    !Number.isFinite(row.unitPriceSnapshot) || row.unitPriceSnapshot <= 0 ||
    !Array.isArray(row.modifiers),
  )
  if (invalidCartSnapshot) await db.cartItems.clear()
  const clockRecord = await db.config.get('demoClockMinutes')
  demoClock.setOffsetMinutes((clockRecord?.value as number | undefined) ?? 0)
}
