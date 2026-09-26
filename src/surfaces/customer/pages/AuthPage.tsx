import { ArrowLeft, ArrowRight, Check, MessageCircle, ShieldCheck, Smartphone } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCustomerAuthActions } from '../../../features/auth/hooks/useCustomerAuth'
import { useDemo } from '../../../app/providers/DemoProvider'
import { IconButton, OTPInput, PrimaryButton, SecondaryButton, TextInput } from '../../../shared/components'

type AuthStep = 'PHONE' | 'OTP' | 'VERIFIED'

export default function AuthPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnToParam = params.get('returnTo')
  const returnTo = returnToParam?.startsWith('/app/') ? returnToParam : '/app/'
  const [step, setStep] = useState<AuthStep>('PHONE')
  const [phone, setPhone] = useState('9876543210')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string>()
  const auth = useCustomerAuthActions()
  const { authenticateCustomer } = useDemo()

  const sendOtp = async (event: FormEvent) => {
    event.preventDefault(); setError(undefined)
    if (!/^\d{10}$/.test(phone)) { setError('Enter a valid 10-digit phone number.'); return }
    try { await auth.requestOtp.mutateAsync(phone); setStep('OTP') } catch { setError('We could not send the demo OTP. Try again.') }
  }
  const verify = async (event: FormEvent) => {
    event.preventDefault(); setError(undefined)
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return }
    try {
      const session = await auth.verifyOtp.mutateAsync({ phone, otp })
      authenticateCustomer(session); setStep('VERIFIED')
    } catch { setError('That OTP did not match. Use the demo OTP shown below.') }
  }

  return <section className="auth-page full-commerce-flow">
    <header className="flow-header"><IconButton aria-label="Go back" onClick={() => navigate(-1)}><ArrowLeft /></IconButton><div><span>THE PIZZA WAVE</span><strong>Secure checkout sign-in</strong></div></header>
    <div className="auth-layout">
      <div className="auth-brand"><div className="auth-brand-mark"><Smartphone /><MessageCircle /></div><span>ONE WAVE ACCOUNT</span><h1>{step === 'VERIFIED' ? 'YOU’RE IN.' : 'SIGN IN. ORDER. EARN.'}</h1><p>Your order history, Gold status and Wave Points stay together across Delivery and Pickup.</p></div>
      <motion.div className="auth-card" key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {step === 'PHONE' && <form onSubmit={(event) => void sendOtp(event)}><div className="flow-card-heading"><span>STEP 1 OF 2</span><h2>What’s your number?</h2><p>We’ll send a fake WhatsApp OTP for this prototype.</p></div><TextInput label="Phone number" inputMode="numeric" autoComplete="tel" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))} />{error && <p className="flow-error" role="alert">{error}</p>}<PrimaryButton type="submit" disabled={auth.requestOtp.isPending}>SEND WHATSAPP OTP <ArrowRight size={18} /></PrimaryButton></form>}
        {step === 'OTP' && <form onSubmit={(event) => void verify(event)}><div className="flow-card-heading"><span>STEP 2 OF 2</span><h2>Check WhatsApp</h2><p>OTP sent to +91 {phone.slice(0, 5)} {phone.slice(5)}.</p></div><OTPInput value={otp} onChange={setOtp} /><div className="demo-credential"><ShieldCheck /><div><span>DEMO-ONLY OTP</span><strong>123456</strong></div></div>{error && <p className="flow-error" role="alert">{error}</p>}<PrimaryButton type="submit" disabled={auth.verifyOtp.isPending}>VERIFY & CONTINUE <ArrowRight size={18} /></PrimaryButton><SecondaryButton type="button" onClick={() => { setStep('PHONE'); setOtp(''); setError(undefined) }}>CHANGE NUMBER</SecondaryButton></form>}
        {step === 'VERIFIED' && <div className="verified-state"><div className="verified-check"><Check /></div><span>PHONE VERIFIED</span><h2>Welcome back, Priyanshu.</h2><p>Gold Wave · 182 points are ready on this account.</p><PrimaryButton onClick={() => navigate(returnTo, { replace: true })}>CONTINUE <ArrowRight size={18} /></PrimaryButton></div>}
      </motion.div>
    </div>
  </section>
}
