import { ArrowRight, Bot, CheckCircle2, ChevronRight, CircleHelp, Headphones, MessageCircle, Send, ShieldCheck } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { ChatIntent } from '../../../domain/conversation/conversation.types'
import type { SupportCategory } from '../../../domain/support/support.types'
import { isActiveCustomerOrder } from '../../../domain/orders/customer-order.view'
import { useOrders } from '../../../features/orders/hooks/useOrders'
import { api } from '../../../services/api'
import { ErrorState, Skeleton } from '../../../shared/components'
import { CustomerPageHeader } from '../components/Stage5Ui'

const options: Array<{ label: string; intent: ChatIntent }> = [
  { label: 'ORDER FOOD', intent: 'START_ORDER' }, { label: 'TRACK MY ORDER', intent: 'TRACK_ORDER' },
  { label: 'CHANGE / CANCEL', intent: 'CANCEL_ORDER' }, { label: 'REPORT PROBLEM', intent: 'REPORT_PROBLEM' },
  { label: 'OFFERS & POINTS', intent: 'LOYALTY_HELP' }, { label: 'MENU QUESTION', intent: 'PRODUCT_QUESTION' },
  { label: 'REFUND STATUS', intent: 'REFUND_STATUS' }, { label: 'TALK TO US', intent: 'TALK_TO_HUMAN' },
]
const activeOptions: Array<{ label: string; intent: ChatIntent }> = [
  { label: 'TRACK ORDER', intent: 'TRACK_ORDER' }, { label: 'CHANGE / CANCEL', intent: 'CANCEL_ORDER' },
  { label: 'REPORT A PROBLEM', intent: 'REPORT_PROBLEM' }, { label: 'PAYMENT HELP', intent: 'REFUND_STATUS' }, { label: 'TALK TO US', intent: 'TALK_TO_HUMAN' },
]
const problems: Array<{ label: string; category: SupportCategory }> = [
  { label: 'Missing item', category: 'MISSING_ITEM' }, { label: 'Wrong item', category: 'WRONG_ITEM' }, { label: 'Food quality', category: 'FOOD_QUALITY' },
  { label: 'Damaged / spilled', category: 'DAMAGED' }, { label: 'Late delivery', category: 'LATE_DELIVERY' }, { label: 'Payment issue', category: 'PAYMENT' }, { label: 'Something else', category: 'OTHER' },
]

export default function SupportPage() {
  const [search] = useSearchParams(); const client = useQueryClient(); const orders = useOrders('CUST001'); const [problemMode, setProblemMode] = useState(false); const [caseId, setCaseId] = useState<string>()
  const activeOrder = orders.data?.find((order) => order.id === search.get('orderId')) ?? orders.data?.find(isActiveCustomerOrder)
  const conversations = useQuery({ queryKey: ['conversations'], queryFn: () => api.chat.getConversations() })
  const conversation = conversations.data?.[0]
  const detail = useQuery({ queryKey: ['conversation', conversation?.id], queryFn: () => api.chat.getConversationDetail(conversation!.id), enabled: Boolean(conversation?.id) })
  const create = useMutation({ mutationFn: () => api.chat.createConversation(), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['conversations'] }) } })
  const send = useMutation({ mutationFn: async ({ intent, label }: { intent: ChatIntent; label: string }) => { const current = conversation ?? await create.mutateAsync(); return api.chat.sendIntent(current.id, intent, label) }, onSuccess: async (result, input) => { await client.invalidateQueries({ queryKey: ['conversation', result.conversation.id] }); if (input.intent === 'REPORT_PROBLEM') setProblemMode(true) } })
  const createCase = useMutation({ mutationFn: async ({ category, label }: { category: SupportCategory; label: string }) => api.support.createSupportCase({ customerId: 'CUST001', category, description: `${label} reported through guided PWA support.`, orderId: activeOrder?.id, conversationId: conversation?.id }), onSuccess: async (result) => { setCaseId(result.id); setProblemMode(false); await client.invalidateQueries({ queryKey: ['support-cases'] }) } })
  if (conversations.isError || detail.isError) return <div className="stage5-page"><ErrorState retry={() => { void conversations.refetch(); void detail.refetch() }} /></div>
  const quickOptions = activeOrder ? activeOptions : options
  return <div className="stage5-page support-page"><CustomerPageHeader eyebrow="GUIDED SUPPORT" title="How can we help?" back="/app/profile" />
    {activeOrder && <Link className="support-order-context" to={`/app/orders/${activeOrder.id}`}><i><MessageCircle /></i><span><small>ACTIVE ORDER</small><strong>How can we help with {activeOrder.publicOrderNumber}?</strong><em>{activeOrder.items.map((item) => item.name).join(' · ')}</em></span><ChevronRight /></Link>}
    <section className="support-chat"><header><div><Bot /></div><span><strong>Pizza Wave Guide</strong><small><i /> Guided answers · online</small></span><b>ONE SHARED THREAD</b></header>
      <div className="chat-thread" aria-live="polite">{!conversation && !create.isPending && <div className="chat-bubble system"><p>Hi Priyanshu! Choose a guided option below for reliable order, menu, points or support help.</p><small>System</small></div>}{detail.isPending && conversation ? <Skeleton className="chat-skeleton" /> : detail.data?.messages.map((message) => <div className={`chat-bubble ${message.from.toLowerCase()} ${message.channel === 'WHATSAPP_SIM' ? 'whatsapp' : ''}`} key={message.id}><p>{message.text}</p><small>{message.from === 'CUSTOMER' ? 'You' : message.from === 'OWNER' ? 'Pizza Wave team' : message.channel === 'WHATSAPP_SIM' ? 'WhatsApp simulation · System' : message.channel === 'PWA_CHAT' ? 'In-App · System' : 'System'}{message.messageType ? ` · ${message.messageType.replaceAll('_', ' ').toLowerCase()}` : ''}</small></div>)}</div>
      {caseId && <div className="support-case-created"><CheckCircle2 /><span><strong>Support case created</strong>{caseId} · The Pizza Wave team can see it in this same shared conversation.</span></div>}
      {problemMode ? <div className="chat-choices problem-choices"><span>WHAT WENT WRONG?</span>{problems.map((problem) => <button key={problem.category} disabled={createCase.isPending} onClick={() => createCase.mutate(problem)}>{problem.label}<ArrowRight /></button>)}</div> : <div className="chat-choices"><span>CHOOSE WHAT YOU NEED</span>{quickOptions.map((option) => <button key={option.label} disabled={send.isPending} onClick={() => send.mutate({ intent: option.intent, label: option.label })}>{option.label}<ArrowRight /></button>)}</div>}
      <footer><ShieldCheck /><span>This demo uses structured intents, not AI. No real WhatsApp message is sent.</span><Send /></footer>
    </section>
    <section className="support-channel-note"><Headphones /><div><strong>One conversation, every channel</strong><p>PWA chat, system updates, the WhatsApp simulation and future team replies share the same stored thread.</p></div><CircleHelp /></section>
  </div>
}
