import { AlertCircle, ArrowLeft, ArrowRight, Check, Clock3, LoaderCircle, LockKeyhole, ShieldCheck, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { env, showDemoTools } from '../../../app/config/env'
import { usePaymentActions, usePaymentStatus } from '../../../features/payment/hooks/usePayment'
import { ErrorState, IconButton, Logo, PrimaryButton, SecondaryButton, Skeleton } from '../../../shared/components'
import { CheckoutSteps } from './CheckoutPage'
import { useAppStore } from '../../../stores/app.store'

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

export default function PaymentPage() {
  const { paymentId = '' } = useParams()
  const navigate = useNavigate()
  const status = usePaymentStatus(paymentId)
  const actions = usePaymentActions()
  const [checking, setChecking] = useState(false)
  const [actionError, setActionError] = useState<string>()
  const setPointsRequested = useAppStore((state) => state.setCheckoutPointsRequested)

  useEffect(() => {
    if (status.data?.payment.status === 'CONFIRMED') setPointsRequested(0)
  }, [setPointsRequested, status.data?.payment.status])

  if (!paymentId) return <section className="full-commerce-flow payment-page"><ErrorState /></section>
  if (status.isPending) return <section className="full-commerce-flow payment-page"><Skeleton className="payment-progress-skeleton" /><Skeleton className="payment-card-skeleton" /></section>
  if (status.isError || !status.data) return <section className="full-commerce-flow payment-page"><ErrorState retry={() => void status.refetch()} /></section>

  const { payment, order } = status.data
  const succeed = async () => {
    setActionError(undefined); setChecking(true)
    try { await wait(1200); await actions.succeed.mutateAsync(payment.id) }
    catch { setActionError('The mock backend could not verify this payment. Please try again.') }
    finally { setChecking(false) }
  }
  const fail = async () => {
    setActionError(undefined)
    try { await actions.fail.mutateAsync(payment.id) }
    catch { setActionError('The mock backend could not update this payment. Please try again.') }
  }
  const keepPending = async () => {
    setActionError(undefined); setChecking(true)
    try { await wait(900); await actions.keepPending.mutateAsync(payment.id) }
    catch { setActionError('The mock backend could not reconcile this payment. Please try again.') }
    finally { setChecking(false) }
  }
  const retry = async () => {
    const initiated = await actions.initiate.mutateAsync(payment.orderIntentId)
    navigate(`/app/payment/${initiated.payment.id}`, { replace: true })
  }

  if (payment.status === 'FAILED') return <section className="full-commerce-flow payment-page">
    <header className="flow-header"><IconButton aria-label="Back to cart" onClick={() => navigate('/app/cart')}><ArrowLeft /></IconButton><div><span>PAYMENT</span><strong>PhonePe demo</strong></div></header><CheckoutSteps active="PAYMENT" />
    <motion.div className="payment-result failed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><div className="result-icon"><AlertCircle /></div><span>PAYMENT FAILED</span><h1>Payment didn't complete.</h1><p>No order was created and your cart remains available.</p><div><PrimaryButton disabled={actions.initiate.isPending} onClick={() => void retry()}>TRY AGAIN <ArrowRight size={18} /></PrimaryButton><SecondaryButton onClick={() => navigate('/app/cart')}>RETURN TO CART</SecondaryButton></div></motion.div>
  </section>

  if (payment.status === 'RECONCILING') return <section className="full-commerce-flow payment-page">
    <header className="flow-header"><div className="flow-logo"><Logo variant="mark" size={32} /></div><div><span>PAYMENT</span><strong>Secure verification</strong></div></header><CheckoutSteps active="PAYMENT" />
    <motion.div className="payment-result reconciling" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="result-icon"><LoaderCircle /></div><span>CHECKING YOUR PAYMENT…</span><h1>We’re reconciling with PhonePe.</h1><p>This demo payment is still pending. Keep this page open; backend status remains authoritative.</p><div className="reconcile-note"><Clock3 /><span>RECONCILING</span></div></motion.div>
  </section>

  if (payment.status === 'CONFIRMED' && order) return <section className="full-commerce-flow payment-page">
    <header className="flow-header"><div className="flow-logo"><Logo variant="mark" size={32} /></div><div><span>ORDER {order.publicOrderNumber}</span><strong>Pizza Wave · Grand Road</strong></div></header><CheckoutSteps active="DONE" />
    <motion.div className="payment-result received" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }}><div className="result-icon"><Check /></div><span>BACKEND VERIFIED</span><h1>PAYMENT RECEIVED ✓</h1><p>{order.acceptanceStatus === 'ACCEPTED' ? 'Your order is confirmed and synchronized with the kitchen.' : order.acceptanceStatus === 'REJECTED' ? 'The kitchen could not safely accept this order.' : "We're confirming your order with Pizza Wave…"}</p><div className="awaiting-card">{order.acceptanceStatus === 'ACCEPTED' ? <Check /> : order.acceptanceStatus === 'REJECTED' ? <AlertCircle /> : <LoaderCircle />}<div><span>{order.acceptanceStatus === 'ACCEPTED' ? 'ORDER CONFIRMED' : order.acceptanceStatus === 'REJECTED' ? 'REFUND STARTED' : order.acceptanceStatus === 'REVIEW_REQUIRED' ? 'KITCHEN REVIEW' : 'AWAITING ACCEPTANCE'}</span><strong>{order.acceptanceStatus === 'ACCEPTED' ? 'Your order is in the system kitchen queue.' : order.acceptanceStatus === 'REJECTED' ? 'Your full refund is being processed automatically.' : 'The store is reviewing your paid order.'}</strong></div></div><div className="received-meta"><div><span>PAID</span><strong>₹{payment.amount}</strong></div><div><span>POINTS PENDING</span><strong>+{order.financialSnapshot.pointsToEarn}</strong></div></div><PrimaryButton onClick={() => navigate(order.acceptanceStatus === 'REJECTED' ? '/app/support' : `/app/orders/${order.id}`)}>{order.acceptanceStatus === 'REJECTED' ? 'VIEW REFUND HELP' : 'TRACK ORDER'}</PrimaryButton><small>{order.acceptanceStatus === 'ACCEPTED' ? 'Live changes will appear without refreshing.' : 'Payment and acceptance remain separate backend states.'}</small></motion.div>
  </section>

  return <section className="full-commerce-flow payment-page">
    <header className="flow-header"><IconButton aria-label="Back to checkout" onClick={() => navigate('/app/checkout')}><ArrowLeft /></IconButton><div><span>PAYMENT</span><strong>PhonePe demo</strong></div><LockKeyhole /></header><CheckoutSteps active="PAYMENT" />
    {checking ? <motion.div className="payment-result checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="result-icon"><LoaderCircle /></div><span>CHECKING YOUR PAYMENT…</span><h1>Verifying with the mock backend.</h1><p>The browser return does not decide payment success.</p></motion.div> : <motion.div className="phonepe-demo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="demo-ribbon">{env.VITE_PITCH_MODE ? 'SECURE DEMO · NO REAL CHARGE' : 'DEMO PAYMENT SIMULATION'}</div><div className="phonepe-head"><div><Smartphone /></div><div><span>PAY WITH</span><strong>PhonePe</strong></div><ShieldCheck /></div><div className="merchant-block"><span>PAYING</span><strong>The Pizza Wave</strong><small>Grand Road, Puri</small></div><div className="payment-amount"><span>TOTAL</span><strong>₹{payment.amount}</strong></div><div className="upi-row"><i>UPI</i><div><strong>PhonePe UPI</strong><span>Demo account · no real money moves</span></div><Check /></div>
      {actionError && <p className="flow-error" role="alert">{actionError}</p>}
      {env.VITE_PITCH_MODE ? <div className="pitch-payment-action"><PrimaryButton disabled={checking || actions.succeed.isPending} onClick={() => void succeed()}>PAY ₹{payment.amount} SECURELY <ArrowRight size={18} /></PrimaryButton><small>Prototype payment · no real money will move</small></div> : showDemoTools ? <div className="demo-payment-actions"><span>CHOOSE A DEMO OUTCOME</span><PrimaryButton disabled={actions.succeed.isPending} onClick={() => void succeed()}>PAY SUCCESS</PrimaryButton><SecondaryButton disabled={actions.fail.isPending} onClick={() => void fail()}>PAY FAILURE</SecondaryButton><button type="button" disabled={actions.keepPending.isPending} onClick={() => void keepPending()}>KEEP PENDING</button></div> : <div className="provider-wait"><LoaderCircle /><span>Waiting for payment provider status</span></div>}
    </motion.div>}
  </section>
}
