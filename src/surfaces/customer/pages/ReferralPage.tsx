import { ArrowRight, Check, Gift, Send, Sparkles, UserPlus, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useReferrals, useRetentionActions } from '../../../features/retention/hooks/useRetention'
import { EmptyState, ErrorState, PrimaryButton, Skeleton } from '../../../shared/components'
import { CustomerPageHeader } from '../components/Stage5Ui'

const labels = { INVITED: 'Invited', SIGNED_UP: 'Signed up', FIRST_ORDER_PENDING: 'First order pending', QUALIFIED: 'Qualified', REWARDED: 'Rewarded' } as const

export default function ReferralPage() {
  const referrals = useReferrals(); const actions = useRetentionActions(); const [friendName, setFriendName] = useState(''); const [phone, setPhone] = useState('')
  const submit = () => actions.createReferral.mutate({ friendName, phone }, { onSuccess: () => { setFriendName(''); setPhone('') } })
  if (referrals.isError) return <div className="stage5-page"><ErrorState retry={() => void referrals.refetch()} /></div>
  return <div className="stage5-page referral-page"><CustomerPageHeader eyebrow="SHARE THE WAVE" title="Refer a friend" back="/app" />
    <section className="referral-stage9-hero"><Gift /><div><span>GIVE ₹50 · GET 60 POINTS</span><h2>Pizza tastes better shared.</h2><p>Your friend gets ₹50 toward their first order. You earn 60 Wave Points only after that order is completed.</p></div></section>
    <section className="referral-invite"><span>SEND A DEMO INVITE</span><h2>Who should join the Wave?</h2><label>FRIEND’S NAME<input value={friendName} onChange={(event) => setFriendName(event.target.value)} placeholder="Riya" /></label><label>PHONE<input inputMode="numeric" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit phone" /></label><PrimaryButton disabled={!friendName.trim() || phone.length !== 10 || actions.createReferral.isPending} onClick={submit}><Send /> {actions.createReferral.isPending ? 'PREPARING…' : 'SEND WHATSAPP SIMULATION'}</PrimaryButton><small>No real message is sent. Signup alone never unlocks a reward.</small></section>
    <section className="referral-how"><div><UserPlus /><strong>1 · Invite</strong><span>Friend opens the demo link</span></div><div><UsersRound /><strong>2 · First order</strong><span>They place and complete it</span></div><div><Sparkles /><strong>3 · Reward</strong><span>60 points unlock automatically</span></div></section>
    <section className="referral-progress"><div><span>DEMO REFERRAL JOURNEY</span><h2>Every state, clearly earned.</h2></div>{referrals.isPending ? <Skeleton /> : referrals.data?.length ? referrals.data.map((row) => <article key={row.id} className={`status-${row.status.toLowerCase()}`}><i>{row.status === 'REWARDED' ? <Check /> : <ArrowRight />}</i><div><strong>{row.friendName}</strong><span>{row.maskedPhone}</span></div><b>{labels[row.status]}</b><em>{row.rewardPoints ? `+${row.rewardPoints} pts` : 'No reward yet'}</em>{row.status !== 'REWARDED' && <button disabled={actions.advanceReferral.isPending} onClick={() => actions.advanceReferral.mutate(row.id)}>ADVANCE DEMO</button>}</article>) : <EmptyState title="No invitations yet" message="Prepare the first demo invitation above." />}</section>
  </div>
}
