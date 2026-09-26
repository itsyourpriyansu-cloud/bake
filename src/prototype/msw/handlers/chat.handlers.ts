import { http } from 'msw'
import { db } from '../../database/db'
import { createId } from '../../../domain/shared/ids'
import { classifyIntent, nextChatNode } from '../../../domain/conversation/intent.engine'
import type { ChatIntent, ChatMessage, Conversation } from '../../../domain/conversation/conversation.types'
import { API, boot, error, json, now } from './_shared'
import { getCustomerOrderView, isActiveCustomerOrder } from '../../../domain/orders/customer-order.view'
import { getEffectiveAvailability } from '../../../domain/availability/availability.engine'
import { eventBus } from '../../events/event-bus'

const replies: Record<string, string> = {
  TRACK_ORDER: 'Tell me your order number, or I can pull up your most recent order.',
  ORDER_STATUS: 'Your most recent order is on its way. You can also check Orders in the app.',
  REPORT_PROBLEM: 'Sorry about that. What went wrong — missing item, wrong item, food quality, or something else?',
  SELECT_ORDER_ITEM: 'Which item was affected? I will raise a support case for our founder to review.',
  CREATE_SUPPORT_CASE: 'Support case created. Our founder will follow up shortly.',
  REFUND_STATUS: 'Refunds are usually processed within 24-48 hours after approval.',
  LOYALTY_HELP: 'Wave Points: 1 point = ₹1. You earn points on every completed order based on your tier.',
  MAIN_MENU: 'You can browse the menu, track an order, or report a problem. What would you like to do?',
  HUMAN_HANDOFF: 'Connecting you with our founder — they will reply here shortly.',
  START: 'Hi! I can help you track an order, browse the menu, or report a problem.',
}

const intentText: Record<ChatIntent, string> = {
  START_ORDER: 'Let’s get food on the way. Choose Delivery or Pickup, then I’ll open the menu.', CHOOSE_DELIVERY: 'Delivery selected. Open the menu when you’re ready.', CHOOSE_PICKUP: 'Pickup selected. Skip the wait at Grand Road.',
  VIEW_MENU: 'The full menu is ready—pizza, kulhad, sides, shakes and more.', PRODUCT_QUESTION: 'Open any menu item for ingredients, availability and customisations.', CUSTOMIZE_PRODUCT: 'Customisable pizzas open in the seven-step builder.', VIEW_CART: 'Your cart keeps the latest server-shaped quote.', CHECKOUT: 'Checkout will verify your customer session before payment.',
  TRACK_ORDER: '', CANCEL_ORDER: '', CANCELLATION_STATUS: '', REPORT_PROBLEM: 'Tell us what happened: missing item, wrong item, food quality, damaged or spilled, late delivery, payment issue, or something else.',
  REFUND_REQUEST: '', REFUND_STATUS: '', LOYALTY_HELP: '', OFFER_HELP: 'Your current tier progress and relevant rewards are in the Rewards tab.', TALK_TO_HUMAN: 'I’ve marked this conversation for the Pizza Wave team. Messages stay in this same thread.', UNKNOWN: 'Choose one of the guided options below so I can give a reliable answer.',
}

async function backendReply(intent: ChatIntent, customerId: string): Promise<string> {
  if (intent === 'TRACK_ORDER' || intent === 'CANCEL_ORDER' || intent === 'CANCELLATION_STATUS') {
    const orders = await db.orders.where('customerId').equals(customerId).sortBy('createdAt')
    const order = [...orders].reverse().find(isActiveCustomerOrder) ?? orders.at(-1)
    if (!order) return 'There is no order on this customer profile yet.'
    const view = getCustomerOrderView(order)
    const eta = order.promisedAt ? ` ETA ${new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(order.promisedAt))}.` : ''
    if (intent === 'CANCEL_ORDER') return `${order.publicOrderNumber} is ${view.label.toLowerCase()}. Cancellation eligibility must follow its live backend stage; no change has been made.`
    if (intent === 'CANCELLATION_STATUS') return order.fulfillmentStatus === 'CANCELLED' ? `${order.publicOrderNumber} is cancelled. Refund status is available below.` : `${order.publicOrderNumber} has no active cancellation.`
    return `${order.publicOrderNumber}: ${view.label}. ${view.detail}${eta}`
  }
  if (intent === 'LOYALTY_HELP') {
    const customer = await db.customers.get(customerId)
    return customer ? `${customer.tier.replace('_', ' ')} Wave wallet: ${customer.pointsAvailable} points available and ${customer.pointsPending} pending.` : 'No Wave wallet is linked to this profile.'
  }
  if (intent === 'PRODUCT_QUESTION' || intent === 'VIEW_MENU') {
    const [products, availability] = await Promise.all([db.products.toArray(), db.availability.toArray()])
    const live = products.filter((product) => getEffectiveAvailability(product.id, availability, now(), product).status === 'AVAILABLE')
    const unavailable = products.filter((product) => !live.includes(product)).map((product) => product.name)
    return `${live.length} of ${products.length} menu items are available now.${unavailable.length ? ` Temporarily unavailable: ${unavailable.join(', ')}.` : ''}`
  }
  if (intent === 'REFUND_STATUS' || intent === 'REFUND_REQUEST') {
    const refunds = await db.refunds.where('customerId').equals(customerId).toArray()
    const refund = refunds.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    return refund ? `Refund ${refund.id} for ₹${refund.amount} is ${refund.status.replaceAll('_', ' ').toLowerCase()}.` : 'There is no active refund on this profile.'
  }
  return intentText[intent] || 'Choose one of the guided options so I can answer from live Pizza Wave data.'
}

