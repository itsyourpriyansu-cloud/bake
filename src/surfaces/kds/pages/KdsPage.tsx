import { useMutation } from '@tanstack/react-query'
import { LogOut, Radio, ShieldCheck, Tablet } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { showDemoTools } from '../../../app/config/env'
import { readKdsSession, sessionKeys } from '../../../app/router/routeGuards'
import { useKdsActions, useKdsHeartbeat } from '../../../features/kds/hooks/useKds'
import { kdsLogin } from '../../../services/api/auth.api'
import { Logo, PrimaryButton, SecondaryButton, TextInput } from '../../../shared/components'
import type { KdsSession } from '../../../shared/types/domain'

function KdsLogin({ onSuccess }: { onSuccess: (session: KdsSession) => void }) {
  const [pin, setPin] = useState('')
  const login = useMutation({
    mutationFn: () => kdsLogin(pin),
    onSuccess: (serverSession) => {
      const session: KdsSession = { realm: 'kds', device: serverSession.device, expiresAt: serverSession.expiresAt }
      sessionStorage.setItem(sessionKeys.kds, JSON.stringify(session))
      onSuccess(session)
    },
  })
  const submit = (event: FormEvent) => { event.preventDefault(); login.mutate() }
  return <main className="kds-login-page"><section className="kds-login-brand"><div className="kds-login-mark"><Logo variant="mark" size={48} /></div><span>THE PIZZA WAVE · GRAND ROAD</span><h1>KITCHEN<br />COMMAND.</h1><p>System timing, clear tickets and large controls for a focused service.</p><div><ShieldCheck /><strong>Trusted device</strong><span>Kitchen Tablet #1</span></div></section><section className="kds-login-panel"><form className="kds-login-card" onSubmit={submit}><Tablet /><span>SEPARATE KDS REALM</span><h2>Start chef shift</h2><p>This shift can prepare orders and manage temporary availability only.</p><TextInput label="4-digit Chef PIN" type="password" inputMode="numeric" autoComplete="one-time-code" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} />{login.isError && <p className="kds-form-error" role="alert">Chef PIN did not match this trusted device.</p>}<PrimaryButton type="submit" disabled={login.isPending || pin.length !== 4}>{login.isPending ? 'VERIFYING…' : 'START SHIFT'}</PrimaryButton><small>Demo PIN: 2580 · 12-hour shift session</small></form></section></main>
}

export default function KdsPage() {
  const [session, setSession] = useState<KdsSession | null>(() => readKdsSession())
  const heartbeat = useKdsHeartbeat(Boolean(session))
  const actions = useKdsActions()
  if (!session) return <KdsLogin onSuccess={setSession} />
  const endShift = () => {
    actions.heartbeat.mutate(false)
    sessionStorage.removeItem(sessionKeys.kds)
    setSession(null)
  }
  return <main className="kds-app"><header className="kds-header"><div className="kds-wordmark"><Logo variant="mark" size="sm" /><div><strong>KITCHEN DISPLAY</strong><small>Kitchen Tablet #1</small></div></div><nav aria-label="KDS screens"><NavLink to="/kds/" end>QUEUE</NavLink><NavLink to="/kds/availability">AVAILABILITY</NavLink></nav><div className="kds-header-actions"><span className={`kds-heartbeat ${heartbeat.data?.online === false ? 'offline' : ''}`}><Radio /> {heartbeat.data?.online === false ? 'OFFLINE' : 'KDS ONLINE'}</span>{showDemoTools && <button type="button" className="kds-demo-offline" onClick={() => actions.heartbeat.mutate(heartbeat.data?.online === false)}>{heartbeat.data?.online === false ? 'RESTORE HEARTBEAT' : 'DEMO: KDS OFFLINE'}</button>}<SecondaryButton onClick={endShift}><LogOut /> END SHIFT</SecondaryButton></div></header><Outlet /></main>
}
