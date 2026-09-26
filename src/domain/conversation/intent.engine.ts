import type { ChatIntent, ChatNodeId } from './conversation.types'

/** Deterministic keyword classifier — no AI/LLM involved, matches the prototype's "backend facts, not chat" rule. */
const keywordMap: Array<{ intent: ChatIntent; keywords: string[] }> = [
  { intent: 'TRACK_ORDER', keywords: ['track', 'where is my order', 'status of my order'] },
  { intent: 'CANCEL_ORDER', keywords: ['cancel my order', 'cancel order'] },
  { intent: 'CANCELLATION_STATUS', keywords: ['is my order cancelled', 'cancellation status'] },
  { intent: 'REPORT_PROBLEM', keywords: ['missing', 'wrong item', 'damaged', 'complaint', 'problem with my order'] },
  { intent: 'REFUND_REQUEST', keywords: ['refund', 'money back'] },
  { intent: 'REFUND_STATUS', keywords: ['refund status', 'where is my refund'] },
  { intent: 'LOYALTY_HELP', keywords: ['points', 'wave rewards', 'loyalty', 'tier'] },
  { intent: 'OFFER_HELP', keywords: ['offer', 'coupon', 'discount'] },
  { intent: 'PRODUCT_QUESTION', keywords: ['available', 'availability', 'out of stock'] },
  { intent: 'VIEW_MENU', keywords: ['menu', 'what do you have'] },
  { intent: 'CHECKOUT', keywords: ['checkout', 'pay now'] },
  { intent: 'VIEW_CART', keywords: ['my cart', 'view cart'] },
  { intent: 'TALK_TO_HUMAN', keywords: ['human', 'agent', 'talk to someone', 'founder'] },
]

export function classifyIntent(input: string): ChatIntent {
  const text = input.toLowerCase()
  for (const entry of keywordMap) if (entry.keywords.some((keyword) => text.includes(keyword))) return entry.intent
  return 'UNKNOWN'
}

const nodeTransitions: Record<ChatNodeId, Partial<Record<ChatIntent, ChatNodeId>>> = {
  START: { VIEW_MENU: 'MAIN_MENU', TRACK_ORDER: 'TRACK_ORDER', REPORT_PROBLEM: 'PROBLEM_CATEGORY', LOYALTY_HELP: 'LOYALTY_HELP', TALK_TO_HUMAN: 'HUMAN_HANDOFF' },
  MAIN_MENU: { TRACK_ORDER: 'TRACK_ORDER', REPORT_PROBLEM: 'PROBLEM_CATEGORY', TALK_TO_HUMAN: 'HUMAN_HANDOFF' },
  TRACK_ORDER: { UNKNOWN: 'ORDER_STATUS' },
  ORDER_STATUS: { REPORT_PROBLEM: 'PROBLEM_CATEGORY', TALK_TO_HUMAN: 'HUMAN_HANDOFF' },
  REPORT_PROBLEM: { UNKNOWN: 'PROBLEM_CATEGORY' },
  PROBLEM_CATEGORY: { UNKNOWN: 'SELECT_ORDER_ITEM' },
  SELECT_ORDER_ITEM: { UNKNOWN: 'CREATE_SUPPORT_CASE' },
  CREATE_SUPPORT_CASE: { REFUND_REQUEST: 'REFUND_STATUS', TALK_TO_HUMAN: 'HUMAN_HANDOFF' },
  REFUND_STATUS: { TALK_TO_HUMAN: 'HUMAN_HANDOFF' },
  LOYALTY_HELP: { TALK_TO_HUMAN: 'HUMAN_HANDOFF' },
  HUMAN_HANDOFF: {},
}

export function nextChatNode(current: ChatNodeId, intent: ChatIntent): ChatNodeId {
  return nodeTransitions[current][intent] ?? nodeTransitions[current].UNKNOWN ?? current
}