async function createConversation(customerId = 'CUST001'): Promise<Conversation> {
  const existing = await db.conversations.where('customerId').equals(customerId).and((row) => row.status === 'OPEN').first()
  if (existing) return existing
  const current = now().toISOString(); const conversation: Conversation = { id: createId('CONV'), customerId, channel: 'PWA_CHAT', status: 'OPEN', node: 'START', createdAt: current, updatedAt: current }
  const welcome: ChatMessage = { id: createId('MSG'), conversationId: conversation.id, from: 'SYSTEM', text: 'Hi Priyanshu! I can help with your live order, food availability, points or refund status.', at: current }
  await db.transaction('rw', db.conversations, db.messages, async () => { await db.conversations.add(conversation); await db.messages.add(welcome) })
  return conversation
}

export const chatHandlers = [
  http.get(`${API}/conversations`, async ({ request }) => {
    await boot(); const customerId = new URL(request.url).searchParams.get('customerId') ?? 'CUST001'; const rows = await db.conversations.where('customerId').equals(customerId).sortBy('updatedAt'); return json(rows.reverse())
  }),
  http.post(`${API}/conversations`, async ({ request }) => {
    await boot(); const body = await request.json().catch(() => ({})) as { customerId?: string }; return json(await createConversation(body.customerId), 201)
  }),
  http.get(`${API}/conversations/:id`, async ({ params }) => {
    await boot(); const conversation = await db.conversations.get(String(params.id)); if (!conversation) return error('Conversation not found', 404); const messages = await db.messages.where('conversationId').equals(conversation.id).sortBy('at'); return json({ conversation, messages })
  }),
  http.post(`${API}/conversations/:id/intents`, async ({ params, request }) => {
    await boot(); const conversation = await db.conversations.get(String(params.id)); if (!conversation) return error('Conversation not found', 404)
    const body = await request.json() as { intent: ChatIntent; text?: string }; const current = now().toISOString(); const node = nextChatNode(conversation.node, body.intent)
    const updated = { ...conversation, node, updatedAt: current }; const inbound: ChatMessage = { id: createId('MSG'), conversationId: conversation.id, from: 'CUSTOMER', text: body.text ?? body.intent.replaceAll('_', ' '), intent: body.intent, at: current }
    const outbound: ChatMessage = { id: createId('MSG'), conversationId: conversation.id, from: 'SYSTEM', text: await backendReply(body.intent, conversation.customerId), at: new Date(new Date(current).getTime() + 1).toISOString() }
    await db.transaction('rw', db.conversations, db.messages, async () => { await db.conversations.put(updated); await db.messages.bulkAdd([inbound, outbound]) })
    eventBus.emit('CONVERSATION_UPDATED', { conversationId: updated.id }, { customerId: updated.customerId })
    return json({ conversation: updated, reply: outbound })
  }),
  http.post(`${API}/chat/message`, async ({ request }) => {
    await boot()
    const body = await request.json() as { conversationId?: string; customerId: string; text: string }
    let conversation = body.conversationId ? await db.conversations.get(body.conversationId) : undefined
    const current = now()
    if (!conversation) {
      conversation = { id: createId('CONV'), customerId: body.customerId, channel: 'PWA_CHAT', status: 'OPEN', node: 'START', createdAt: current.toISOString(), updatedAt: current.toISOString() }
      await db.conversations.add(conversation)
    }

    const intent = classifyIntent(body.text)
    const nextNode = nextChatNode(conversation.node, intent)
    conversation = { ...conversation, node: nextNode, updatedAt: current.toISOString() }
    await db.conversations.put(conversation)

    const inboundMessage = { id: createId('MSG'), conversationId: conversation.id, from: 'CUSTOMER' as const, text: body.text, intent, at: current.toISOString() }
    const replyText = ['TRACK_ORDER', 'REFUND_STATUS', 'REFUND_REQUEST', 'LOYALTY_HELP', 'PRODUCT_QUESTION', 'VIEW_MENU'].includes(intent) ? await backendReply(intent, body.customerId) : replies[nextNode] ?? await backendReply(intent, body.customerId)
    const outboundMessage = { id: createId('MSG'), conversationId: conversation.id, from: 'SYSTEM' as const, text: replyText, at: current.toISOString() }
    await db.messages.bulkAdd([inboundMessage, outboundMessage])
    eventBus.emit('CONVERSATION_UPDATED', { conversationId: conversation.id }, { customerId: conversation.customerId })

    return json({ conversation, intent, reply: outboundMessage })
  }),

  http.get(`${API}/chat/conversations/:id/messages`, async ({ params }) => {
    await boot()
    const messages = await db.messages.where('conversationId').equals(String(params.id)).sortBy('at')
    return json(messages)
  }),

  http.get(`${API}/chat/conversations/:id`, async ({ params }) => {
    await boot()
    const conversation = await db.conversations.get(String(params.id))
    return conversation ? json(conversation) : error('Conversation not found', 404)
  }),
]
