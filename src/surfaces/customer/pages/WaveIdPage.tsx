import { Clock3, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useWaveId } from '../../../features/customer/hooks/useCustomerExperience'
import { ErrorState, Logo, Skeleton } from '../../../shared/components'
import { CustomerPageHeader } from '../components/Stage5Ui'

function TokenPattern({ token }: { token: string }) {
  const cells = useMemo(() => Array.from({ length: 121 }, (_, index) => ((token.charCodeAt(index % token.length) * (index + 3) + index) % 7) < 3), [token])
  return <div className="wave-qr" role="img" aria-label="Short-lived demo Wave ID code">{cells.map((filled, index) => <i className={filled ? 'filled' : ''} key={index} />)}<span><Logo variant="mark" size={24} /></span></div>
}

export default function WaveIdPage() {
  const waveId = useWaveId(); const [seconds, setSeconds] = useState(60)
  useEffect(() => { setSeconds(60); const timer = window.setInterval(() => setSeconds((value) => value > 1 ? value - 1 : 60), 1000); return () => window.clearInterval(timer) }, [waveId.data?.token])
  if (waveId.isError) return <div className="stage5-page"><ErrorState retry={() => void waveId.refetch()} /></div>
  return <div className="stage5-page wave-id-page"><CustomerPageHeader eyebrow="IN-STORE LINK" title="My Wave ID" back="/app/profile" />
    {!waveId.data ? <Skeleton className="wave-id-skeleton" /> : <section className="wave-id-card"><div className="wave-id-brand"><Logo variant="full" theme="light" size="sm" /><strong>{waveId.data.firstName}</strong><small>{waveId.data.tier} WAVE · {waveId.data.pointsAvailable} POINTS</small></div><TokenPattern token={waveId.data.token} /><div className="wave-id-timer"><Clock3 /><span>Refreshes in <strong>{seconds}s</strong></span><button className="icon-button" aria-label="Refresh Wave ID" onClick={() => void waveId.refetch()}><RefreshCw /></button></div></section>}
    <section className="wave-id-help"><ShieldCheck /><div><h2>Safe to show at the counter</h2><p>This one-time demo token links your Wave wallet to an in-store order. It never contains your phone number or customer ID.</p></div></section>
    <ol className="wave-id-steps"><li><i>1</i><span><strong>Open this screen</strong>When ordering at Grand Road</span></li><li><i>2</i><span><strong>Let the counter scan</strong>The token works for 60 seconds</span></li><li><i>3</i><span><strong>Earn in one wallet</strong>Points join your delivery and pickup history</span></li></ol>
  </div>
}
